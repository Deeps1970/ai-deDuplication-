import re


def normalize_text(text: str) -> str:
    """Normalize case and whitespace without removing meaningful words."""
    return re.sub(r"\s+", " ", text).strip().lower()
