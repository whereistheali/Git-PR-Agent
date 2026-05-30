from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.routes import router

app = FastAPI(
    title="Git PR AI Agent",
    description="An autonomous agent that spots bugs in a repo and creates PRs to fix them.",
    version="1.0.0"
)

# Mount the static directory for the UI
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def serve_ui():
    return FileResponse("static/index.html")

@app.get("/health")
def health_check():
    return {"status": "ok"}
