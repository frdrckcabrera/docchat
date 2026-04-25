"""Tests for the text chunker service."""
import pytest

from app.services.chunker import chunk_text


def test_chunk_empty_string_returns_empty_list():
    assert chunk_text("") == []


def test_chunk_whitespace_only_returns_empty_list():
    assert chunk_text("   \n\n  ") == []


def test_chunk_short_text_returns_single_chunk():
    text = "This is a short sentence. This is another one."
    chunks = chunk_text(text, chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 1
    assert "short sentence" in chunks[0]
    assert "another one" in chunks[0]


def test_chunk_long_text_splits_into_multiple_chunks():
    # Create text that should produce multiple chunks.
    sentences = [f"This is sentence number {i} with several words." for i in range(100)]
    text = " ".join(sentences)
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    assert len(chunks) > 1


def test_chunks_have_overlap():
    sentences = [f"Sentence {i} contains content." for i in range(50)]
    text = " ".join(sentences)
    chunks = chunk_text(text, chunk_size=50, chunk_overlap=20)
    if len(chunks) >= 2:
        # The end of chunk 0 should share some content with the start of chunk 1
        # because of overlap.
        words_end = set(chunks[0].split()[-5:])
        words_start = set(chunks[1].split()[:10])
        assert len(words_end & words_start) > 0


def test_chunk_preserves_all_content():
    text = "First sentence here. Second sentence follows. Third sentence ends it."
    chunks = chunk_text(text, chunk_size=500, chunk_overlap=50)
    combined = " ".join(chunks)
    assert "First sentence" in combined
    assert "Second sentence" in combined
    assert "Third sentence" in combined
