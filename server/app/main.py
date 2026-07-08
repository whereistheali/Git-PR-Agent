from fastapi import FastAPI
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.api.routes import router

app = FastAPI(
    title="Git PR AI Agent",
    description="An autonomous agent that spots bugs in a repo and creates PRs to fix them.",
    version="1.0.0"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    same_site="lax",
    https_only=False,
)

app.include_router(router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Serve React build assets
from fastapi.staticfiles import StaticFiles
app.mount("/assets", StaticFiles(directory="../client/dist/assets"), name="assets")

# SPA fallback — serve index.html for all non-API routes
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    return FileResponse("../client/dist/index.html")
