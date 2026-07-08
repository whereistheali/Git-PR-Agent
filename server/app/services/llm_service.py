from openai import AsyncOpenAI
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

    async def analyze_code_for_bugs(self, file_path: str, code: str) -> dict:
        prompt = f"""
        Analyze the following Python code from '{file_path}' and report ONLY real bugs, syntax errors, typos in identifiers, logic errors, undefined variables, missing imports, or code that will crash at runtime.
        
        Do NOT report trivial style suggestions, PEP-8 formatting, best-practice improvements, or cosmetic changes.
        
        If the code has NO actual bugs that would cause it to fail, simply reply with the word: CLEAN
        
        If real bugs are found, you MUST respond using EXACTLY this format:
        
        ISSUES_FOUND
        <description>
        Write a concise description of the bug or error here.
        </description>
        <fixed_code>
        Write the COMPLETE fixed code here. Do not use markdown blocks inside this tag.