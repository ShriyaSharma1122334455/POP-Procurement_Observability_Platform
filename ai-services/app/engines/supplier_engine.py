"""
Y2 — Supplier Intelligence Engine.
Fetches supplier + recent POs from DynamoDB, calls Gemini,
returns a structured scorecard with recommendation rationale.
"""

import asyncio
import json
import re
from datetime import datetime, timezone
from typing import Any

from app.clients.nvidia import NvidiaClient
from app.config.settings import Settings
from app.prompts import supplier_prompts
from app.repositories import supplier_repo
from app.utils.errors import AppError
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _parse_json_response(raw: str) -> dict:
    """Parse AI JSON output; handles prose wrapping the JSON block."""
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


def _compute_spend_summary(orders: list[dict]) -> dict:
    total = sum(float(o.get("totalAmount", 0)) for o in orders)
    return {
        "order_count": len(orders),
        "total_spend": round(total, 2),
        "average_order_value": round(total / len(orders), 2) if orders else 0,
        "currency": orders[0].get("currency", "USD") if orders else "USD",
    }


class SupplierEngine:
    def __init__(self, dynamo: Any, nvidia: NvidiaClient, settings: Settings) -> None:
        self._dynamo = dynamo
        self._gemini = nvidia
        self._settings = settings

    async def generate_scorecard(self, supplier_id: str, organization_id: str) -> dict:
        # 1. Fetch supplier — verify it belongs to the requesting org
        supplier = supplier_repo.get_supplier(
            self._dynamo, self._settings.DYNAMODB_SUPPLIERS_TABLE, supplier_id
        )
        if not supplier or supplier.get("organizationId") != organization_id:
            raise AppError(404, "Supplier not found")

        # 2. Fetch recent purchase orders via supplierId-orderDate-index GSI
        orders = supplier_repo.get_orders_by_supplier(
            self._dynamo, self._settings.DYNAMODB_PURCHASE_ORDERS_TABLE, supplier_id
        )

        logger.debug(
            "Generating scorecard for supplier %s (%d recent orders)",
            supplier_id,
            len(orders),
        )

        # 3. Call Gemini (offloaded to thread pool — SDK is synchronous)
        raw = await asyncio.to_thread(
            self._gemini.complete,
            supplier_prompts.SYSTEM,
            supplier_prompts.user_prompt(supplier, orders),
        )

        # 4. Parse + enrich
        result = _parse_json_response(raw)
        result["supplierId"] = supplier_id
        result["supplierName"] = supplier.get("name", "")
        result["spendContext"] = _compute_spend_summary(orders)
        result["generatedAt"] = datetime.now(timezone.utc).isoformat()

        logger.info("Scorecard generated for supplier %s", supplier_id)
        return result
