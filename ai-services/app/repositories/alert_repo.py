"""
DynamoDB access for alerts.
GSI names match dynamodb.tf exactly:
  - alerts: organizationId-createdAt-index
"""

from typing import Any

from boto3.dynamodb.conditions import Attr, Key


def get_alert(dynamo: Any, table_name: str, alert_id: str, organization_id: str) -> dict | None:
    """
    Fetch a single alert by alertId within an organization.
    Uses the organizationId-createdAt-index GSI and filters by alertId,
    avoiding the need for callers to supply the createdAt sort key.
    """
    table = dynamo.Table(table_name)
    resp = table.query(
        IndexName="organizationId-createdAt-index",
        KeyConditionExpression=Key("organizationId").eq(organization_id),
        FilterExpression=Attr("alertId").eq(alert_id),
        Limit=1,
    )
    items = resp.get("Items", [])
    return items[0] if items else None
