"""
Structured logger.
JSON format in production (CloudWatch-compatible).
Human-readable format in development (mirrors pino-pretty from the backend).
"""

import logging
import os

from pythonjsonlogger import jsonlogger


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    handler = logging.StreamHandler()

    if os.getenv("ENVIRONMENT", "development") == "production":
        formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s"
        )
        logger.setLevel(logging.INFO)
    else:
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
            datefmt="%H:%M:%S",
        )
        logger.setLevel(logging.DEBUG)

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

    return logger
