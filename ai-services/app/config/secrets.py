"""
AWS Secrets Manager bootstrap.
Called once during FastAPI lifespan startup.
Skipped in non-production environments — API keys are read from .env instead.
"""

import json
import logging

import boto3
from botocore.exceptions import ClientError

from app.config.settings import Settings

logger = logging.getLogger(__name__)


def _get_secret_value(client, secret_name: str) -> str:
    try:
        resp = client.get_secret_value(SecretId=secret_name)
        raw = resp.get("SecretString", "")
        # Support both plain strings and JSON-encoded {"value": "sk-..."}
        try:
            parsed = json.loads(raw)
            return parsed.get("value", raw)
        except (json.JSONDecodeError, AttributeError):
            return raw
    except ClientError as exc:
        logger.error("Failed to fetch secret %s: %s", secret_name, exc)
        raise


def load_secrets(settings: Settings) -> None:
    """Load API keys from Secrets Manager and inject into settings. No-op in dev."""
    if settings.ENVIRONMENT != "production":
        logger.info("Non-production environment — skipping Secrets Manager, using .env values")
        return

    client = boto3.client("secretsmanager", region_name=settings.AWS_REGION)

    settings.NVIDIA_API_KEY = _get_secret_value(client, settings.NVIDIA_SECRET_NAME)

    logger.info("Secrets loaded from AWS Secrets Manager")
