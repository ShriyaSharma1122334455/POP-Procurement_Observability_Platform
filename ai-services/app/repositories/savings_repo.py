"""
DynamoDB access for savings recommendations.
The savings engine is the only writer in the AI service.
GSI names match dynamodb.tf exactly:
  - savings-recommendations: organizationId-createdAt-index
"""

from typing import Any

from boto3.dynamodb.conditions import Key


def write_recommendation(dynamo: Any, table_name: str, item: dict) -> None:
    """Write a new savings recommendation. Item must match SavingsRecommendationItem schema."""
    table = dynamo.Table(table_name)
    table.put_item(Item=item)


def list_recommendations(
    dynamo: Any,
    table_name: str,
    organization_id: str,
) -> list[dict]:
    table = dynamo.Table(table_name)
    resp = table.query(
        IndexName="organizationId-createdAt-index",
        KeyConditionExpression=Key("organizationId").eq(organization_id),
        ScanIndexForward=False,  # newest first
    )
    return resp.get("Items", [])
