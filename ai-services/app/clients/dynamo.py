"""
DynamoDB resource singleton.
Uses boto3 resource (not client) for automatic Python type marshalling —
equivalent to DynamoDBDocumentClient in the backend's config/dynamo.ts.
"""

from typing import Any

import boto3

from app.config.settings import Settings


def get_dynamo_resource(settings: Settings) -> Any:
    kwargs: dict[str, Any] = {"region_name": settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
    if settings.DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT
    return boto3.resource("dynamodb", **kwargs)
