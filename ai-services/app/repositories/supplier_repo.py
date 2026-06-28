"""
DynamoDB access for suppliers and purchase orders.
GSI names match dynamodb.tf exactly:
  - suppliers: organizationId-index
  - purchase-orders: supplierId-orderDate-index, organizationId-orderDate-index
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from boto3.dynamodb.conditions import Key


def get_supplier(dynamo: Any, table_name: str, supplier_id: str) -> dict | None:
    table = dynamo.Table(table_name)
    resp = table.get_item(Key={"supplierId": supplier_id})
    return resp.get("Item")


def list_suppliers_by_org(dynamo: Any, table_name: str, organization_id: str) -> list[dict]:
    table = dynamo.Table(table_name)
    resp = table.query(
        IndexName="organizationId-index",
        KeyConditionExpression=Key("organizationId").eq(organization_id),
    )
    return resp.get("Items", [])


def get_orders_by_supplier(
    dynamo: Any,
    table_name: str,
    supplier_id: str,
    days: int = 90,
) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    table = dynamo.Table(table_name)
    resp = table.query(
        IndexName="supplierId-orderDate-index",
        KeyConditionExpression=(
            Key("supplierId").eq(supplier_id) & Key("orderDate").gte(cutoff)
        ),
        Limit=20,
        ScanIndexForward=False,  # newest first
    )
    return resp.get("Items", [])


def get_recent_orders_by_org(
    dynamo: Any,
    table_name: str,
    organization_id: str,
    days: int = 90,
) -> list[dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    table = dynamo.Table(table_name)
    resp = table.query(
        IndexName="organizationId-orderDate-index",
        KeyConditionExpression=(
            Key("organizationId").eq(organization_id) & Key("orderDate").gte(cutoff)
        ),
        Limit=50,
        ScanIndexForward=False,
    )
    return resp.get("Items", [])
