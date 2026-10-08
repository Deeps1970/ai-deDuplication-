from typing import Any

from pydantic import BaseModel, ConfigDict


class FileRecord(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
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

    model_config = ConfigDict(extra="ignore")

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "FileRecord":
        return cls.model_validate(row)
