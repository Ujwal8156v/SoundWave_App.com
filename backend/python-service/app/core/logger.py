import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

def log_info(message: str, **kwargs):
    """Log info level message"""
    logger.info(message, extra=kwargs)

def log_error(message: str, exc: Exception = None, **kwargs):
    """Log error level message"""
    if exc:
        logger.error(f"{message}: {str(exc)}", exc_info=True, extra=kwargs)
    else:
        logger.error(message, extra=kwargs)

def log_warning(message: str, **kwargs):
    """Log warning level message"""
    logger.warning(message, extra=kwargs)

def log_debug(message: str, **kwargs):
    """Log debug level message"""
    logger.debug(message, extra=kwargs)
