from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Server
    APP_HOST: str = os.getenv("APP_HOST", "0.0.0.0")
    APP_PORT: int = int(os.getenv("APP_PORT", 8000))
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:password@localhost:5432/soundwave"
    )
    DATABASE_ECHO: bool = os.getenv("DATABASE_ECHO", "false").lower() == "true"
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_TTL: int = int(os.getenv("REDIS_TTL", 86400))
    
    # JWT
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET",
        "your_super_secret_key_min_32_characters_long_here_change_this_in_production"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5000,http://localhost:8080"
    )
    
    # External APIs
    SPOTIFY_CLIENT_ID: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    SPOTIFY_CLIENT_SECRET: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    YOUTUBE_API_KEY: str = os.getenv("YOUTUBE_API_KEY", "")
    LAST_FM_API_KEY: str = os.getenv("LAST_FM_API_KEY", "")
    GENIUS_API_KEY: str = os.getenv("GENIUS_API_KEY", "")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        case_sensitive = True

settings = Settings()
