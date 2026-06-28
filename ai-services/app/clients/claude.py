"""
Anthropic Claude client wrapper.
Uses claude-opus-4-5 as the default model.
Exposes a single synchronous `complete()` method; callers use asyncio.to_thread
to avoid blocking the FastAPI event loop.
"""

import anthropic


class ClaudeClient:
    MODEL = "claude-opus-4-5"
    DEFAULT_MAX_TOKENS = 2048

    def __init__(self, api_key: str) -> None:
        self._client = anthropic.Anthropic(api_key=api_key)

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        message = self._client.messages.create(
            model=self.MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return message.content[0].text
