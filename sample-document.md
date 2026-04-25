# DocChat — Sample Test Document

This is a sample document you can use to try out DocChat after starting the app.

## About DocChat

DocChat is a simple AI-powered question-answering tool. You upload a document
(PDF, plain text, or Markdown), and then you can ask questions about its
contents in natural language. Behind the scenes, the application uses a
technique called Retrieval-Augmented Generation, or RAG.

## How RAG Works

When a document is uploaded, it is split into smaller pieces called chunks.
Each chunk is converted into a numerical vector called an embedding using a
machine learning model. These embeddings capture the semantic meaning of the
text, so similar passages produce similar vectors.

When you ask a question, your question is also converted into an embedding.
The system then finds the chunks whose embeddings are most similar to the
question's embedding. These top-matching chunks are passed to a large language
model along with your question. The language model generates an answer
grounded in the retrieved context, rather than relying solely on its training
data.

## Why Not Just Use the LLM Directly?

Large language models have several limitations that RAG helps address. They
may not have access to recent or private information. They can hallucinate,
producing plausible-sounding but incorrect answers. And they have a fixed
context window, so feeding them an entire long document is often impractical
or expensive.

By retrieving only the most relevant chunks, RAG keeps prompts small, grounds
answers in real source material, and lets you query custom content the model
has never seen before.

## Tech Stack

The DocChat backend is built with Python using FastAPI as the web framework.
SQLite is used as the database, with embeddings stored as JSON-encoded vectors
in a chunks table. The embedding model is sentence-transformers'
all-MiniLM-L6-v2, which runs locally on CPU at no cost.

The frontend is a single-page React application written in TypeScript, built
with Vite and styled with Tailwind CSS. It communicates with the backend over
a small REST API.

## Try It

After uploading this file, try asking questions like:

- What is RAG?
- Why is RAG better than using an LLM alone?
- What database does DocChat use?
- Which embedding model does the app use?

The answers should be drawn from the content above, with citations showing
which chunks of the document were used.
