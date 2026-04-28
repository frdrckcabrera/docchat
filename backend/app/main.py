"""DocChat FastAPI application entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.config import settings
from app.db.database import init_db
from app.routes import chat, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the database on startup."""
    init_db()
    yield


app = FastAPI(
    title="DocChat API",
    description="A simple RAG-based document Q&A API",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint with basic API info."""
    return {
        "name": "DocChat API",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint for monitoring and deployment."""
    return {"status": "ok"}


handler = Mangum(app, lifespan="on")
