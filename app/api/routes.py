import json
import secrets
from urllib import parse, request as urllib_request

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.models.schemas import RepoRequest, AgentResponse
from app.services.agent_service import AgentService
from app.services.github_service import GithubService

router = APIRouter()
agent_service = AgentService()

@router.post("/analyze-and-fix", response_model=AgentResponse)
async def analyze_and_fix_repo(request: Request, payload: RepoRequest):
    access_token = request.session.get("github_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="GitHub account is not connected")

    try:
        response = await agent_service.process_repository(
            payload.repo_name,
            payload.branch,
            access_token,
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/auth/github/login")
async def github_login(request: Request):
    state = secrets.token_urlsafe(24)
    request.session["github_oauth_state"] = state

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": f"{settings.APP_BASE_URL}/api/v1/auth/github/callback",
        "scope": "repo read:user",
        "state": state,
        "allow_signup": "true",
        "prompt": "select_account",
    }
    github_authorize_url = "https://github.com/login/oauth/authorize?" + parse.urlencode(params)
    return RedirectResponse(url=github_authorize_url)


@router.get("/auth/github/callback")
async def github_callback(request: Request, code: str, state: str):
    expected_state = request.session.get("github_oauth_state")
    if not expected_state or state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    token_payload = parse.urlencode(
        {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
            "redirect_uri": f"{settings.APP_BASE_URL}/api/v1/auth/github/callback",
            "state": state,
        }
    ).encode("utf-8")

    token_request = urllib_request.Request(
        "https://github.com/login/oauth/access_token",
        data=token_payload,
        headers={"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    with urllib_request.urlopen(token_request, timeout=20) as token_response:
        token_data = json.loads(token_response.read().decode("utf-8"))

    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="Unable to retrieve GitHub access token")

    github = GithubService(access_token)
    login = github.get_current_user()

    request.session["github_access_token"] = access_token
    request.session["github_user_login"] = login
    request.session.pop("github_oauth_state", None)

    return RedirectResponse(url="/app", status_code=302)


@router.get("/auth/github/status")
async def github_status(request: Request):
    token = request.session.get("github_access_token")
    login = request.session.get("github_user_login")
    return {"connected": bool(token), "login": login}


@router.post("/auth/github/logout")
async def github_logout(request: Request):
    request.session.pop("github_access_token", None)
    request.session.pop("github_user_login", None)
    request.session.pop("github_oauth_state", None)
    return {"connected": False}
