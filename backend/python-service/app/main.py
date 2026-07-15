from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import music


app = FastAPI(
    title="SoundWave Python Service",
    description="Music search, recommendation, metadata, and analysis service.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "Python service is running",
        "environment": settings.environment,
        "service": "soundwave-python-service",
    }


app.include_router(music.router, prefix="/api/v1", tags=["music"])