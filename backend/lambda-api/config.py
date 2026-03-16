# backend/lambda-api/config.py
# --------------------------------------------------
# Application configuration via environment variables.
# In AWS Lambda, these are set through the Lambda
# console or AWS Secrets Manager (recommended for prod).
# --------------------------------------------------
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "it_dashboard"
    db_user: str = "postgres"
    db_password: str = "changeme"

    # ── JWT ───────────────────────────────────────
    jwt_secret_key: str = "change-this-in-production-use-secrets-manager"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 480       # 8 hours

    # ── App ───────────────────────────────────────
    app_env: str = "development"                  # development | production
    allowed_origins: str = "http://localhost:3000"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
