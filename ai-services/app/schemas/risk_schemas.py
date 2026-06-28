from pydantic import BaseModel


class RiskExplainRequest(BaseModel):
    alert_id: str
    organization_id: str


class RecommendedAction(BaseModel):
    action: str
    urgency: str


class RiskExplainResponse(BaseModel):
    alertId: str
    alertType: str
    severity: str
    plain_english_explanation: str
    root_cause_analysis: str
    severity_justification: str
    recommended_actions: list[RecommendedAction]
    estimated_financial_impact: str
    generatedAt: str
    prompt_version: str
