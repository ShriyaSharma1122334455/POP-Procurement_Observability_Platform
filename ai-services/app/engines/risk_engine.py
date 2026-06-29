"""
Y4 — Risk Analysis Engine.
Fetches an alert from DynamoDB, optionally loads the related supplier,
uses Gemini to produce a plain-English explanation and recommended actions.
"""

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any

from app.clients.nvidia import NvidiaClient
from app.config.settings import Settings
from app.prompts import risk_prompts
from app.repositories import alert_repo, supplier_repo
from app.utils.errors import AppError
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _parse_json_response(raw: str) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    raise AppError(502, "AI model returned an invalid response — could not parse JSON")


class RiskEngine:
    def __init__(self, dynamo: Any, nvidia: NvidiaClient, settings: Settings) -> None:
        self._dynamo = dynamo
        self._gemini = nvidia
        self._settings = settings

    async def explain_alert(self, alert_id: str, organization_id: str) -> dict:
        # 1. Fetch alert — verify org ownership
        alert = alert_repo.get_alert(
            self._dynamo, self._settings.DYNAMODB_ALERTS_TABLE, alert_id, organization_id
        )
        if not alert:
            raise AppError(404, "Alert not found")

        # 2. Optionally fetch the related supplier for richer context
        supplier: dict | None = None
        if alert.get("affectedEntityType") == "SUPPLIER" and alert.get("affectedEntityId"):
            supplier = supplier_repo.get_supplier(
                self._dynamo,
                self._settings.DYNAMODB_SUPPLIERS_TABLE,
                alert["affectedEntityId"],
            )

        logger.debug("Explaining alert %s (type=%s)", alert_id, alert.get("type"))

        # 3. Call Gemini
        raw = await asyncio.to_thread(
            self._gemini.complete,
            risk_prompts.SYSTEM,
            risk_prompts.user_prompt(alert, supplier),
        )

        result = _parse_json_response(raw)
        result["alertId"] = alert_id
        result["alertType"] = alert.get("type", "")
        result["severity"] = alert.get("severity", "")
        result["generatedAt"] = datetime.now(timezone.utc).isoformat()

        logger.info("Risk explanation generated for alert %s", alert_id)
        return result
