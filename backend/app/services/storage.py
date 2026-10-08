from io import BufferedReader, FileIO
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import BinaryIO

from supabase import Client


class StorageService:
    def __init__(self, client: Client, bucket: str) -> None:
        self._client = client
        self._bucket = bucket

    def upload_file(self, path: str, content: bytes | BinaryIO, content_type: str) -> None:
        bucket = self._client.storage.from_(self._bucket)
        options = {"content-type": content_type, "upsert": "false"}
        if isinstance(content, (bytes, BufferedReader, FileIO)):
            bucket.upload(path, content, file_options=options)
            return

        # Supabase's SDK accepts bytes, BufferedReader, and FileIO. FastAPI's
        # SpooledTemporaryFile is not among those types, so stage it in bounded
        # chunks rather than copying a potentially 50 MiB upload into memory.
        position = content.tell()
        temporary_path = None
        try:
            content.seek(0)
            with NamedTemporaryFile(delete=False) as temporary_file:
                temporary_path = temporary_file.name
                while chunk := content.read(1024 * 1024):
                    temporary_file.write(chunk)
            bucket.upload(path, temporary_path, file_options=options)
        finally:
            content.seek(position)
            if temporary_path:
                Path(temporary_path).unlink(missing_ok=True)

    def delete_file(self, path: str) -> None:
        self._client.storage.from_(self._bucket).remove([path])

    def download_file(self, path: str) -> bytes:
        return self._client.storage.from_(self._bucket).download(path)
