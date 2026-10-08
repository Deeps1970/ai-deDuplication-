import logging
import uuid
from datetime import UTC, datetime
from io import BytesIO
from pathlib import PurePath
from typing import BinaryIO

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.config import get_settings
from app.database import get_supabase_client
from app.models.file import FileRecord
from app.schemas.file import (
    AnalyticsResponse,
    DuplicateEntry,
    DuplicateGroup,
    DuplicateGroupsResponse,
    FileAnalysisResponse,
    FileDetailResponse,
    FileListResponse,
    FileMetadata,
    FileUploadData,
    FileUploadResponse,
)
from app.services.deduplication_service import DeduplicationService
from app.services.storage import StorageService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/files", tags=["Files"])
analytics_router = APIRouter(tags=["Analytics"])
FILE_COLUMNS = (
    "id,original_filename,stored_filename,file_size,mime_type,storage_path,created_at,"
    "file_hash,deduplication_status,similarity_score,duplicate_of,analysis_status,analyzed_at"
)


def _metadata(record: FileRecord) -> FileMetadata:
    return FileMetadata(**record.model_dump())


def _upload_data(record: FileRecord, storage_saved: bool = False) -> FileUploadData:
    return FileUploadData(
        id=record.id,
        original_filename=record.original_filename,
        file_size=record.file_size,
        mime_type=record.mime_type,
        storage_path=record.storage_path,
        file_hash=record.file_hash,
        deduplication_status=record.deduplication_status,
        similarity_score=record.similarity_score,
        duplicate_of=record.duplicate_of,
        analysis_status=record.analysis_status,
        storage_saved=storage_saved,
    )


def _file_size(file_obj: BinaryIO) -> int:
    file_obj.seek(0, 2)
    size = file_obj.tell()
    file_obj.seek(0)
    return size


def _persist_analysis(client, file_id: str, extracted_text: str | None) -> None:
    if extracted_text:
        client.table("file_analysis").upsert(
            {"file_id": file_id, "extracted_text": extracted_text}, on_conflict="file_id"
        ).execute()
    else:
        client.table("file_analysis").delete().eq("file_id", file_id).execute()


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_file(file: UploadFile | None = File(default=None)) -> FileUploadResponse:
    if file is None:
        raise HTTPException(status_code=400, detail="A file is required.")

    settings = get_settings()
    original_filename = PurePath(file.filename or "").name.strip()
    if not original_filename or original_filename in {".", ".."}:
        raise HTTPException(status_code=400, detail="A valid filename is required.")

    stream = file.file
    file_size = _file_size(stream)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if file_size > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail="The uploaded file exceeds the size limit.")

    mime_type = file.content_type or "application/octet-stream"
    stored_filename = f"{uuid.uuid4().hex}{PurePath(original_filename).suffix[:20]}"
    storage_path = f"uploads/{stored_filename}"
    client = get_supabase_client()
    storage = StorageService(client, settings.supabase_storage_bucket)
    service = DeduplicationService(client, settings)
    uploaded_to_storage = False
    metadata_inserted = False

    try:
        result = service.analyze(stream, original_filename)
        if result.deduplication_status == "duplicate" and result.duplicate_of:
            primary_result = client.table("files").select(
                "id,stored_filename,storage_path"
            ).eq("id", result.duplicate_of).single().execute()
            stored_filename = primary_result.data["stored_filename"]
            storage_path = primary_result.data["storage_path"]
        else:
            stream.seek(0)
            storage.upload_file(storage_path, stream, mime_type)
            uploaded_to_storage = True

        now = datetime.now(UTC).isoformat()
        row = {
            "original_filename": original_filename,
            "stored_filename": stored_filename,
            "file_size": file_size,
            "mime_type": mime_type,
            "storage_path": storage_path,
            "file_hash": result.file_hash,
            "deduplication_status": result.deduplication_status,
            "similarity_score": result.similarity_score,
            "duplicate_of": result.duplicate_of,
            "analysis_status": result.analysis_status,
            "analyzed_at": now,
        }
        insert_result = client.table("files").insert(row).execute()
        if not insert_result.data:
            raise RuntimeError("File metadata insert returned no row")
        record = FileRecord.from_row(insert_result.data[0])
        metadata_inserted = True
        try:
            _persist_analysis(client, record.id, result.extracted_text)
        except Exception:
            logger.exception("Could not persist extracted text for file id=%s", record.id)
            try:
                client.table("files").update({"analysis_status": "failed"}).eq("id", record.id).execute()
            except Exception:
                logger.exception("Could not mark file analysis as failed for file id=%s", record.id)
            record.analysis_status = "failed"
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("File upload and analysis failed")
        if uploaded_to_storage and not metadata_inserted:
            try:
                storage.delete_file(storage_path)
            except Exception:
                logger.exception("Could not clean up uploaded object after metadata failure")
        raise HTTPException(status_code=502, detail="Could not store the uploaded file.") from exc
    finally:
        file.file.close()

    logger.info("Stored file metadata id=%s status=%s", record.id, record.deduplication_status)
    return FileUploadResponse(file=_upload_data(record, result.storage_saved))


@router.get("", response_model=FileListResponse)
def list_files() -> FileListResponse:
    try:
        result = get_supabase_client().table("files").select(FILE_COLUMNS).order(
            "created_at", desc=True
        ).execute()
        records = [FileRecord.from_row(row) for row in result.data]
        return FileListResponse(files=[_metadata(record) for record in records])
    except Exception as exc:
        logger.exception("Could not list file metadata")
        raise HTTPException(status_code=502, detail="Could not retrieve files.") from exc


