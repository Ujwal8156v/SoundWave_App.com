import os
from dataclasses import dataclass


def _bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    environment: str = os.getenv("ENVIRONMENT", "development")
    app_host: str = os.getenv("APP_HOST", "localhost")
    app_port: int = int(os.getenv("APP_PORT", "8000"))
    debug: bool = _bool_env("DEBUG", True)
    node_service_url: str = os.getenv("NODE_SERVICE_URL", "http://localhost:5000")
    cors_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
        if origin.strip()
    )
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()