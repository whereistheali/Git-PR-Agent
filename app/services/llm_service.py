from openai import AsyncOpenAI
from app.core.config import settings
import json

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

    async def analyze_code_for_bugs(self, file_path: str, code: str) -> dict:
        prompt = f"""
        Analyze the following Python code from '{file_path}' for bugs, logic errors, anti-patterns, or potential improvements.
        If no bugs or improvements are found, return {{"has_issues": false}}.
        If issues or improvements are found, return a JSON object with:
        - "has_issues": true
        - "description": A concise description of the bug or improvement.
        - "fixed_code": The complete corrected and improved code.

        Code:
        ```python
        {code}
        ```
        Respond ONLY with valid JSON.
        """

        response = await self.client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        try:
            return json.loads(response.choices[0].message.content)
        except Exception:
            return {"has_issues": False}
