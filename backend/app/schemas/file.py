from pydantic import BaseModel


class FileMetadata(BaseModel):
    id: str
    original_filename: str
    file_size: int
    mime_type: str
    storage_path: str
    created_at: str
    file_hash: str | None = None
    deduplication_status: str | None = None
    similarity_score: float | None = None
    duplicate_of: str | None = None
    analysis_status: str | None = None
    analyzed_at: str | None = None


class FileUploadData(BaseModel):
    id: str
    original_filename: str
    file_size: int
    mime_type: str
    storage_path: str
    file_hash: str | None = None
    deduplication_status: str | None = None
    similarity_score: float | None = None
    duplicate_of: str | None = None
    analysis_status: str | None = None
    storage_saved: bool = False


class FileAnalysisResponse(BaseModel):
    success: bool = True
    file: FileUploadData


class DuplicateEntry(BaseModel):
    id: str
    filename: str
    similarity_score: float | None


class DuplicateGroup(BaseModel):
    primary_file: dict[str, str]
    duplicates: list[DuplicateEntry]


class DuplicateGroupsResponse(BaseModel):
    success: bool = True
    groups: list[DuplicateGroup]


class AnalyticsResponse(BaseModel):
    total_files: int
    unique_files: int
    duplicate_files: int
    similar_files: int
    original_storage_bytes: int
    actual_storage_bytes: int
    estimated_storage_saved_bytes: int
    deduplication_rate: float


class FileUploadResponse(BaseModel):
    success: bool = True
    file: FileUploadData


class FileListResponse(BaseModel):
    success: bool = True
    files: list[FileMetadata]


class FileDetailResponse(BaseModel):
    success: bool = True
    file: FileMetadata
