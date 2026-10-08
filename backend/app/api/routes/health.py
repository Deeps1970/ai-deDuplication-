from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Check backend health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-data-deduplication-backend"}
