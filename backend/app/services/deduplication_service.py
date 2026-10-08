import logging
from dataclasses import dataclass
from typing import BinaryIO

from supabase import Client

from app.config import Settings
from app.services.hash_service import calculate_sha256
from app.services.similarity_service import find_most_similar
from app.services.text_extraction import extract_text

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DeduplicationResult:
    file_hash: str
    deduplication_status: str
    similarity_score: float | None
    duplicate_of: str | None
    analysis_status: str
    extracted_text: str | None
    storage_saved: bool


class DeduplicationService:
    def __init__(self, client: Client, settings: Settings) -> None:
        self._client = client
        self._settings = settings

    def analyze(
        self, file_obj: BinaryIO, filename: str, exclude_file_id: str | None = None
    ) -> DeduplicationResult:
        digest = calculate_sha256(file_obj)
        exact = self._find_exact_match(digest, exclude_file_id)
        if exact:
            return DeduplicationResult(
                file_hash=digest,
                deduplication_status="duplicate",
                similarity_score=1.0,
                duplicate_of=exact["id"],
                analysis_status="completed",
                extracted_text=None,
                storage_saved=exclude_file_id is None,
            )

        try:
            text, analysis_status = extract_text(
                file_obj, filename, self._settings.max_extracted_text_chars
            )
        except Exception:
            logger.exception("Text extraction failed for uploaded file")
            return DeduplicationResult(digest, "unique", None, None, "failed", None, False)

        if analysis_status == "unsupported" or not text:
            return DeduplicationResult(
                digest, "unique", None, None, analysis_status, text or None, False
            )

        candidates = self._text_candidates(exclude_file_id, digest)
        match = find_most_similar(text, candidates)
        if match is None:
            return DeduplicationResult(digest, "unique", None, None, "completed", text, False)
        if match.score < self._settings.similarity_threshold:
            return DeduplicationResult(
                digest, "unique", match.score, None, "completed", text, False
            )

        # High similarity remains a text-similarity classification, never a byte duplicate.
        if match.score >= self._settings.high_similarity_threshold:
            logger.info("High textual similarity %.4f with file id=%s", match.score, match.file_id)
        return DeduplicationResult(
            digest, "similar", match.score, match.file_id, "completed", text, False
        )

    def _find_exact_match(self, digest: str, exclude_file_id: str | None) -> dict | None:
        query = self._client.table("files").select(
            "id,duplicate_of,storage_path,stored_filename"
        ).eq("file_hash", digest).order("created_at").limit(100)
        rows = query.execute().data or []
        return next(
            (
                row for row in rows
                if row["id"] != exclude_file_id and row.get("duplicate_of") is None
            ),
            None,
        )

    def _text_candidates(
        self, exclude_file_id: str | None, current_hash: str
    ) -> list[tuple[str, str]]:
        query = self._client.table("files").select("id,file_hash").eq(
            "analysis_status", "completed"
        )
        if exclude_file_id:
            query = query.neq("id", exclude_file_id)
        rows = query.order("created_at", desc=True).limit(
            self._settings.max_similarity_candidates
        ).execute().data or []
        file_ids = [row["id"] for row in rows if row.get("file_hash") != current_hash]
        if not file_ids:
            return []
        analyses = self._client.table("file_analysis").select(
            "file_id,extracted_text"
        ).in_("file_id", file_ids).execute().data or []
        return [
            (row["file_id"], row["extracted_text"])
            for row in analyses
            if row.get("extracted_text")
        ]
