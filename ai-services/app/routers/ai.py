"""
Y6 — AI API routes.
All routes are internal — JWT auth happens in the backend before it calls here.
The backend passes organization_id in the request body.
"""

from fastapi import APIRouter, Request

from app.clients.gemini import GeminiClient
from app.config.settings import Settings
from app.engines.risk_engine import RiskEngine
from app.engines.savings_engine import SavingsEngine
from app.engines.supplier_engine import SupplierEngine
from app.schemas.risk_schemas import RiskExplainRequest, RiskExplainResponse
from app.schemas.savings_schemas import SavingsAgentRequest, SavingsAgentResponse
from app.schemas.supplier_schemas import SupplierSummaryRequest, SupplierSummaryResponse

router = APIRouter(prefix="/ai", tags=["ai"])


def _deps(request: Request) -> tuple:
    """Extract shared dependencies from app.state (set during lifespan startup)."""
    return (
        request.app.state.dynamo,
        request.app.state.gemini,
        request.app.state.settings,
    )


@router.post("/supplier-summary", response_model=SupplierSummaryResponse)
async def supplier_summary(body: SupplierSummaryRequest, request: Request) -> dict:
    dynamo, gemini, settings = _deps(request)
    engine = SupplierEngine(dynamo, gemini, settings)
    return await engine.generate_scorecard(body.supplier_id, body.organization_id)


@router.post("/savings-agent", response_model=SavingsAgentResponse)
async def savings_agent(body: SavingsAgentRequest, request: Request) -> dict:
    dynamo, gemini, settings = _deps(request)
    engine = SavingsEngine(dynamo, gemini, settings)
    return await engine.run_agent(body.prompt, body.organization_id)


@router.post("/risk-explain", response_model=RiskExplainResponse)
async def risk_explain(body: RiskExplainRequest, request: Request) -> dict:
    dynamo, gemini, settings = _deps(request)
    engine = RiskEngine(dynamo, gemini, settings)
    return await engine.explain_alert(body.alert_id, body.organization_id)
