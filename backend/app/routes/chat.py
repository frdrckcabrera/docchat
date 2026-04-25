"""API routes for chat and conversation management."""
import json

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.db.database import deserialize_embedding, get_connection
from app.db.models import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    MessageResponse,
    Source,
)
from app.services.embeddings import cosine_similarity, embed_text
from app.services.llm import generate_answer


router = APIRouter(prefix="/api/chat", tags=["chat"])


def _retrieve_top_chunks(
    document_id: int, query: str, top_k: int
) -> list[tuple[int, str, float]]:
    """Retrieve the top-k most relevant chunks for a query.

    Args:
        document_id: ID of the document to search within.
        query: The user's question.
        top_k: Number of top chunks to return.

    Returns:
        List of (chunk_index, content, similarity_score) tuples,
        sorted by similarity in descending order.
    """
    query_embedding = embed_text(query)

    with get_connection() as conn:
        rows = conn.execute(
            """SELECT chunk_index, content, embedding
               FROM chunks WHERE document_id = ?""",
            (document_id,),
        ).fetchall()

    if not rows:
        return []

    # Compute similarity for each chunk. For a small portfolio app this
    # in-memory scan is fine; production would use a vector index.
    scored = []
    for row in rows:
        chunk_embedding = deserialize_embedding(row["embedding"])
        similarity = cosine_similarity(query_embedding, chunk_embedding)
        scored.append((row["chunk_index"], row["content"], similarity))

    scored.sort(key=lambda x: x[2], reverse=True)
    return scored[:top_k]


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Answer a question about a document using RAG.

    The flow is:
    1. Verify the document exists.
    2. Retrieve the top-k most relevant chunks via cosine similarity.
    3. Generate an answer using the LLM with the retrieved chunks as context.
    4. Persist the conversation and messages.
    """
    # Verify the document exists
    with get_connection() as conn:
        doc = conn.execute(
            "SELECT id FROM documents WHERE id = ?", (request.document_id,)
        ).fetchone()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")

    # Retrieve relevant chunks
    top_chunks = _retrieve_top_chunks(
        request.document_id, request.message, settings.top_k
    )

    if not top_chunks:
        raise HTTPException(
            status_code=400,
            detail="No chunks available for this document. Try re-uploading.",
        )

    # Build sources for the response
    sources = [
        Source(chunk_index=idx, content=content, similarity=round(sim, 4))
        for idx, content, sim in top_chunks
    ]

    # Generate answer using the LLM
    context_chunks = [content for _, content, _ in top_chunks]
    try:
        answer = generate_answer(context_chunks, request.message)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    # Persist the conversation and messages
    with get_connection() as conn:
        cursor = conn.cursor()
        if request.conversation_id is None:
            cursor.execute(
                "INSERT INTO conversations (document_id) VALUES (?)",
                (request.document_id,),
            )
            conversation_id = cursor.lastrowid
        else:
            existing = cursor.execute(
                "SELECT id FROM conversations WHERE id = ?",
                (request.conversation_id,),
            ).fetchone()
            if not existing:
                raise HTTPException(
                    status_code=404, detail="Conversation not found"
                )
            conversation_id = request.conversation_id

        # Save the user message
        cursor.execute(
            """INSERT INTO messages (conversation_id, role, content)
               VALUES (?, 'user', ?)""",
            (conversation_id, request.message),
        )
        # Save the assistant message with sources
        sources_json = json.dumps([s.model_dump() for s in sources])
        cursor.execute(
            """INSERT INTO messages (conversation_id, role, content, sources)
               VALUES (?, 'assistant', ?, ?)""",
            (conversation_id, answer, sources_json),
        )
        conn.commit()

    return ChatResponse(
        conversation_id=conversation_id, answer=answer, sources=sources
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: int) -> ConversationResponse:
    """Retrieve a conversation with all its messages."""
    with get_connection() as conn:
        conv = conn.execute(
            "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
        ).fetchone()
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

        message_rows = conn.execute(
            """SELECT * FROM messages WHERE conversation_id = ?
               ORDER BY created_at ASC, id ASC""",
            (conversation_id,),
        ).fetchall()

    messages = []
    for row in message_rows:
        sources = None
        if row["sources"]:
            sources_data = json.loads(row["sources"])
            sources = [Source(**s) for s in sources_data]
        messages.append(
            MessageResponse(
                id=row["id"],
                role=row["role"],
                content=row["content"],
                sources=sources,
                created_at=row["created_at"],
            )
        )

    return ConversationResponse(
        id=conv["id"],
        document_id=conv["document_id"],
        created_at=conv["created_at"],
        messages=messages,
    )
