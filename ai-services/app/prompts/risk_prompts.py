"""
Y5 — Prompt Library: Risk Analysis Engine prompts.
"""

import json

from app.prompts.version import PROMPT_VERSION

SYSTEM = f"""You are a procurement risk analyst for the POP platform.
Your job is to explain procurement alerts in plain English to non-technical procurement managers.
Be specific, concise, and always provide at least one recommended action with a clear urgency level.
Always respond with valid JSON only. No prose before or after the JSON object.
Prompt version: {PROMPT_VERSION}"""


def user_prompt(alert: dict, supplier: dict | None) -> str:
    supplier_context = (
        json.dumps(supplier, indent=2, default=str)
        if supplier
        else "No related supplier data available."
    )
    return f"""Analyse this procurement alert and explain it clearly.

Alert:
{json.dumps(alert, indent=2, default=str)}

Related Supplier Data:
{supplier_context}

Return a JSON object with this exact schema:
{{
  "plain_english_explanation": "<2-3 sentence explanation for a non-technical manager>",
  "root_cause_analysis": "<what likely caused this alert>",
  "severity_justification": "<why this severity level was assigned>",
  "recommended_actions": [
    {{"action": "<action text>", "urgency": "<IMMEDIATE | THIS_WEEK | THIS_MONTH>"}}
  ],
  "estimated_financial_impact": "<text description of the financial impact>",
  "prompt_version": "{PROMPT_VERSION}"
}}"""
