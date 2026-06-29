"""
NVIDIA NIM client — OpenAI-compatible API.
Exposes the same complete() / complete_with_file() interface as GeminiClient.
"""

import base64

from openai import OpenAI


class NvidiaClient:
    TEXT_MODEL = "meta/llama-3.1-8b-instruct"
    VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"
    BASE_URL = "https://integrate.api.nvidia.com/v1"
    DEFAULT_MAX_TOKENS = 2048

    def __init__(self, api_key: str) -> None:
        self._client = OpenAI(base_url=self.BASE_URL, api_key=api_key)

    def complete(
        self,
        system: str,
        user: str,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> str:
        response = self._client.chat.completions.create(
            model=self.TEXT_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
            top_p=0.7,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    def complete_with_file(
        self,
        system: str,
        user: str,
        file_bytes: bytes,
        mime_type: str,
        max_tokens: int = 1024,
    ) -> str:
        """Multimodal call — sends an image/PDF alongside the text prompt.

        llama-3.2-vision does not support a separate system role with vision content,
        so we prepend the system instructions into the user message.
        """
        b64 = base64.b64encode(file_bytes).decode("utf-8")
        data_url = f"data:{mime_type};base64,{b64}"
        combined_text = f"{system}\n\n{user}"
        response = self._client.chat.completions.create(
            model=self.VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": combined_text},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            temperature=0.2,
            top_p=0.7,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""
