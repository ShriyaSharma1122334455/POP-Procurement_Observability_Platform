"""
OpenAI client wrapper — reserved as a fallback if Claude is unavailable.
Same interface as ClaudeClient for easy swapping.
"""

from openai import OpenAI


class OpenAIClient:
    MODEL = "gpt-4o"
    DEFAULT_MAX_TOKENS = 2048

    def __init__(self, api_key: str) -> None:
        self._client = OpenAI(api_key=api_key)

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        response = self._client.chat.completions.create(
            model=self.MODEL,
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return response.choices[0].message.content or ""
