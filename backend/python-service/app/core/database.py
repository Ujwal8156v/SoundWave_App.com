import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
from app.core.logger import log_info, log_error

# SQLAlchemy Base
Base = declarative_base()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql", "postgresql+asyncpg"),
    echo=settings.DATABASE_ECHO,
    future=True,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=0
)

# Create async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_session() -> AsyncSession:
    """Get database session"""
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            log_error("Database session error", exc=e)
            raise
        finally:
            await session.close()

async def init_db():
    """Initialize database"""
    try:
        log_info("Initializing database...")
        async with engine.begin() as conn:
            # Create tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
        log_info("Database initialized successfully")
    except Exception as e:
        log_error("Failed to initialize database", exc=e)
        raise

async def close_db():
    """Close database connection"""
    try:
        await engine.dispose()
        log_info("Database connection closed")
    except Exception as e:
        log_error("Failed to close database connection", exc=e)
