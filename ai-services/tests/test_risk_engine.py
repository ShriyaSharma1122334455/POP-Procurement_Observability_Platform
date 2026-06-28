"""Tests for Y4 — Risk Analysis Engine."""

import json

import pytest
from moto import mock_aws

from app.config.settings import Settings
from app.engines.risk_engine import RiskEngine
from app.utils.errors import AppError


RISK_RESPONSE = json.dumps({
    "plain_english_explanation": "Your chicken supplier raised prices by 18%, adding ~$14k/year to costs.",
    "root_cause_analysis": "Likely caused by seasonal feed cost increases and supply chain pressure.",
    "severity_justification": "HIGH severity because it directly impacts food cost margin by >10%.",
    "recommended_actions": [
        {"action": "Request price justification from Fresh Farms Co.", "urgency": "THIS_WEEK"},
        {"action": "Get quotes from alternative poultry suppliers", "urgency": "THIS_WEEK"},
    ],
    "estimated_financial_impact": "Approximately $14,400 annualised at current order volume.",
    "prompt_version": "v1",
})


@mock_aws
def test_explain_alert_success(dynamo_tables, mock_claude, sample_alert, sample_supplier):
    dynamo_tables.Table("pop-dev-alerts").put_item(Item=sample_alert)
    dynamo_tables.Table("pop-dev-suppliers").put_item(Item=sample_supplier)

    mock_claude.complete.return_value = RISK_RESPONSE

    settings = Settings()
    engine = RiskEngine(dynamo_tables, mock_claude, settings)

    import asyncio
    result = asyncio.get_event_loop().run_until_complete(
        engine.explain_alert("alert-001", "org-001")
    )

    assert result["alertId"] == "alert-001"
    assert result["alertType"] == "PRICE_SPIKE"
    assert result["severity"] == "HIGH"
    assert len(result["recommended_actions"]) == 2
    assert "generatedAt" in result
    mock_claude.complete.assert_called_once()


@mock_aws
def test_explain_alert_not_found(dynamo_tables, mock_claude):
    settings = Settings()
    engine = RiskEngine(dynamo_tables, mock_claude, settings)

    import asyncio
    with pytest.raises(AppError) as exc:
        asyncio.get_event_loop().run_until_complete(
            engine.explain_alert("nonexistent", "org-001")
        )
    assert exc.value.status_code == 404
