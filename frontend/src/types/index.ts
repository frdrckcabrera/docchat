// Types matching the backend API schemas in app/db/models.py

export interface Document {
  id: number;
  filename: string;
  content_type: string;
  size_bytes: number;
  chunk_count: number;
  created_at: string;
}

export interface UploadResponse {
  document: Document;
  message: string;
}

export interface Source {
  chunk_index: number;
  content: string;
  similarity: number;
}

export interface ChatRequest {
  document_id: number;
  message: string;
  conversation_id?: number;
}

export interface ChatResponse {
  conversation_id: number;
  answer: string;
  sources: Source[];
}

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at?: string;
  // True while waiting for the assistant response
  pending?: boolean;
  // True if the request errored
  error?: boolean;
}

export interface ApiError {
  detail: string;
}
