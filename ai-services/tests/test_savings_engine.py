"""Tests for Y3 — Savings Agent Engine."""

import asyncio
import json

import pytest

from app.config.settings import Settings
from app.engines.savings_engine import SavingsEngine
from app.utils.errors import AppError


SAVINGS_RESPONSE = json.dumps({
    "opportunities": [
        {
            "title": "Consolidate produce orders",
            "description": "Consolidating weekly produce orders could unlock volume discounts.",
            "category": "VOLUME_DISCOUNT",
            "estimated_annual_savings": 12000,
            "confidence_score": 80,
            "affected_supplier_ids": ["supplier-001"],
            "affected_categories": ["FOOD_BEVERAGE"],
            "implementation_steps": ["Audit order frequency", "Negotiate volume tiers"],
        }
    ],
    "analysis_summary": "Food & Beverage spend is fragmented. Consolidation offers the highest ROI.",
    "prompt_version": "v1",
})


def test_run_agent_success(dynamo_tables, mock_claude, sample_supplier, sample_orders):
    dynamo_tables.Table("pop-dev-suppliers").put_item(Item=sample_supplier)
    for order in sample_orders:
        dynamo_tables.Table("pop-dev-purchase-orders").put_item(Item=order)

    mock_claude.complete.return_value = SAVINGS_RESPONSE

    settings = Settings()
    engine = SavingsEngine(dynamo_tables, mock_claude, settings)

    result = asyncio.run(engine.run_agent("reduce food cost by 5%", "org-001"))

    assert result["opportunities_created"] == 1
    assert "analysis_summary" in result
    assert result["recommendations"][0]["aiGenerated"] is True
    assert result["recommendations"][0]["status"] == "PENDING"

    # Verify it was written to DynamoDB
    recs = dynamo_tables.Table("pop-dev-savings-recommendations").scan()["Items"]
    assert len(recs) == 1
    assert recs[0]["category"] == "VOLUME_DISCOUNT"


def test_run_agent_no_orders_raises(dynamo_tables, mock_claude, sample_supplier):
    dynamo_tables.Table("pop-dev-suppliers").put_item(Item=sample_supplier)

    settings = Settings()
    engine = SavingsEngine(dynamo_tables, mock_claude, settings)

    with pytest.raises(AppError) as exc:
        asyncio.run(engine.run_agent("reduce costs", "org-001"))
    assert exc.value.status_code == 422
