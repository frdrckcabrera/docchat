"""Tests for the PDF parser service."""
import pytest

from app.services.pdf_parser import extract_text, extract_text_from_txt


def test_extract_text_from_txt_basic():
    content = "Hello, world!"
    result = extract_text_from_txt(content.encode("utf-8"))
    assert result == content


def test_extract_text_from_txt_multiline():
    content = "Line one.\nLine two.\nLine three."
    result = extract_text_from_txt(content.encode("utf-8"))
    assert result == content


def test_extract_text_from_txt_invalid_encoding_raises():
    invalid_bytes = b"\xff\xfe\xfd"
    with pytest.raises(ValueError, match="Failed to decode"):
        extract_text_from_txt(invalid_bytes)


def test_extract_text_routes_txt():
    content = b"Plain text content."
    result = extract_text(content, "text/plain", "doc.txt")
    assert result == "Plain text content."


def test_extract_text_routes_markdown():
    content = b"# Heading\n\nSome content."
    result = extract_text(content, "text/markdown", "doc.md")
    assert "Heading" in result


def test_extract_text_unsupported_type_raises():
    with pytest.raises(ValueError, match="Unsupported file type"):
        extract_text(b"data", "application/zip", "file.zip")
