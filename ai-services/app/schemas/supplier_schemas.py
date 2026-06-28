from pydantic import BaseModel


class SupplierSummaryRequest(BaseModel):
    supplier_id: str
    organization_id: str


class ScoreDimension(BaseModel):
    score: int
    rationale: str


class ScoreBreakdown(BaseModel):
    reliability: ScoreDimension
    competitiveness: ScoreDimension
    risk: ScoreDimension
    relationship: ScoreDimension


class SpendContext(BaseModel):
    order_count: int
    total_spend: float
    average_order_value: float
    currency: str


class SupplierSummaryResponse(BaseModel):
    supplierId: str
    supplierName: str
    scorecard_summary: str
    score_breakdown: ScoreBreakdown
    recommendation: str
    recommendation_rationale: str
    key_risks: list[str]
    opportunities: list[str]
    spendContext: SpendContext
    generatedAt: str
    prompt_version: str
