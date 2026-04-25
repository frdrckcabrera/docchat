"""Service for generating text embeddings using sentence-transformers.

The model runs locally on CPU - no API calls or costs.
The model is loaded lazily on first use and kept in memory.
"""
from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import settings


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    """Load and cache the embedding model.

    The model is downloaded automatically on first use (~80MB).
    Subsequent calls return the cached instance.
    """
    return SentenceTransformer(settings.embedding_model)


def embed_text(text: str) -> list[float]:
    """Generate an embedding vector for a single string.

    Args:
        text: Input text to embed.

    Returns:
        A list of floats representing the embedding.
    """
    model = _get_model()
    embedding = model.encode(text, convert_to_numpy=True, show_progress_bar=False)
    return embedding.tolist()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a batch of texts.

    Batching is significantly faster than calling embed_text in a loop.

    Args:
        texts: List of input texts.

    Returns:
        List of embedding vectors, one per input text.
    """
    if not texts:
        return []
    model = _get_model()
    embeddings = model.encode(
        texts, convert_to_numpy=True, show_progress_bar=False, batch_size=32
    )
    return embeddings.tolist()


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors.

    Args:
        vec_a: First vector.
        vec_b: Second vector.

    Returns:
        Cosine similarity score in [-1, 1]. Returns 0.0 if either vector
        is zero-length.
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
