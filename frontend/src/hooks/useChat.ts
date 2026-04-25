import { useCallback, useState } from 'react';

import { api, ApiError } from '../api/client';
import type { Message } from '../types';

interface UseChatResult {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  resetConversation: () => void;
}

/**
 * Hook that manages messages for a single document's conversation.
 *
 * The conversation is identified by `documentId`. Calling `sendMessage`
 * posts a question to the backend and appends both the user message
 * and the assistant response (with sources) to local state.
 */
export function useChat(documentId: number | null): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | undefined>(
    undefined,
  );
  const [isLoading, setIsLoading] = useState(false);

  const resetConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!documentId || !text.trim() || isLoading) return;

      const userMessage: Message = { role: 'user', content: text.trim() };
      const placeholder: Message = {
        role: 'assistant',
        content: '',
        pending: true,
      };
      setMessages((prev) => [...prev, userMessage, placeholder]);
      setIsLoading(true);

      try {
        const response = await api.chat({
          document_id: documentId,
          message: text.trim(),
          conversation_id: conversationId,
        });

        setConversationId(response.conversation_id);
        setMessages((prev) => {
          const next = [...prev];
          // Replace the trailing placeholder with the real response.
          next[next.length - 1] = {
            role: 'assistant',
            content: response.answer,
            sources: response.sources,
          };
          return next;
        });
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.';
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: detail,
            error: true,
          };
          return next;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [documentId, conversationId, isLoading],
  );

  return { messages, isLoading, sendMessage, resetConversation };
}
