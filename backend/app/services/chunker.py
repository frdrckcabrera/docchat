"""Service for splitting text into overlapping chunks for embedding."""
import re

from app.config import settings


def _split_into_sentences(text: str) -> list[str]:
    """Split text into sentences using simple regex on punctuation.

    This is a lightweight approach that works well enough for chunking.
    For production use, a library like nltk or spaCy would be more robust.
    """
    # Split on sentence-ending punctuation followed by whitespace
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]


def _approx_token_count(text: str) -> int:
    """Approximate the number of tokens in a string.

    Uses a rough heuristic of ~1.3 tokens per word, which approximates
    the behavior of common tokenizers like GPT and Claude's.
    """
    word_count = len(text.split())
    return int(word_count * 1.3)


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """Split text into overlapping chunks.

    The algorithm groups sentences together until the approximate token
    count reaches `chunk_size`, then starts a new chunk that overlaps
    with the previous one by approximately `chunk_overlap` tokens.

    Args:
        text: The text to split.
        chunk_size: Target chunk size in approximate tokens.
            Defaults to settings.chunk_size.
        chunk_overlap: Approximate token overlap between chunks.
            Defaults to settings.chunk_overlap.

    Returns:
        List of text chunks. Returns an empty list if input is empty.
    """
    if not text or not text.strip():
        return []

    chunk_size = chunk_size or settings.chunk_size
    chunk_overlap = chunk_overlap or settings.chunk_overlap

    sentences = _split_into_sentences(text)
    if not sentences:
        return []

    chunks: list[str] = []
    current_sentences: list[str] = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = _approx_token_count(sentence)

        # If adding this sentence exceeds chunk_size and we already
        # have content, finalize the current chunk first.
        if current_tokens + sentence_tokens > chunk_size and current_sentences:
            chunks.append(" ".join(current_sentences))

            # Start the new chunk with overlap from the end of the previous one.
            overlap_sentences: list[str] = []
            overlap_tokens = 0
            for prev in reversed(current_sentences):
                prev_tokens = _approx_token_count(prev)
                if overlap_tokens + prev_tokens > chunk_overlap:
                    break
                overlap_sentences.insert(0, prev)
                overlap_tokens += prev_tokens

            current_sentences = overlap_sentences
            current_tokens = overlap_tokens

        current_sentences.append(sentence)
        current_tokens += sentence_tokens

    # Add the final chunk if it has content.
    if current_sentences:
        chunks.append(" ".join(current_sentences))

    return chunks
