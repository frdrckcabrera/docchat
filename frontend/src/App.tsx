import { useCallback, useEffect, useState } from 'react';

import { api, ApiError } from './api/client';
import { ChatWindow } from './components/ChatWindow';
import { DocumentList } from './components/DocumentList';
import { DocumentUpload } from './components/DocumentUpload';
import type { Document } from './types';

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      const docs = await api.listDocuments();
      setDocuments(docs);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError
          ? err.message
          : 'Could not connect to backend. Is it running?',
      );
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleUploaded = useCallback((doc: Document) => {
    setDocuments((prev) => [doc, ...prev]);
    setSelectedDoc(doc);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await api.deleteDocument(id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        if (selectedDoc?.id === id) {
          setSelectedDoc(null);
        }
      } catch (err) {
        alert(
          err instanceof ApiError ? err.message : 'Failed to delete document.',
        );
      }
    },
    [selectedDoc],
  );

  return (
    <div className="h-screen w-screen flex bg-cream grain overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-ink-100 bg-cream/60 backdrop-blur">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink-900 flex items-center justify-center">
              <span className="font-display text-amber-glow text-lg font-semibold leading-none">
                D
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl text-ink-900 leading-none">
                DocChat
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mt-0.5">
                AI Document Q&amp;A
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 mb-3">
          <DocumentUpload onUploaded={handleUploaded} />
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400 px-3 pt-2 pb-2">
            Documents ({documents.length})
          </p>
          {isInitialLoading ? (
            <div className="text-sm text-ink-400 italic px-3 py-3 font-mono">
              Loading...
            </div>
          ) : loadError ? (
            <div className="mx-1 p-3 rounded-lg bg-red-50 border border-red-100">
              <p className="text-xs text-red-700 font-mono leading-relaxed">
                {loadError}
              </p>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              selectedId={selectedDoc?.id ?? null}
              onSelect={setSelectedDoc}
              onDelete={handleDelete}
            />
          )}
        </div>

        <footer className="border-t border-ink-100 px-6 py-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono uppercase tracking-widest text-ink-400 hover:text-amber-glow transition-colors"
          >
            View source &rarr;
          </a>
        </footer>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 min-w-0">
        {/* `key` forces ChatWindow to remount when the doc changes,
            which resets its useChat hook state cleanly. */}
        <ChatWindow key={selectedDoc?.id ?? 'none'} document={selectedDoc} />
      </main>
    </div>
  );
}
