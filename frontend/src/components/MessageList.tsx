import { useEffect, useRef, useState } from 'react';

import type { Message, Source } from '../types';

interface MessageListProps {
  messages: Message[];
}

function SourceItem({ source }: { source: Source }) {
  const [expanded, setExpanded] = useState(false);
  const preview =
    source.content.length > 140
      ? `${source.content.slice(0, 140).trim()}...`
      : source.content;

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="text-left w-full bg-cream border border-ink-100 hover:border-ink-200 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
          Chunk #{source.chunk_index} &middot; {(source.similarity * 100).toFixed(1)}%
          match
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3 h-3 text-ink-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <p className="text-xs text-ink-700 leading-relaxed whitespace-pre-wrap">
        {expanded ? source.content : preview}
      </p>
    </button>
  );
}

function PendingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-pulse" />
      <span
        className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-pulse"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-1.5 h-1.5 rounded-full bg-ink-300 animate-pulse"
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] bg-ink-900 text-cream rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="max-w-[85%] flex gap-3">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-glow/15 text-amber-glow flex items-center justify-center font-display text-sm font-semibold mt-0.5">
          D
        </div>
        <div className="flex-1 min-w-0">
          {message.pending ? (
            <PendingDots />
          ) : message.error ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <p className="text-sm text-red-700 leading-relaxed">
                {message.content}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white border border-ink-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                <p className="text-sm text-ink-900 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-1.5 px-1">
                    Sources &middot; click to expand
                  </p>
                  <div className="space-y-1.5">
                    {message.sources.map((source, idx) => (
                      <SourceItem key={idx} source={source} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom whenever a new message is added.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-glow/10 text-amber-glow mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="font-display text-xl text-ink-900 mb-2">
            Ask anything about your document
          </p>
          <p className="text-sm text-ink-500 leading-relaxed">
            Questions are answered using only the content of the selected
            document. Citations show which passages were used.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-6">
      {messages.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
