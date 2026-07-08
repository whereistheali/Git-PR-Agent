# GitPR AI

An autonomous AI agent that scans GitHub repositories for bugs, fixes them, and automatically opens Pull Requests.

**Tech stack:** FastAPI (backend) + React/Vite (frontend)

## Setup

### Backend (`server/`)

```bash
cd server
uv sync
```

Configure `.env` in `server/`:

```env
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
SESSION_SECRET_KEY=random_secret_key
APP_BASE_URL=http://localhost:8000
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

Run locally:

```bash
uv run uvicorn app.main:app --reload
```

### Frontend (`client/`)

```bash
cd client
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend automatically.

### Production

- **Frontend** — deploy `client/` to Vercel with `VITE_API_URL` set to the backend URL
- **Backend** — deploy `server/` to Render with root directory set to `server`, start command `uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and env vars: `APP_BASE_URL`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`
