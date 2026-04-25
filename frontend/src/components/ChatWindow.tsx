import { useState, type KeyboardEvent } from 'react';

import { useChat } from '../hooks/useChat';
import type { Document } from '../types';
import { MessageList } from './MessageList';

interface ChatWindowProps {
  document: Document | null;
}

export function ChatWindow({ document }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const { messages, isLoading, sendMessage, resetConversation } = useChat(
    document?.id ?? null,
  );

  // Reset conversation when the selected document changes.
  // (Wrapped in a memo-like guard via key on this component in App.tsx.)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <p className="font-display text-3xl text-ink-900 leading-tight mb-3">
            Pick a document to begin
          </p>
          <p className="text-sm text-ink-500 leading-relaxed">
            Upload a PDF or text file in the sidebar, then select it to start
            asking questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-ink-100 px-6 py-4 flex items-center justify-between bg-cream/80 backdrop-blur">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-0.5">
            Discussing
          </p>
          <h2 className="font-display text-lg text-ink-900 truncate">
            {document.filename}
          </h2>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Start a new conversation?')) {
                resetConversation();
              }
            }}
            className="text-xs font-mono uppercase tracking-wider text-ink-500 hover:text-amber-glow transition-colors"
          >
            New chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      <div className="flex-shrink-0 border-t border-ink-100 p-4 bg-cream">
        <div className="relative bg-white border border-ink-200 rounded-2xl shadow-sm focus-within:border-ink-400 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this document..."
            rows={1}
            disabled={isLoading}
            className="w-full bg-transparent resize-none px-4 py-3 pr-14 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:opacity-50 max-h-32"
            style={{
              minHeight: '48px',
              height: 'auto',
            }}
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 w-9 h-9 rounded-xl bg-ink-900 text-cream flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-glow transition-colors"
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mt-2 px-1">
          Press Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
