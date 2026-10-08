from functools import lru_cache
from typing import Annotated

from pydantic import Field, HttpUrl, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: HttpUrl
    supabase_anon_key: str = Field(min_length=1)
    supabase_service_role_key: str = Field(min_length=1)
    supabase_storage_bucket: str = Field(min_length=1)
    cors_origins: Annotated[list[str], NoDecode] = ["http://localhost:3000", "http://localhost:5173"]
    max_upload_size_bytes: int = Field(default=50 * 1024 * 1024, gt=0)
    similarity_threshold: float = Field(default=0.85, ge=0, le=1)
    high_similarity_threshold: float = Field(default=0.95, ge=0, le=1)
    max_similarity_candidates: int = Field(default=500, gt=0, le=5000)
    max_extracted_text_chars: int = Field(default=30000, gt=0, le=200000)

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: object) -> list[str] | object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("high_similarity_threshold")
    @classmethod
    def high_threshold_must_not_be_lower(cls, value: float, info: ValidationInfo) -> float:
        similarity_threshold = info.data.get("similarity_threshold", 0.85)
        if value < similarity_threshold:
            raise ValueError("HIGH_SIMILARITY_THRESHOLD must be >= SIMILARITY_THRESHOLD")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
