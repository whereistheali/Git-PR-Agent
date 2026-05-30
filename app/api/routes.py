from fastapi import APIRouter, HTTPException
from app.models.schemas import RepoRequest, AgentResponse
from app.services.agent_service import AgentService

router = APIRouter()
agent_service = AgentService()

@router.post("/analyze-and-fix", response_model=AgentResponse)
async def analyze_and_fix_repo(request: RepoRequest):
    try:
        response = await agent_service.process_repository(request.repo_name, request.branch)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