@router.get("/duplicates", response_model=DuplicateGroupsResponse)
def duplicate_groups() -> DuplicateGroupsResponse:
    client = get_supabase_client()
    try:
        duplicates = client.table("files").select(
            "id,original_filename,duplicate_of,similarity_score,storage_path"
        ).eq("deduplication_status", "duplicate").execute().data or []
        primary_ids = list({row["duplicate_of"] for row in duplicates if row.get("duplicate_of")})
        if not primary_ids:
            return DuplicateGroupsResponse(groups=[])
        primaries = client.table("files").select(
            "id,original_filename"
        ).in_("id", primary_ids).execute().data or []
        primary_by_id = {row["id"]: row for row in primaries}
        grouped: dict[str, list[DuplicateEntry]] = {}
        for row in duplicates:
            primary_id = row.get("duplicate_of")
            if primary_id in primary_by_id:
                grouped.setdefault(primary_id, []).append(
                    DuplicateEntry(
                        id=row["id"],
                        filename=row["original_filename"],
                        similarity_score=row.get("similarity_score"),
                    )
                )
        return DuplicateGroupsResponse(
            groups=[
                DuplicateGroup(
                    primary_file={
                        "id": primary_by_id[file_id]["id"],
                        "filename": primary_by_id[file_id]["original_filename"],
                    },
                    duplicates=entries,
                )
                for file_id, entries in grouped.items()
            ]
        )
    except Exception as exc:
        logger.exception("Could not retrieve duplicate groups")
        raise HTTPException(status_code=502, detail="Could not retrieve duplicate groups.") from exc


@router.post("/{file_id}/analyze", response_model=FileAnalysisResponse)
def analyze_existing_file(file_id: str) -> FileAnalysisResponse:
    try:
        normalized_id = str(uuid.UUID(file_id))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid file ID.") from None

    client = get_supabase_client()
    settings = get_settings()
    storage = StorageService(client, settings.supabase_storage_bucket)
    try:
        selected = client.table("files").select(FILE_COLUMNS).eq("id", normalized_id).maybe_single().execute()
        if not selected.data:
            raise HTTPException(status_code=404, detail="File not found.")
        current = FileRecord.from_row(selected.data)
        content = storage.download_file(current.storage_path)
        if len(content) > settings.max_upload_size_bytes:
            raise HTTPException(status_code=413, detail="The stored file exceeds the analysis size limit.")
        stream = BytesIO(content)
        result = DeduplicationService(client, settings).analyze(
            stream, current.original_filename, exclude_file_id=normalized_id
        )
        updated = client.table("files").update(
            {
                "file_hash": result.file_hash,
                "deduplication_status": result.deduplication_status,
                "similarity_score": result.similarity_score,
                "duplicate_of": result.duplicate_of,
                "analysis_status": result.analysis_status,
                "analyzed_at": datetime.now(UTC).isoformat(),
            }
        ).eq("id", normalized_id).execute()
        if not updated.data:
            raise RuntimeError("File analysis update returned no row")
        _persist_analysis(client, normalized_id, result.extracted_text)
        record = FileRecord.from_row(updated.data[0])
        return FileAnalysisResponse(file=_upload_data(record, result.storage_saved))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not analyze file id=%s", normalized_id)
        raise HTTPException(status_code=502, detail="Could not analyze the file.") from exc


@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file(file_id: str) -> FileDetailResponse:
    try:
        file_uuid = str(uuid.UUID(file_id))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid file ID.") from None

    try:
        result = get_supabase_client().table("files").select(FILE_COLUMNS).eq(
            "id", file_uuid
        ).maybe_single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="File not found.")
        return FileDetailResponse(file=_metadata(FileRecord.from_row(result.data)))
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not retrieve file metadata")
        raise HTTPException(status_code=502, detail="Could not retrieve file.") from exc


@analytics_router.get("/analytics", response_model=AnalyticsResponse)
def analytics() -> AnalyticsResponse:
    client = get_supabase_client()
    try:
        rows: list[dict] = []
        page_size = 1000
        offset = 0
        while True:
            page = client.table("files").select(
                "file_size,storage_path,deduplication_status"
            ).range(offset, offset + page_size - 1).execute().data or []
            rows.extend(page)
            if len(page) < page_size:
                break
            offset += page_size

        total = len(rows)
        duplicates = sum(row.get("deduplication_status") == "duplicate" for row in rows)
        similar = sum(row.get("deduplication_status") == "similar" for row in rows)
        unique = sum(row.get("deduplication_status") == "unique" for row in rows)
        original_bytes = sum(int(row["file_size"]) for row in rows)
        physical_by_path: dict[str, int] = {}
        for row in rows:
            physical_by_path.setdefault(row["storage_path"], int(row["file_size"]))
        actual_bytes = sum(physical_by_path.values())
        saved_bytes = max(0, original_bytes - actual_bytes)
        return AnalyticsResponse(
            total_files=total,
            unique_files=unique,
            duplicate_files=duplicates,
            similar_files=similar,
            original_storage_bytes=original_bytes,
            actual_storage_bytes=actual_bytes,
            estimated_storage_saved_bytes=saved_bytes,
            deduplication_rate=round(duplicates / total * 100, 2) if total else 0.0,
        )
    except Exception as exc:
        logger.exception("Could not calculate analytics")
        raise HTTPException(status_code=502, detail="Could not calculate analytics.") from exc
