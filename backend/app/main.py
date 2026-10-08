import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import files, health
from app.config import get_settings

logging.basicConfig(level=logging.INFO)
settings = get_settings()

app = FastAPI(
    title="AI Data Deduplication Backend",
    description="Backend foundation for file storage. Deduplication is not implemented.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Unhandled API error for %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An internal server error occurred."})


app.include_router(health.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(files.analytics_router, prefix="/api")
