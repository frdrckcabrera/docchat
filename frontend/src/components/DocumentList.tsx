import type { Document } from '../types';

interface DocumentListProps {
  documents: Document[];
  selectedId: number | null;
  onSelect: (doc: Document) => void;
  onDelete: (id: number) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(contentType: string, filename: string) {
  const isPdf =
    contentType === 'application/pdf' ||
    filename.toLowerCase().endsWith('.pdf');
  return (
    <div
      className={`w-9 h-11 rounded-sm flex items-center justify-center text-[9px] font-mono font-semibold tracking-wider relative ${
        isPdf ? 'bg-amber-glow/10 text-amber-glow' : 'bg-ink-100 text-ink-600'
      }`}
    >
      <span className="absolute top-0 right-0 w-2 h-2 bg-cream border-l border-b border-current" />
      {isPdf ? 'PDF' : filename.toLowerCase().endsWith('.md') ? 'MD' : 'TXT'}
    </div>
  );
}

export function DocumentList({
  documents,
  selectedId,
  onSelect,
  onDelete,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-sm text-ink-400 italic px-1 py-3 font-mono">
        No documents yet.
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {documents.map((doc) => {
        const isSelected = doc.id === selectedId;
        return (
          <li key={doc.id}>
            <div
              className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-ink-900 text-cream'
                  : 'hover:bg-ink-100/60 text-ink-800'
              }`}
              onClick={() => onSelect(doc)}
            >
              {fileIcon(doc.content_type, doc.filename)}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isSelected ? 'text-cream' : 'text-ink-900'
                  }`}
                  title={doc.filename}
                >
                  {doc.filename}
                </p>
                <p
                  className={`text-xs font-mono mt-0.5 ${
                    isSelected ? 'text-cream/60' : 'text-ink-400'
                  }`}
                >
                  {doc.chunk_count} chunks &middot; {formatBytes(doc.size_bytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      `Delete "${doc.filename}"? This cannot be undone.`,
                    )
                  ) {
                    onDelete(doc.id);
                  }
                }}
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${
                  isSelected
                    ? 'hover:bg-cream/10 text-cream/60'
                    : 'hover:bg-red-50 text-ink-400 hover:text-red-600'
                }`}
                aria-label={`Delete ${doc.filename}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3"
                  />
                </svg>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
