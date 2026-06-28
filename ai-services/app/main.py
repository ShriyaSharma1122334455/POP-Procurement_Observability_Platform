"""
POP AI Services — FastAPI application entry point.
Handles startup (secrets, AWS clients) and shutdown via lifespan context manager.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.clients.claude import ClaudeClient
from app.clients.dynamo import get_dynamo_resource
from app.config.secrets import load_secrets
from app.config.settings import settings
from app.routers.ai import router as ai_router
from app.routers.health import router as health_router
from app.utils.errors import AppError, app_error_handler
from app.utils.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_secrets(settings)

    app.state.settings = settings
    app.state.dynamo = get_dynamo_resource(settings)
    app.state.claude = ClaudeClient(settings.ANTHROPIC_API_KEY)

    logger.info(
        "POP AI Services started | env=%s region=%s",
        settings.ENVIRONMENT,
        settings.AWS_REGION,
    )

    yield

    # Shutdown — nothing to clean up for stateless clients
    logger.info("POP AI Services shutting down")


app = FastAPI(
    title="POP AI Services",
    description="AI-powered procurement intelligence — supplier scoring, savings agent, risk analysis",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production via env var
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]

app.include_router(health_router)
app.include_router(ai_router)
