from pydantic import BaseModel


class SavingsAgentRequest(BaseModel):
    prompt: str
    organization_id: str


class SavingsAgentResponse(BaseModel):
    analysis_summary: str
    opportunities_created: int
    recommendations: list[dict]
    spend_context: dict
    generatedAt: str
