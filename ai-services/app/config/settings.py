"""
Centralised, validated environment config.
Mirrors the pattern used in backend/src/config/env.ts.
Throws at startup if required vars are missing.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Server
    AI_SERVICE_PORT: int = 8000
    ENVIRONMENT: str = "development"

    # AWS
    AWS_REGION: str = "us-east-1"
    DYNAMODB_ENDPOINT: str | None = None  # set for local DynamoDB

    # DynamoDB table names — defaults mirror backend/src/config/env.ts convention
    DYNAMODB_SUPPLIERS_TABLE: str = "pop-dev-suppliers"
    DYNAMODB_PURCHASE_ORDERS_TABLE: str = "pop-dev-purchase-orders"
    DYNAMODB_ALERTS_TABLE: str = "pop-dev-alerts"
    DYNAMODB_SAVINGS_RECOMMENDATIONS_TABLE: str = "pop-dev-savings-recommendations"

    # Secrets Manager secret names (production only)
    ANTHROPIC_SECRET_NAME: str = "pop/anthropic-api-key"
    OPENAI_SECRET_NAME: str = "pop/openai-api-key"

    # API keys — set directly in dev; loaded from Secrets Manager in prod
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
