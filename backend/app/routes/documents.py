"""API routes for document upload and management."""
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.db.database import get_connection, serialize_embedding
from app.db.models import DocumentResponse, UploadResponse
from app.services.chunker import chunk_text
from app.services.embeddings import embed_texts
from app.services.pdf_parser import extract_text


router = APIRouter(prefix="/api/documents", tags=["documents"])


# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024


@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a document, extract text, chunk it, and store embeddings.

    Supports PDF, TXT, and Markdown files up to 10 MB.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Extract text from the file
    try:
        text = extract_text(
            file_bytes, file.content_type or "application/octet-stream", file.filename
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    if not text.strip():
        raise HTTPException(
            status_code=400, detail="No text could be extracted from the file"
        )

    # Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Failed to chunk document")

    # Generate embeddings for all chunks at once (much faster than one-by-one)
    embeddings = embed_texts(chunks)

    # Store the document and chunks in a single transaction
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO documents (filename, content_type, size_bytes, chunk_count)
               VALUES (?, ?, ?, ?)""",
            (
                file.filename,
                file.content_type or "application/octet-stream",
                len(file_bytes),
                len(chunks),
            ),
        )
        document_id = cursor.lastrowid

        chunk_rows = [
            (document_id, idx, chunk, serialize_embedding(emb))
            for idx, (chunk, emb) in enumerate(zip(chunks, embeddings))
        ]
        cursor.executemany(
            """INSERT INTO chunks (document_id, chunk_index, content, embedding)
               VALUES (?, ?, ?, ?)""",
            chunk_rows,
        )
        conn.commit()

        # Fetch the created document
        row = cursor.execute(
            "SELECT * FROM documents WHERE id = ?", (document_id,)
        ).fetchone()

    return UploadResponse(
        document=DocumentResponse(
            id=row["id"],
            filename=row["filename"],
            content_type=row["content_type"],
            size_bytes=row["size_bytes"],
            chunk_count=row["chunk_count"],
            created_at=row["created_at"],
        ),
        message=f"Document uploaded and split into {len(chunks)} chunks",
    )


@router.get("", response_model=list[DocumentResponse])
async def list_documents() -> list[DocumentResponse]:
    """List all uploaded documents, newest first."""
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM documents ORDER BY created_at DESC"
        ).fetchall()

    return [
        DocumentResponse(
            id=row["id"],
            filename=row["filename"],
            content_type=row["content_type"],
            size_bytes=row["size_bytes"],
            chunk_count=row["chunk_count"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: int) -> None:
    """Delete a document and all its associated chunks and conversations."""
    with get_connection() as conn:
        cursor = conn.cursor()
        result = cursor.execute(
            "DELETE FROM documents WHERE id = ?", (document_id,)
        )
        conn.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Document not found")
