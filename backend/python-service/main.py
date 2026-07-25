from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routers
from app.routes import auth, songs, recommendations, analytics, playlists, otp
from app.core.config import settings
from app.core.database import init_db

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🎵 SoundWave Python Service Starting...")
    await init_db()
    yield
    # Shutdown
    logger.info("👋 SoundWave Python Service Shutting Down")

# Create FastAPI app
app = FastAPI(
    title="SoundWave Python Service",
    description="Music Analysis & Recommendation Engine",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return JSONResponse(
        status_code=200,
        content={
            "status": "Python service is running",
            "timestamp": datetime.utcnow().isoformat(),
            "environment": settings.ENVIRONMENT
        }
    )

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "🎵 Welcome to SoundWave Python Service",
        "version": "0.1.0",
        "docs": "/docs"
    }

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(otp.router, prefix="/api/v1/otp", tags=["OTP Email Gateway"])
app.include_router(songs.router, prefix="/api/v1/songs", tags=["Songs"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(playlists.router, prefix="/api/v1/playlists", tags=["Playlists"])

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "Internal server error"
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    )
