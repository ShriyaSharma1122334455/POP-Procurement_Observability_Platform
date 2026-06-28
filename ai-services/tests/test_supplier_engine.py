"""Tests for Y2 — Supplier Intelligence Engine."""

import asyncio
import json

import pytest

from app.config.settings import Settings
from app.engines.supplier_engine import SupplierEngine
from app.utils.errors import AppError


SCORECARD_RESPONSE = json.dumps({
    "scorecard_summary": "Fresh Farms is a reliable supplier with strong relationship scores.",
    "score_breakdown": {
        "reliability": {"score": 82, "rationale": "Consistently on-time delivery."},
        "competitiveness": {"score": 71, "rationale": "Prices near market average."},
        "risk": {"score": 25, "rationale": "Low risk profile."},
        "relationship": {"score": 88, "rationale": "Strong long-term partnership."},
    },
    "recommendation": "RENEW",
    "recommendation_rationale": "Strong performance across all metrics warrants renewal.",
    "key_risks": ["Seasonal price volatility"],
    "opportunities": ["Volume discount negotiation"],
    "prompt_version": "v1",
})


def test_generate_scorecard_success(dynamo_tables, mock_claude, sample_supplier, sample_orders):
    dynamo_tables.Table("pop-dev-suppliers").put_item(Item=sample_supplier)
    for order in sample_orders:
        dynamo_tables.Table("pop-dev-purchase-orders").put_item(Item=order)

    mock_claude.complete.return_value = SCORECARD_RESPONSE

    settings = Settings()
    engine = SupplierEngine(dynamo_tables, mock_claude, settings)

    result = asyncio.run(engine.generate_scorecard("supplier-001", "org-001"))

    assert result["supplierId"] == "supplier-001"
    assert result["recommendation"] == "RENEW"
    assert "generatedAt" in result
    assert result["spendContext"]["order_count"] == 5
    mock_claude.complete.assert_called_once()


def test_generate_scorecard_not_found(dynamo_tables, mock_claude):
    settings = Settings()
    engine = SupplierEngine(dynamo_tables, mock_claude, settings)

    with pytest.raises(AppError) as exc:
        asyncio.run(engine.generate_scorecard("nonexistent", "org-001"))
    assert exc.value.status_code == 404


def test_generate_scorecard_wrong_org(dynamo_tables, mock_claude, sample_supplier):
    dynamo_tables.Table("pop-dev-suppliers").put_item(Item=sample_supplier)

    settings = Settings()
    engine = SupplierEngine(dynamo_tables, mock_claude, settings)

    with pytest.raises(AppError) as exc:
        asyncio.run(engine.generate_scorecard("supplier-001", "wrong-org"))
    assert exc.value.status_code == 404
