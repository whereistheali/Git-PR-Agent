from pydantic import BaseModel
from typing import List, Optional

class RepoRequest(BaseModel):
    repo_name: str
    branch: str = "main"

class BugReport(BaseModel):
    file_path: str
    description: str
    proposed_fix: str

class AgentResponse(BaseModel):
    status: str
    repo: str
    pr_url: Optional[str] = None
    bugs_found: List[BugReport] = []
    message: str
