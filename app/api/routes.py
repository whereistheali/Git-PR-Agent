import json
import secrets
from urllib import parse, request as urllib_request

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse

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

    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><title>Connected!</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                display: flex; align-items: center; justify-content: center;
                min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                background: #FFFBEB; color: #78350F;
            }
            .card {
                text-align: center; padding: 3rem 2rem;
                border: 4px solid #D97706; border-radius: 2rem;
                background: rgba(255,255,255,0.95);
                box-shadow: 10px 10px 0px #B45309;
                max-width: 400px;
            }
            .check { font-size: 3rem; margin-bottom: 1rem; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #92400E; margin-bottom: 1.5rem; }
            a {
                display: inline-block; padding: 0.75rem 2rem;
                background: #1C1917; color: white; text-decoration: none;
                border-radius: 9999px; font-weight: 600;
                border: 3px solid #1C1917;
                box-shadow: 4px 4px 0px #1C1917;
                transition: all 0.15s ease;
            }
            a:hover { box-shadow: 2px 2px 0px #1C1917; transform: translate(2px, 2px); }
        </style>
        </head>
        <body>
            <div class="card">
                <div class="check">&#10003;</div>
                <h1>Connected to GitHub!</h1>
                <p id="statusMessage">This window will close automatically.</p>
                <a href="/app">Go to Dashboard &rarr;</a>
            </div>
            <script>
                var ifPopup = window.opener && window.opener !== window;
                if (!ifPopup) {
                    document.getElementById('statusMessage').textContent = 'Close this tab and go to your dashboard.';
                }
                setTimeout(function() {
                    window.close();
                }, 1500);
            </script>
        </body>
        </html>
        """
    )


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
