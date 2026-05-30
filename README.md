# GitPR AI Agent

An autonomous AI agent built with Python, FastAPI, and OpenRouter that scans a given GitHub repository for bugs, fixes them, and automatically opens a Pull Request.

## Architecture & Code Quality

The project uses a **Clean Architecture** pattern to separate concerns and ensure maintainability:
- `api/`: Controllers/Routers to handle HTTP requests.
- `services/`: Business logic (Agent workflow, GitHub API integration, LLM integrations).
- `models/`: Data validation schemas using Pydantic.
- `core/`: Application settings and environment configurations.

The code avoids unnecessary comments and relies on explicit variable names and structured design to maintain readability.

## How It Works

1. **Trigger**: An API endpoint `/api/v1/analyze-and-fix` is called with a target `repo_name` and `branch`.
2. **Retrieve Files**: The `GithubService` connects to GitHub using `PyGithub` and recursively retrieves all `.py` files from the specified branch.
3. **Analyze**: The `LLMService` feeds the code files to an LLM via **OpenRouter** (e.g., Anthropic Claude). The model is instructed to spot bugs and return structured JSON indicating any issues and providing fixed code.
4. **Action**:
   - If no bugs are found, the agent returns a success message.
   - If bugs are spotted, the `AgentService` uses `GithubService` to create a new branch from the base branch.
5. **Commit & PR**: The agent applies the fixed code to the newly created branch, commits the changes, and finally creates a Pull Request outlining the bugs that were addressed.

## Setup Instructions

### 1. Requirements

Ensure you have [uv](https://github.com/astral-sh/uv) installed on your system.

```bash
uv sync
```

### 2. Environment Variables

Create a `.env` file in the root directory and configure the following:

```env
GITHUB_TOKEN=your_github_personal_access_token
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3-haiku
```

**Note**: Your GitHub Personal Access Token needs `repo` scope permissions to read code, create branches, and open PRs.

### 3. Run the Application

Start the FastAPI application using Uvicorn via `uv`:

```bash
uv run uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`. You can simply navigate to this URL in your web browser to use the built-in UI!

## API Usage

### `POST /api/v1/analyze-and-fix`

**Request Body**:
```json
{
  "repo_name": "owner/repo",
  "branch": "main"
}
```

**Response**:
```json
{
  "status": "success",
  "repo": "owner/repo",
  "pr_url": "https://github.com/owner/repo/pull/1",
  "bugs_found": [
    {
      "file_path": "src/utils.py",
      "description": "Index out of bounds error in the loop.",
      "proposed_fix": "..."
    }
  ],
  "message": "Bugs found and PR created successfully."
}
```
