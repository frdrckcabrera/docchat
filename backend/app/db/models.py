"""Pydantic models for API request and response schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Response model for a document."""

    id: int
    filename: str
    content_type: str
    size_bytes: int
    chunk_count: int
    created_at: str


class UploadResponse(BaseModel):
    """Response model for document upload."""

    document: DocumentResponse
    message: str


class Source(BaseModel):
    """A source chunk used to generate an answer."""

    chunk_index: int
    content: str
    similarity: float


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""

    document_id: int
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""

    conversation_id: int
    answer: str
    sources: list[Source]


class MessageResponse(BaseModel):
    """Response model for a chat message."""

    id: int
    role: str
    content: str
    sources: Optional[list[Source]] = None
    created_at: str


class ConversationResponse(BaseModel):
    """Response model for a conversation with messages."""

    id: int
    document_id: int
    created_at: str
    messages: list[MessageResponse]
