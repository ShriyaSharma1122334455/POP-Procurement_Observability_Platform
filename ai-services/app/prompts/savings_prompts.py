"""
Y5 — Prompt Library: Savings Agent prompts.
"""

import json

from app.prompts.version import PROMPT_VERSION

SYSTEM = f"""You are an autonomous procurement savings agent for the POP platform.
You analyse spending data and generate actionable, measurable savings opportunities.
Prioritise recommendations with high confidence scores and clear ROI.
Only suggest actions that are realistic given the data provided.
Always respond with valid JSON only. No prose before or after the JSON object.
Prompt version: {PROMPT_VERSION}"""


def user_prompt(
    user_goal: str,
    suppliers: list[dict],
    recent_orders: list[dict],
    spend_summary: dict,
) -> str:
    return f"""User Goal: "{user_goal}"

Organisation Spend Summary:
{json.dumps(spend_summary, indent=2, default=str)}

Suppliers (top 10 by spend):
{json.dumps(suppliers[:10], indent=2, default=str)}

Recent Purchase Orders (sample, last 90 days, up to 20):
{json.dumps(recent_orders[:20], indent=2, default=str)}

Generate 3-5 concrete savings opportunities. Return a JSON object with this exact schema:
{{
  "opportunities": [
    {{
      "title": "<short actionable title>",
      "description": "<2-3 sentence explanation>",
      "category": "<SUPPLIER_SWITCH | VOLUME_DISCOUNT | CONSOLIDATION | CONTRACT_RENEGOTIATION | DEMAND_REDUCTION | PROCESS_OPTIMIZATION>",
      "estimated_annual_savings": <number in USD>,
      "confidence_score": <0-100>,
      "affected_supplier_ids": ["<supplierId>"],
      "affected_categories": ["<category>"],
      "implementation_steps": ["<step1>", "<step2>"]
    }}
  ],
  "analysis_summary": "<paragraph summarising key findings>",
  "prompt_version": "{PROMPT_VERSION}"
}}"""
