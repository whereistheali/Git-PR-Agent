from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GITHUB_TOKEN: str
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "anthropic/claude-3-haiku"
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
