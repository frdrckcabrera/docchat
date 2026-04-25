"""LLM service that abstracts over Gemini and Claude providers.

The provider is selected via the LLM_PROVIDER environment variable.
Both providers use the same prompt template for consistency.
"""
from app.config import settings


SYSTEM_PROMPT = """You are a helpful assistant that answers questions based ONLY on the provided document context.

Rules:
1. Answer using only information from the provided context below.
2. If the context does not contain enough information to answer, say so clearly. Do not make up information.
3. Keep answers concise and directly relevant to the question.
4. When referencing information, be specific about what the document says.
5. If the question is unrelated to the document, politely redirect the user."""


def _build_user_prompt(context_chunks: list[str], question: str) -> str:
    """Build the user-facing prompt with retrieved context and question."""
    context_block = "\n\n---\n\n".join(
        f"[Source {i + 1}]\n{chunk}" for i, chunk in enumerate(context_chunks)
    )
    return (
        f"Context from the document:\n\n{context_block}\n\n"
        f"Question: {question}\n\n"
        f"Answer:"
    )


def _generate_with_gemini(context_chunks: list[str], question: str) -> str:
    """Generate an answer using Google Gemini."""
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. "
            "Get a free key at https://aistudio.google.com/apikey"
        )

    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=SYSTEM_PROMPT,
    )
    user_prompt = _build_user_prompt(context_chunks, question)
    response = model.generate_content(user_prompt)
    return response.text or "I couldn't generate a response."


def _generate_with_claude(context_chunks: list[str], question: str) -> str:
    """Generate an answer using Anthropic Claude."""
    if not settings.anthropic_api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. "
            "Get a key at https://console.anthropic.com/"
        )

    import anthropic

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    user_prompt = _build_user_prompt(context_chunks, question)
    response = client.messages.create(
        model=settings.claude_model,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text


def generate_answer(context_chunks: list[str], question: str) -> str:
    """Generate an answer to a question using the configured LLM provider.

    Args:
        context_chunks: List of relevant text chunks from the document.
        question: The user's question.

    Returns:
        The generated answer string.

    Raises:
        RuntimeError: If the configured provider has no API key set.
        ValueError: If the configured provider is not supported.
    """
    provider = settings.llm_provider.lower()
    if provider == "gemini":
        return _generate_with_gemini(context_chunks, question)
    if provider == "claude":
        return _generate_with_claude(context_chunks, question)
    raise ValueError(
        f"Unsupported LLM provider: {provider}. Use 'gemini' or 'claude'."
    )
