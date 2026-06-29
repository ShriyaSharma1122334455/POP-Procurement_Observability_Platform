"""
Google Gemini client wrapper using the google-genai SDK.
Exposes a synchronous complete() method used by all AI engines.
"""

from google import genai
from google.genai import types


class GeminiClient:
    MODEL = "gemini-2.0-flash"
    DEFAULT_MAX_TOKENS = 2048

    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key)

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        response = self._client.models.generate_content(
            model=self.MODEL,
            contents=user,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text

    def complete_with_file(
        self,
        system: str,
        user: str,
        file_bytes: bytes,
        mime_type: str,
        max_tokens: int = 1024,
    ) -> str:
        """Multimodal call — sends a file (image or PDF) alongside the text prompt."""
        response = self._client.models.generate_content(
            model=self.MODEL,
            contents=[
                types.Part.from_bytes(data=file_bytes, mime_type=mime_type),
                types.Part.from_text(text=user),
            ],
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            ),
        )
        return response.text
