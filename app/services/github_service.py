from github import Github, Auth
from app.core.config import settings
import uuid

class GithubService:
    def __init__(self):
        auth = Auth.Token(settings.GITHUB_TOKEN)
        self.client = Github(auth=auth)

    def get_repo(self, repo_name: str):
        return self.client.get_repo(repo_name)

    def get_all_python_files(self, repo, branch="main"):
        files = []
        contents = repo.get_contents("", ref=branch)
        while contents:
            file_content = contents.pop(0)
            if file_content.type == "dir":
                contents.extend(repo.get_contents(file_content.path, ref=branch))
            elif file_content.path.endswith(".py"):
                files.append(file_content)
        return files

    def create_fix_branch(self, repo, base_branch="main"):
        branch_name = f"fix/auto-bug-fix-{uuid.uuid4().hex[:8]}"
        base_ref = repo.get_git_ref(f"heads/{base_branch}")
        repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=base_ref.object.sha)
        return branch_name

    def commit_fix(self, repo, branch_name, file_path, new_content, commit_message):
        file = repo.get_contents(file_path, ref=branch_name)
        repo.update_file(
            file.path,
            commit_message,
            new_content,
            file.sha,
            branch=branch_name
        )

    def create_pull_request(self, repo, branch_name, base_branch="main", title="Auto Bug Fix", body="Automated bug fixes proposed by AI Agent."):
        return repo.create_pull(
            title=title,
            body=body,
            head=branch_name,
            base=base_branch
        )
