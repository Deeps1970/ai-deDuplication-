from dataclasses import dataclass

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass(frozen=True)
class SimilarityMatch:
    file_id: str
    score: float


def find_most_similar(new_text: str, candidates: list[tuple[str, str]]) -> SimilarityMatch | None:
    """Fit one deterministic TF-IDF vocabulary over the candidate corpus and new text."""
    usable = [(file_id, text) for file_id, text in candidates if text.strip()]
    if not new_text.strip() or not usable:
        return None
    corpus = [text for _, text in usable] + [new_text]
    try:
        matrix = TfidfVectorizer().fit_transform(corpus)
    except ValueError:
        return None
    scores = cosine_similarity(matrix[-1], matrix[:-1]).ravel()
    best_index = int(scores.argmax())
    return SimilarityMatch(file_id=usable[best_index][0], score=float(scores[best_index]))
