"""Service for extracting text content from uploaded files."""
from io import BytesIO

from pypdf import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text content from a PDF file's bytes.

    Args:
        file_bytes: Raw bytes of the PDF file.

    Returns:
        Concatenated text from all pages, separated by newlines.

    Raises:
        ValueError: If the PDF cannot be parsed.
    """
    try:
        reader = PdfReader(BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages_text.append(text)
        return "\n\n".join(pages_text)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF: {e}") from e


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from a plain text or markdown file.

    Args:
        file_bytes: Raw bytes of the text file.

    Returns:
        Decoded text content.

    Raises:
        ValueError: If the file cannot be decoded as UTF-8.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError as e:
        raise ValueError(f"Failed to decode text file as UTF-8: {e}") from e


def extract_text(file_bytes: bytes, content_type: str, filename: str) -> str:
    """Extract text from a file based on its content type or filename.

    Args:
        file_bytes: Raw bytes of the file.
        content_type: MIME type of the file.
        filename: Name of the file (used as a fallback for type detection).

    Returns:
        Extracted text content.

    Raises:
        ValueError: If the file type is unsupported or extraction fails.
    """
    lower_name = filename.lower()
    if content_type == "application/pdf" or lower_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if (
        content_type.startswith("text/")
        or lower_name.endswith((".txt", ".md", ".markdown"))
    ):
        return extract_text_from_txt(file_bytes)
    raise ValueError(
        f"Unsupported file type: {content_type}. "
        f"Supported types are PDF, TXT, and Markdown."
    )
