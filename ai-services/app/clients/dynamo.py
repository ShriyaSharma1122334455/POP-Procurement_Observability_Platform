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
    if settings.DYNAMODB_ENDPOINT:
        kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT
    return boto3.resource("dynamodb", **kwargs)
