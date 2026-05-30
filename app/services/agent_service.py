import asyncio
from app.services.github_service import GithubService
from app.services.llm_service import LLMService
from app.models.schemas import BugReport, AgentResponse

class AgentService:
    def __init__(self):
        self.github = GithubService()
        self.llm = LLMService()

    async def process_repository(self, repo_name: str, branch: str = "main") -> AgentResponse:
        # Fetch repo and files in a separate thread to avoid blocking the async event loop
        repo = await asyncio.to_thread(self.github.get_repo, repo_name)
        files = await asyncio.to_thread(self.github.get_all_python_files, repo, branch)
        
        async def analyze_file(file):
            # Skip empty or large files for simplicity
            if file.size == 0 or file.size > 50000:
                return None
                
            code = await asyncio.to_thread(lambda: file.decoded_content.decode("utf-8"))
            analysis = await self.llm.analyze_code_for_bugs(file.path, code)
            
            if analysis.get("has_issues"):
                return {
                    "path": file.path,
                    "desc": analysis["description"],
                    "code": analysis["fixed_code"]
                }
            return None

        # Process all files concurrently asynchronously
        tasks = [analyze_file(file) for file in files]
        results = await asyncio.gather(*tasks)
        
        fixes_to_apply = [r for r in results if r is not None]
        bugs_found = [
            BugReport(file_path=fix["path"], description=fix["desc"], proposed_fix=fix["code"])
            for fix in fixes_to_apply
        ]

        if not fixes_to_apply:
            return AgentResponse(
                status="success",
                repo=repo_name,
                message="No issues or improvements found. Code looks clean!"
            )

        # Apply fixes and create PR sequentially (running blocking calls in threads)
        fix_branch = await asyncio.to_thread(self.github.create_fix_branch, repo, branch)
        
        pr_body = "### Automated Bug Fixes & Improvements\\n\\n"
        for fix in fixes_to_apply:
            await asyncio.to_thread(
                self.github.commit_fix,
                repo, fix_branch, fix["path"], fix["code"], f"Update {fix['path']}"
            )
            pr_body += f"- **{fix['path']}**: {fix['desc']}\\n"

        pr = await asyncio.to_thread(
            self.github.create_pull_request,
            repo, fix_branch, branch, "Auto-generated: Bug fixes & Improvements by AI Agent", pr_body
        )

        return AgentResponse(
            status="success",
            repo=repo_name,
            pr_url=pr.html_url,
            bugs_found=bugs_found,
            message="Issues found and PR created successfully."
        )
