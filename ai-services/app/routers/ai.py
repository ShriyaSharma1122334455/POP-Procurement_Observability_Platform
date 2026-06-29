"""
Y6 — AI API routes.
All routes are internal — JWT auth happens in the backend before it calls here.
The backend passes organization_id in the request body.
"""

import asyncio
import base64
import json
import re

from fastapi import APIRouter, Request

from app.clients.nvidia import NvidiaClient
from app.config.settings import Settings
from app.engines.risk_engine import RiskEngine
from app.engines.savings_engine import SavingsEngine
from app.engines.supplier_engine import SupplierEngine
from app.prompts import extract_prompts
from app.schemas.extract_schemas import ExtractSupplierDocRequest, ExtractSupplierDocResponse, ExtractSupplierTextRequest
from app.schemas.risk_schemas import RiskExplainRequest, RiskExplainResponse
from app.schemas.savings_schemas import SavingsAgentRequest, SavingsAgentResponse
from app.schemas.supplier_schemas import SupplierSummaryRequest, SupplierSummaryResponse

router = APIRouter(prefix="/ai", tags=["ai"])


def _deps(request: Request) -> tuple:
    """Extract shared dependencies from app.state (set during lifespan startup)."""
    return (
        request.app.state.dynamo,
        request.app.state.nvidia,
        request.app.state.settings,
    )


@router.post("/supplier-summary", response_model=SupplierSummaryResponse)
async def supplier_summary(body: SupplierSummaryRequest, request: Request) -> dict:
    dynamo, nvidia, settings = _deps(request)
    engine = SupplierEngine(dynamo, nvidia, settings)
    return await engine.generate_scorecard(body.supplier_id, body.organization_id)


@router.post("/savings-agent", response_model=SavingsAgentResponse)
async def savings_agent(body: SavingsAgentRequest, request: Request) -> dict:
    dynamo, nvidia, settings = _deps(request)
    engine = SavingsEngine(dynamo, nvidia, settings)
    return await engine.run_agent(body.prompt, body.organization_id)


@router.post("/risk-explain", response_model=RiskExplainResponse)
async def risk_explain(body: RiskExplainRequest, request: Request) -> dict:
    dynamo, nvidia, settings = _deps(request)
    engine = RiskEngine(dynamo, nvidia, settings)
    return await engine.explain_alert(body.alert_id, body.organization_id)


@router.post("/extract-supplier-doc", response_model=ExtractSupplierDocResponse)
async def extract_supplier_doc(body: ExtractSupplierDocRequest, request: Request) -> dict:
    """Extract supplier info from an uploaded invoice/document using NVIDIA multimodal."""
    _, nvidia, _ = _deps(request)

    file_bytes = base64.b64decode(body.file_base64)

    raw = await asyncio.to_thread(
        nvidia.complete_with_file,
        extract_prompts.SYSTEM,
        extract_prompts.USER,
        file_bytes,
        body.mime_type,
    )

    data = _parse_extract_json(raw)
    return {
        "name":          data.get("name"),
        "category":      data.get("category"),
        "contactEmail":  data.get("contactEmail"),
        "contactPhone":  data.get("contactPhone"),
        "website":       data.get("website"),
        "country":       data.get("country"),
        "contractExpiry": data.get("contractExpiry"),
        "confidence":    data.get("confidence", "LOW"),
    }


def _parse_extract_json(raw: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        return json.loads(match.group()) if match else {}


@router.post("/extract-supplier-text", response_model=ExtractSupplierDocResponse)
async def extract_supplier_text(body: ExtractSupplierTextRequest, request: Request) -> dict:
    """Extract supplier info from raw text extracted from a PDF (all pages)."""
    _, nvidia, _ = _deps(request)

    user_prompt = f"{extract_prompts.USER}\n\nDocument text:\n{body.text[:12000]}"

    raw = await asyncio.to_thread(
        nvidia.complete,
        extract_prompts.SYSTEM,
        user_prompt,
    )

    data = _parse_extract_json(raw)
    return {
        "name":           data.get("name"),
        "category":       data.get("category"),
        "contactEmail":   data.get("contactEmail"),
        "contactPhone":   data.get("contactPhone"),
        "website":        data.get("website"),
        "country":        data.get("country"),
        "contractExpiry": data.get("contractExpiry"),
        "confidence":     data.get("confidence", "LOW"),
    }
