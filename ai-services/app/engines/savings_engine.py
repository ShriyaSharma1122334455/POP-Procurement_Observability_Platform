"""
Y3 — Savings Agent Engine.
Accepts a natural-language goal, fetches org spend data from DynamoDB,
uses Gemini to generate savings opportunities, and writes results to
pop-savings-recommendations. This is the only DynamoDB writer in the AI service.
"""

import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any

from app.clients.nvidia import NvidiaClient
from app.config.settings import Settings
from app.prompts import savings_prompts
from app.repositories import savings_repo, supplier_repo
from app.utils.errors import AppError
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Category mapping from AI output to DynamoDB enum
VALID_CATEGORIES = {
    "SUPPLIER_SWITCH",
    "VOLUME_DISCOUNT",
    "CONSOLIDATION",
    "CONTRACT_RENEGOTIATION",
    "DEMAND_REDUCTION",
    "PROCESS_OPTIMIZATION",
}


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


def _aggregate_spend(orders: list[dict]) -> dict:
    """Client-side aggregation — mirrors spend.service.ts approach."""
    by_category: dict[str, float] = {}
    by_supplier: dict[str, float] = {}
    total = 0.0

    for order in orders:
        amount = float(order.get("totalAmount", 0))
        total += amount

        supplier_id = order.get("supplierId", "unknown")
        by_supplier[supplier_id] = by_supplier.get(supplier_id, 0) + amount

        for line in order.get("lineItems", []):
            cat = line.get("category", "OTHER")
            by_category[cat] = by_category.get(cat, 0) + float(line.get("totalPrice", 0))

    return {
        "total_spend_90d": round(total, 2),
        "order_count": len(orders),
        "by_category": {k: round(v, 2) for k, v in sorted(by_category.items(), key=lambda x: -x[1])},
        "top_suppliers_by_spend": dict(
            sorted(by_supplier.items(), key=lambda x: -x[1])[:10]
        ),
        "currency": orders[0].get("currency", "USD") if orders else "USD",
    }


def _build_recommendation_item(opp: dict, organization_id: str) -> dict:
    """
    Construct a DynamoDB item matching SavingsRecommendationItem from backend/src/db/types.ts.
    """
    now = datetime.now(timezone.utc).isoformat()
    category = opp.get("category", "PROCESS_OPTIMIZATION")
    if category not in VALID_CATEGORIES:
        category = "PROCESS_OPTIMIZATION"

    return {
        "recommendationId": str(uuid.uuid4()),
        "createdAt": now,
        "organizationId": organization_id,
        "title": opp.get("title", "Savings Opportunity"),
        "description": opp.get("description", ""),
        "category": category,
        "status": "PENDING",
        "estimatedAnnualSavings": int(opp.get("estimated_annual_savings", 0)),
        "confidenceScore": min(100, max(0, int(opp.get("confidence_score", 50)))),
        "currency": "USD",
        "affectedSupplierIds": opp.get("affected_supplier_ids", []),
        "affectedCategories": opp.get("affected_categories", []),
        "aiGenerated": True,
        "generatedBy": "AI_AGENT",
        "updatedAt": now,
    }


class SavingsEngine:
    def __init__(self, dynamo: Any, nvidia: NvidiaClient, settings: Settings) -> None:
        self._dynamo = dynamo
        self._gemini = nvidia
        self._settings = settings

    async def run_agent(self, prompt: str, organization_id: str) -> dict:
        # 1. Fetch all suppliers for the org
        suppliers = supplier_repo.list_suppliers_by_org(
            self._dynamo, self._settings.DYNAMODB_SUPPLIERS_TABLE, organization_id
        )

        # 2. Fetch recent POs via organizationId-orderDate-index GSI
        orders = supplier_repo.get_recent_orders_by_org(
            self._dynamo, self._settings.DYNAMODB_PURCHASE_ORDERS_TABLE, organization_id
        )

        if not orders:
            raise AppError(422, "No purchase order data found for this organisation")

        spend_summary = _aggregate_spend(orders)

        logger.debug(
            "Running savings agent for org %s: %d suppliers, %d orders",
            organization_id,
            len(suppliers),
            len(orders),
        )

        # 3. Call Gemini
        raw = await asyncio.to_thread(
            self._gemini.complete,
            savings_prompts.SYSTEM,
            savings_prompts.user_prompt(prompt, suppliers, orders, spend_summary),
            3000,
        )

        result = _parse_json_response(raw)

        # 4. Write each opportunity to pop-savings-recommendations
        written: list[dict] = []
        for opp in result.get("opportunities", []):
            item = _build_recommendation_item(opp, organization_id)
            savings_repo.write_recommendation(
                self._dynamo,
                self._settings.DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE,
                item,
            )
            written.append(item)

        logger.info(
            "Savings agent created %d recommendations for org %s",
            len(written),
            organization_id,
        )

        return {
            "analysis_summary": result.get("analysis_summary", ""),
            "opportunities_created": len(written),
            "recommendations": written,
            "spend_context": spend_summary,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }
