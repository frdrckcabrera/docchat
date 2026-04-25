import type {
  ChatRequest,
  ChatResponse,
  Document,
  UploadResponse,
} from '../types';

// In dev, Vite proxies /api to the backend.
// In prod, set VITE_API_BASE to your deployed backend URL.
const API_BASE = (import.meta.env.VITE_API_BASE as string) || '';

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data && typeof data.detail === 'string') {
        detail = data.detail;
      }
    } catch {
      // Body wasn't JSON; use default message.
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  async listDocuments(): Promise<Document[]> {
    const res = await fetch(`${API_BASE}/api/documents`);
    return handleResponse<Document[]>(res);
  },

  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<UploadResponse>(res);
  },

  async deleteDocument(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/documents/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<ChatResponse>(res);
  },
};

export { ApiError };
