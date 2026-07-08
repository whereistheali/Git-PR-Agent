import asyncio
from server.app.services.github_service import GithubService
from server.app.services.llm_service import LLMService
from server.app.models.schemas import BugReport, AgentResponse

class AgentService:
    def __init__(self):
        self.llm = LLMService()

    async def process_repository(self, repo_name: str, branch: str = "main", access_token: str = "") -> AgentResponse:
        github = GithubService(access_token)
        repo = await asyncio.to_thread(github.get_repo, repo_name)
        files = await asyncio.to_thread(github.get_all_python_files, repo, branch)

        async def analyze_file(file):
            if file.size == 0 or file.size > 50000:
                return None
            code = await asyncio.to_thread(lambda: file.decoded_content.decode("utf-8"))
            print(f"Analyzing {file.path}... \n\nCode {code}")
            analysis = await self.llm.analyze_code_for_bugs(file.path, code)
            if analysis.get("has_issues"):
                return {
                    "path": file.path,
                    "desc": analysis["description"],
                    "code": analysis["fixed_code"]
                }
            return None

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

        has_push_access = getattr(repo.permissions, 'push', False)
        target_repo = repo
        head_branch_prefix = ""

        if not has_push_access:
            print(f"No push access to {repo_name}. Forking repository...")
            target_repo = await asyncio.to_thread(github.fork_repository, repo)
            current_user = await asyncio.to_thread(github.get_current_user)
            head_branch_prefix = f"{current_user}:"
            print(f"Successfully configured fork at {target_repo.full_name}")

        fix_branch = await asyncio.to_thread(github.create_fix_branch, target_repo, branch)
        head_branch = f"{head_branch_prefix}{fix_branch}"

        pr_body = "### Automated Bug Fixes & Improvements\\n\\n"
        for fix in fixes_to_apply:
            await asyncio.to_thread(
                github.commit_fix,
                target_repo, fix_branch, fix["path"], fix["code"], f"Update {fix['path']}"
            )
            pr_body += f"- **{fix['path']}**: {fix['desc']}\\n"

        try:
            pr = await asyncio.to_thread(
                github.create_pull_request,
                repo, head_branch, branch, "Auto-generated: Bug fixes & Improvements by AI Agent", pr_body
            )
        except Exception as e:
            if "403" in str(e):
                raise Exception("GitHub API 403 Forbidden: The connected GitHub account does not have enough permission to create this pull request.")
            raise e

        return AgentResponse(
            status="success",
            repo=repo_name,
            pr_url=pr.html_url,
            bugs_found=bugs_found,
            message="Issues found and PR created successfully."
        )

    async def process_repository_stream(self, repo_name: str, branch: str, access_token: str):
        github = GithubService(access_token)

        repo = await asyncio.to_thread(github.get_repo, repo_name)
        files = await asyncio.to_thread(github.get_all_python_files, repo, branch)

        total = len(files)
        yield {"type": "start", "total": total, "message": f"Found {total} Python file{'s' if total != 1 else ''}"}

        fixes_to_apply = []

        for i, file in enumerate(files):
            file_path = file.path

            if file.size == 0:
                yield {"type": "skip", "file": file_path, "reason": "empty file"}
                continue
            if file.size > 50000:
                yield {"type": "skip", "file": file_path, "reason": "file too large (>50KB)"}
                continue

            code = await asyncio.to_thread(lambda: file.decoded_content.decode("utf-8"))
            code_lines = code.split("\n")
            num_lines = len(code_lines)
            preview_lines = code_lines[:50]
            code_preview = "\n".join(preview_lines)

            yield {
                "type": "analyzing",
                "file": file_path,
                "index": i + 1,
                "total": total,
                "lines": num_lines,
                "code_preview": code_preview,
            }

            analysis = await self.llm.analyze_code_for_bugs(file_path, code)

            if analysis.get("has_issues"):
                fixes_to_apply.append({
                    "path": file_path,
                    "desc": analysis["description"],
                    "code": analysis["fixed_code"],
                })
                yield {
                    "type": "bug_found",
                    "file": file_path,
                    "description": analysis["description"],
                    "proposed_fix": analysis["fixed_code"],
                }
            else:
                yield {"type": "clean", "file": file_path}

        if not fixes_to_apply:
            yield {"type": "complete", "pr_url": None, "message": "No issues or improvements found. Code looks clean!", "bugs_found": []}
            return

        has_push_access = getattr(repo.permissions, 'push', False)
        target_repo = repo
        head_branch_prefix = ""

        if not has_push_access:
            yield {"type": "info", "message": "No push access. Forking repository..."}
            target_repo = await asyncio.to_thread(github.fork_repository, repo)
            current_user = await asyncio.to_thread(github.get_current_user)
            head_branch_prefix = f"{current_user}:"

        yield {"type": "info", "message": "Creating fix branch..."}
        fix_branch = await asyncio.to_thread(github.create_fix_branch, target_repo, branch)
        head_branch = f"{head_branch_prefix}{fix_branch}"

        pr_body = "### Automated Bug Fixes & Improvements\n\n"
        for fix in fixes_to_apply:
            yield {"type": "info", "message": f"Applying fix to {fix['path']}..."}
            await asyncio.to_thread(
                github.commit_fix,
                target_repo, fix_branch, fix["path"], fix["code"], f"Update {fix['path']}"
            )
            pr_body += f"- **{fix['path']}**: {fix['desc']}\n"

        try:
            yield {"type": "info", "message": "Creating pull request..."}
            pr = await asyncio.to_thread(
                github.create_pull_request,
                repo, head_branch, branch,
                "Auto-generated: Bug fixes & Improvements by AI Agent", pr_body,
            )
        except Exception as e:
            if "403" in str(e):
                yield {"type": "error", "message": "Permission denied. Cannot create pull request."}
                return
            yield {"type": "error", "message": str(e)}
            return

        bugs_report = [
            {"file_path": fix["path"], "description": fix["desc"], "proposed_fix": fix["code"]}
            for fix in fixes_to_apply
        ]

        yield {
            "type": "complete",
            "pr_url": pr.html_url,
            "message": "Issues found and PR created successfully.",
            "bugs_found": bugs_report,
        }
