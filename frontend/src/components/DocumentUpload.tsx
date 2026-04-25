import { useCallback, useRef, useState } from 'react';

import { api, ApiError } from '../api/client';
import type { Document } from '../types';

interface DocumentUploadProps {
  onUploaded: (doc: Document) => void;
}

const ACCEPTED_TYPES = '.pdf,.txt,.md,.markdown';
const MAX_SIZE_MB = 10;

export function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`File too large. Max ${MAX_SIZE_MB} MB.`);
        return;
      }

      setIsUploading(true);
      try {
        const result = await api.uploadDocument(file);
        onUploaded(result.document);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Upload failed.',
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onUploaded],
  );

  const handleFile = (file: File | null | undefined) => {
    if (file) void upload(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`relative border border-dashed rounded-2xl p-6 transition-all ${
        isDragging
          ? 'border-amber-glow bg-amber-glow/5'
          : 'border-ink-200 hover:border-ink-300 bg-white/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex flex-col items-center text-center gap-2">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isUploading
              ? 'bg-amber-glow/10 text-amber-glow'
              : 'bg-ink-50 text-ink-500'
          }`}
        >
          {isUploading ? (
            <svg
              className="animate-spin w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
              />
            </svg>
          )}
        </div>

        <div>
          <p className="text-sm text-ink-700">
            {isUploading ? (
              'Processing document...'
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-amber-glow hover:underline underline-offset-2"
                  disabled={isUploading}
                >
                  Click to upload
                </button>
                <span className="text-ink-500"> or drag &amp; drop</span>
              </>
            )}
          </p>
          <p className="text-xs text-ink-400 mt-1 font-mono">
            PDF, TXT, or MD &middot; up to {MAX_SIZE_MB} MB
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-600 mt-1 font-mono">{error}</p>
        )}
      </div>
    </div>
  );
}
