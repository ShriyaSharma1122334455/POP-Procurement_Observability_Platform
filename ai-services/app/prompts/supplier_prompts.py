"""
Y5 — Prompt Library: Supplier Intelligence Engine prompts.
"""

import json

from app.prompts.version import PROMPT_VERSION

SYSTEM = f"""You are a procurement intelligence analyst for the POP platform.
You evaluate suppliers across four dimensions: reliability, price competitiveness, risk, and relationship quality.
Base your analysis strictly on the data provided — do not invent figures.
Always respond with valid JSON only. No prose before or after the JSON object.
Prompt version: {PROMPT_VERSION}"""


def user_prompt(supplier: dict, recent_orders: list[dict]) -> str:
    return f"""Analyze the following supplier and generate a scorecard.

Supplier Data:
{json.dumps(supplier, indent=2, default=str)}

Recent Purchase Orders (last 90 days, up to 20):
{json.dumps(recent_orders, indent=2, default=str)}

Return a JSON object with this exact schema:
{{
  "scorecard_summary": "<2-3 sentence narrative summarising the supplier>",
  "score_breakdown": {{
    "reliability": {{"score": <0-100>, "rationale": "<one sentence>"}},
    "competitiveness": {{"score": <0-100>, "rationale": "<one sentence>"}},
    "risk": {{"score": <0-100>, "rationale": "<one sentence — higher score = riskier>"}},
    "relationship": {{"score": <0-100>, "rationale": "<one sentence>"}}
  }},
  "recommendation": "<RENEW | NEGOTIATE | DIVERSIFY | REPLACE>",
  "recommendation_rationale": "<2-3 sentence explanation>",
  "key_risks": ["<risk1>", "<risk2>"],
  "opportunities": ["<opportunity1>", "<opportunity2>"],
  "prompt_version": "{PROMPT_VERSION}"
}}"""
