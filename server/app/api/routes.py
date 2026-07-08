import json
import re
import secrets
from urllib import parse, request as urllib_request

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse

from github import GithubException

from app.core.config import settings
from app.models.schemas import RepoRequest, AgentResponse
from app.services.agent_service import AgentService
from app.services.github_service import GithubService


def parse_repo_name(raw: str) -> str:
    raw = raw.strip().rstrip("/")
    m = re.search(r"github\.com[/:]([^/]+)/([^/]+?)(?:\.git)?$", raw)
    if m:
        return f"{m.group(1)}/{m.group(2)}"
    if raw.count("/") == 1 and not raw.startswith("http"):
        return raw
    raise ValueError(
        "Invalid repository format. Use owner/repo or a GitHub URL like "
        "https://github.com/owner/repo"
    )


router = APIRouter()
agent_service = AgentService()

def _get_token(request: Request) -> str | None:
    header = request.headers.get("X-GitHub-Token")
    if header:
        return header
    param = request.query_params.get("token")
    if param:
        return param
    return request.session.get("github_access_token")

@router.post("/analyze-and-fix", response_model=AgentResponse)
async def analyze_and_fix_repo(request: Request, payload: RepoRequest):
    access_token = _get_token(request)
    if not access_token:
        raise HTTPException(status_code=401, detail="GitHub account is not connected")

    try:
        repo = parse_repo_name(payload.repo_name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        response = await agent_service.process_repository(
            repo,
            payload.branch,
            access_token,
        )
        return response
    except GithubException as e:
        status = e.status if hasattr(e, 'status') else 500
        gh_message = ""
        if hasattr(e, 'data') and isinstance(e.data, dict):
            gh_message = e.data.get('message', '')
        if status == 404:
            raise HTTPException(
                status_code=404,
                detail=f"Repository '{payload.repo_name}' not found. Make sure the name is correct (e.g., owner/repo) and your GitHub account has access to it."
            )
        if status == 403:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Your GitHub account doesn't have permission to access '{payload.repo_name}'."
            )
        raise HTTPException(status_code=status, detail=gh_message or str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analyze-and-fix/stream")
async def analyze_and_fix_stream(request: Request, repo: str, branch: str = "main"):
    access_token = _get_token(request)
    if not access_token:
        raise HTTPException(status_code=401, detail="GitHub account is not connected")

    try:
        repo_name = parse_repo_name(repo)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    async def event_stream():
        try:
            async for event in agent_service.process_repository_stream(repo_name, branch, access_token):
                yield f"data: {json.dumps(event)}\n\n"
        except GithubException as e:
            status = e.status if hasattr(e, "status") else 500
            msg = "Repository not found or access denied."
            if status == 404:
                msg = f"Repository '{repo}' not found."
            yield f"data: {json.dumps({'type': 'error', 'message': msg})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


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

    msg = json.dumps({"type": "connected", "login": login, "token": access_token})
    return HTMLResponse(
        f"""<script>
if (window.opener) {{
    window.opener.postMessage({msg}, '*');
}}
window.close()
</script>"""
    )


@router.get("/auth/github/status")
async def github_status(request: Request):
    token = _get_token(request)
    login = request.session.get("github_user_login")
    return {"connected": bool(token), "login": login}


@router.post("/auth/github/logout")
async def github_logout(request: Request):
    request.session.pop("github_access_token", None)
    request.session.pop("github_user_login", None)
    request.session.pop("github_oauth_state", None)
    return {"connected": False}
