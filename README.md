# DocChat

A full-stack RAG application for asking natural-language questions about your documents. Upload a PDF or text file, and an AI assistant answers questions about it with citations to the exact passages it used.

Built as a portfolio project demonstrating Python (FastAPI), AI/RAG, React + TypeScript, SQL, and CI/CD — the core stack for a modern full-stack AI engineering role.

## Features

- **Upload documents** — PDF, TXT, or Markdown files up to 10 MB.
- **Ask questions in natural language** — answered using only the document's content.
- **Cited answers** — every response shows which chunks of the document were used, with similarity scores.
- **Multiple conversations** — each document keeps its own chat history.
- **Free to run** — uses local embeddings (sentence-transformers) and a free Gemini API tier; no paid services required.

## Tech Stack

**Backend** — Python 3.11, FastAPI, SQLite, sentence-transformers, Pydantic, pytest
**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Vitest
**AI** — Google Gemini (free tier) or Anthropic Claude; sentence-transformers `all-MiniLM-L6-v2` for local embeddings
**DevOps** — Docker, GitHub Actions CI

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│  React + TS     │         │  FastAPI         │         │  Gemini /    │
│  (Vite)         │  HTTP   │  ┌────────────┐  │  HTTPS  │  Claude API  │
│                 │ ──────> │  │ /documents │  │ ──────> │              │
│  - Upload UI    │         │  │ /chat      │  │         └──────────────┘
│  - Chat UI      │ <────── │  └────────────┘  │
│  - Sources      │         │       │          │
└─────────────────┘         │       v          │
                            │  ┌────────────┐  │
                            │  │ Services   │  │
                            │  │ - chunker  │  │
                            │  │ - embed    │  │
                            │  │ - llm      │  │
                            │  └────────────┘  │
                            │       │          │
                            │       v          │
                            │  ┌────────────┐  │
                            │  │  SQLite    │  │
                            │  │  + vectors │  │
                            │  └────────────┘  │
                            └──────────────────┘
```

### How it works (RAG flow)

1. **Upload.** A document is uploaded, text is extracted (PDF via `pypdf`, plain text directly), and the text is split into overlapping chunks of approximately 500 tokens.
2. **Embed.** Each chunk is converted into a 384-dimensional embedding vector using `sentence-transformers/all-MiniLM-L6-v2`, which runs locally on CPU.
3. **Store.** Chunks and their embeddings are saved to SQLite.
4. **Ask.** When the user asks a question, the question is also embedded, then cosine similarity is computed against every chunk for that document.
5. **Retrieve.** The top 5 most similar chunks become the context.
6. **Generate.** The chunks plus the question are sent to Gemini (or Claude) with a system prompt instructing the model to answer using only the provided context.
7. **Return.** The answer is sent back along with the source chunks so the user can verify the response.

## Project Structure

```
docchat/
├── backend/
│   ├── app/
│   │   ├── routes/        # FastAPI route handlers
│   │   ├── services/      # Business logic (chunking, embeddings, LLM)
│   │   ├── db/            # Database connection and schemas
│   │   ├── config.py      # Settings loaded from env vars
│   │   └── main.py        # FastAPI app entry point
│   ├── tests/             # pytest tests
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks (useChat)
│   │   ├── api/           # API client
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/ci.yml
├── docker-compose.yml
└── sample-document.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- A free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) *(or* an Anthropic API key)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR-USERNAME/docchat.git
cd docchat
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set your Gemini API key:

```
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-key-here
```

Then run the backend:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` and interactive docs at `http://localhost:8000/docs`.

> **First run note.** On first startup the `sentence-transformers` model (~80 MB) is downloaded automatically. This takes a minute.

### 3. Set up the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. Try it out

1. Upload `sample-document.md` (or any PDF/text file) using the sidebar.
2. Click the document to select it.
3. Ask a question like *"What is RAG?"* or *"What database does DocChat use?"*
4. See the answer along with expandable source citations.

## Running with Docker

```bash
cd backend
cp .env.example .env       # add your API key
cd ..
docker compose up --build
```

The backend will be available at `http://localhost:8000`. Run the frontend separately with `npm run dev` (or build it and serve the static files).

## Testing

**Backend:**

```bash
cd backend
pytest -v
```

**Frontend:**

```bash
cd frontend
npm test
```

CI runs both on every push via GitHub Actions.

## API Reference

### `POST /api/documents/upload`
Upload a document. `multipart/form-data` with field `file`.

### `GET /api/documents`
List all uploaded documents.

### `DELETE /api/documents/{id}`
Delete a document and its chunks/conversations.

### `POST /api/chat`
```json
{
  "document_id": 1,
  "message": "What is RAG?",
  "conversation_id": 5
}
```
Returns the answer plus source chunks. Omit `conversation_id` to start a new conversation.

### `GET /api/chat/conversations/{id}`
Retrieve a conversation with all messages.

Full interactive docs are available at `/docs` when the backend is running.

## Design Decisions & Trade-offs

**SQLite with JSON-encoded embeddings instead of a dedicated vector database.** For a document set in the hundreds-of-chunks range, an in-memory cosine similarity scan is fast enough and avoids running a second service like Pinecone or Postgres + pgvector. The retrieval logic is in [`app/routes/chat.py`](backend/app/routes/chat.py) and could be swapped for a real vector index if the dataset grew.

**Local embeddings instead of a hosted embedding API.** `all-MiniLM-L6-v2` is small (80 MB), CPU-friendly, and produces 384-dim vectors that are competitive for retrieval at this scale. This keeps the project free to run.

**Gemini 1.5 Flash by default.** It has a generous free tier and is fast. The LLM service in [`app/services/llm.py`](backend/app/services/llm.py) abstracts over Gemini and Claude so the provider can be swapped via an env var.

**Sentence-aware chunking with overlap.** Chunks are formed by accumulating sentences until a token budget is reached, then a small tail of sentences is reused as the start of the next chunk. This preserves semantic boundaries better than naive fixed-size splitting.

## What I'd Add Next

- **Streaming responses** with Server-Sent Events so answers appear word-by-word.
- **Conversation memory** so follow-up questions like "explain that more simply" work without re-fetching context.
- **JWT-based authentication** so each user only sees their own documents.
- **A real vector index** (pgvector or sqlite-vec) once the document count grows past a few hundred.
- **An admin dashboard** showing usage analytics — questions per day, most-cited documents, average response latency.

## License

MIT.
