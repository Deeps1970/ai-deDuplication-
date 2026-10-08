import hashlib
from typing import BinaryIO


def calculate_sha256(file_obj: BinaryIO, chunk_size: int = 1024 * 1024) -> str:
    """Hash file bytes in chunks, restoring the stream position before returning."""
    original_position = file_obj.tell()
    digest = hashlib.sha256()
    try:
        file_obj.seek(0)
        while chunk := file_obj.read(chunk_size):
            digest.update(chunk)
        return digest.hexdigest()
    finally:
        file_obj.seek(original_position)
