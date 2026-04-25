"""Tests for the embeddings service.

These tests use the actual sentence-transformers model and may be slow
on first run while the model downloads (~80MB).
"""
import pytest

from app.services.embeddings import cosine_similarity


def test_cosine_similarity_identical_vectors():
    vec = [1.0, 2.0, 3.0]
    assert cosine_similarity(vec, vec) == pytest.approx(1.0)


def test_cosine_similarity_orthogonal_vectors():
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)


def test_cosine_similarity_opposite_vectors():
    assert cosine_similarity([1.0, 0.0], [-1.0, 0.0]) == pytest.approx(-1.0)


def test_cosine_similarity_zero_vector_returns_zero():
    assert cosine_similarity([0.0, 0.0], [1.0, 1.0]) == 0.0


def test_cosine_similarity_returns_float():
    result = cosine_similarity([1.0, 2.0], [3.0, 4.0])
    assert isinstance(result, float)
    assert 0.0 <= result <= 1.0
