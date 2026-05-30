from openai import AsyncOpenAI
from app.core.config import settings
import re

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

    async def analyze_code_for_bugs(self, file_path: str, code: str) -> dict:
        prompt = f"""
        Analyze the following Python code from '{file_path}' for bugs, syntax errors, typos, logic errors, anti-patterns, or potential improvements.
        Pay very close attention to undefined variables, misspelled class names (e.g. typos in framework initializations like Fsk instead of Flask), and missing imports.
        
        If no bugs or improvements are found, simply reply with the word: CLEAN
        
        If issues are found, you MUST respond using EXACTLY this format:
        
        ISSUES_FOUND
        <description>
        Write a concise description of the bugs or improvements here.
        </description>
        <fixed_code>
        Write the COMPLETE fixed code here. Do not use markdown blocks inside this tag.
        </fixed_code>

        Code:
        ```python
        {code}
        ```
        """

        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENROUTER_MODEL,
                messages=[{"role": "user", "content": prompt}],
            )
            
            content = response.choices[0].message.content.strip()
            
            if "CLEAN" in content and "ISSUES_FOUND" not in content:
                return {"has_issues": False}
                
            desc_match = re.search(r'<description>(.*?)</description>', content, re.DOTALL)
            code_match = re.search(r'<fixed_code>(.*?)</fixed_code>', content, re.DOTALL)
            
            if desc_match and code_match:
                fixed_code = code_match.group(1).strip()
                # Remove python markdown blocks if the LLM accidentally added them inside the tag
                if fixed_code.startswith("```python"):
                    fixed_code = fixed_code[9:].strip()
                elif fixed_code.startswith("```"):
                    fixed_code = fixed_code[3:].strip()
                if fixed_code.endswith("```"):
                    fixed_code = fixed_code[:-3].strip()

                return {
                    "has_issues": True,
                    "description": desc_match.group(1).strip(),
                    "fixed_code": fixed_code
                }
            else:
                print(f"Failed to parse LLM response format for {file_path}. Content was: {content}")
                return {"has_issues": False}

        except Exception as e:
            print(f"Failed to call LLM for {file_path}: {e}")
            return {"has_issues": False}
