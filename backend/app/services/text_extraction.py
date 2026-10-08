from io import BytesIO
from pathlib import PurePath
from typing import BinaryIO

from docx import Document
from pypdf import PdfReader

from app.services.text_preprocessing import normalize_text

SUPPORTED_EXTENSIONS = {".txt", ".pdf", ".docx"}


def extract_text(file_obj: BinaryIO, filename: str, max_chars: int) -> tuple[str, str]:
    """Return normalized extracted text and completed/unsupported status."""
    extension = PurePath(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        return "", "unsupported"

    file_obj.seek(0)
    if extension == ".txt":
        text = file_obj.read(max_chars * 4).decode("utf-8", errors="replace")[:max_chars]
    elif extension == ".pdf":
        reader = PdfReader(file_obj)
        fragments: list[str] = []
        current_length = 0
        for page in reader.pages:
            page_text = page.extract_text() or ""
            remaining = max_chars - current_length
            fragments.append(page_text[:remaining])
            current_length += min(len(page_text), remaining)
            if current_length >= max_chars:
                break
        text = "\n".join(fragments)
    else:
        document = Document(file_obj)
        text = "\n".join(paragraph.text for paragraph in document.paragraphs)[:max_chars]

    return normalize_text(text[:max_chars]), "completed"
