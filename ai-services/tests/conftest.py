"""
Shared pytest fixtures.
Uses moto to mock DynamoDB — no real AWS credentials needed.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import boto3
import pytest
from moto import mock_aws

# Set env vars before any app imports
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test")


@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS credentials so moto doesn't hit real AWS."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"


@pytest.fixture(scope="function")
def dynamo_tables(aws_credentials):
    """Create all five DynamoDB tables using moto."""
    with mock_aws():
        dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

        # Suppliers table
        dynamodb.create_table(
            TableName="pop-dev-suppliers",
            KeySchema=[{"AttributeName": "supplierId", "KeyType": "HASH"}],
            AttributeDefinitions=[
                {"AttributeName": "supplierId", "AttributeType": "S"},
                {"AttributeName": "organizationId", "AttributeType": "S"},
                {"AttributeName": "category", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "organizationId-index",
                    "KeySchema": [{"AttributeName": "organizationId", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "category-index",
                    "KeySchema": [{"AttributeName": "category", "KeyType": "HASH"}],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # Purchase orders table
        dynamodb.create_table(
            TableName="pop-dev-purchase-orders",
            KeySchema=[
                {"AttributeName": "orderId", "KeyType": "HASH"},
                {"AttributeName": "orderDate", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "orderId", "AttributeType": "S"},
                {"AttributeName": "orderDate", "AttributeType": "S"},
                {"AttributeName": "supplierId", "AttributeType": "S"},
                {"AttributeName": "organizationId", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "supplierId-orderDate-index",
                    "KeySchema": [
                        {"AttributeName": "supplierId", "KeyType": "HASH"},
                        {"AttributeName": "orderDate", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "organizationId-orderDate-index",
                    "KeySchema": [
                        {"AttributeName": "organizationId", "KeyType": "HASH"},
                        {"AttributeName": "orderDate", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # Alerts table
        dynamodb.create_table(
            TableName="pop-dev-alerts",
            KeySchema=[
                {"AttributeName": "alertId", "KeyType": "HASH"},
                {"AttributeName": "createdAt", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "alertId", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"},
                {"AttributeName": "organizationId", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"},
                {"AttributeName": "severity", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "organizationId-createdAt-index",
                    "KeySchema": [
                        {"AttributeName": "organizationId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "status-severity-index",
                    "KeySchema": [
                        {"AttributeName": "status", "KeyType": "HASH"},
                        {"AttributeName": "severity", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        # Savings recommendations table
        dynamodb.create_table(
            TableName="pop-dev-savings-recommendations",
            KeySchema=[
                {"AttributeName": "recommendationId", "KeyType": "HASH"},
                {"AttributeName": "createdAt", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "recommendationId", "AttributeType": "S"},
                {"AttributeName": "createdAt", "AttributeType": "S"},
                {"AttributeName": "organizationId", "AttributeType": "S"},
                {"AttributeName": "status", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "organizationId-createdAt-index",
                    "KeySchema": [
                        {"AttributeName": "organizationId", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
                {
                    "IndexName": "status-createdAt-index",
                    "KeySchema": [
                        {"AttributeName": "status", "KeyType": "HASH"},
                        {"AttributeName": "createdAt", "KeyType": "RANGE"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        yield dynamodb


@pytest.fixture
def mock_ai():
    """AI client that returns controllable JSON responses."""
    client = MagicMock()
    client.complete = MagicMock()
    return client


@pytest.fixture
def sample_supplier():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "supplierId": "supplier-001",
        "organizationId": "org-001",
        "name": "Fresh Farms Co.",
        "category": "FOOD_BEVERAGE",
        "reliabilityScore": 82,
        "competitivenessScore": 71,
        "riskScore": 25,
        "relationshipScore": 88,
        "recommendation": "RENEW",
        "totalSpendYTD": 148000,
        "currency": "USD",
        "country": "US",
        "contactEmail": "orders@freshfarms.com",
        "tags": ["produce", "organic"],
        "createdAt": now,
        "updatedAt": now,
    }


@pytest.fixture
def sample_orders():
    now = datetime.now(timezone.utc)
    return [
        {
            "orderId": f"order-{i:03d}",
            "orderDate": now.isoformat(),
            "supplierId": "supplier-001",
            "organizationId": "org-001",
            "status": "FULFILLED",
            "totalAmount": 5000 + i * 200,
            "currency": "USD",
            "lineItems": [
                {
                    "lineItemId": f"li-{i}",
                    "description": "Produce",
                    "quantity": 100,
                    "unitPrice": 50,
                    "totalPrice": 5000,
                    "category": "FOOD_BEVERAGE",
                }
            ],
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }
        for i in range(5)
    ]


@pytest.fixture
def sample_alert():
    now = datetime.now(timezone.utc).isoformat()
    return {
        "alertId": "alert-001",
        "createdAt": now,
        "organizationId": "org-001",
        "status": "OPEN",
        "severity": "HIGH",
        "type": "PRICE_SPIKE",
        "title": "Chicken price spike detected",
        "description": "Chicken prices increased by 18% vs. 30-day average",
        "affectedEntityId": "supplier-001",
        "affectedEntityType": "SUPPLIER",
        "estimatedImpact": 14400,
        "currency": "USD",
        "updatedAt": now,
    }
