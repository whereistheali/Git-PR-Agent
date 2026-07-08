from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    SESSION_SECRET_KEY: str
    APP_BASE_URL: str
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
