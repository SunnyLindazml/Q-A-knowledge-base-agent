'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '@/types';
import { ModelProvider } from '@/lib/llm/config';
import { streamChat } from '@/lib/services/chat-service';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>(ModelProvider.OPENAI);
  const [modelName, setModelName] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await streamChat(
          {
            message: content.trim(),
            modelConfig: { provider, modelName, temperature },
          },
          {
            onMessage(data) {
              if (data.role === 'assistant') {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: data.content }
                      : msg
                  )
                );
              }
            },
            onError(error) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantId
                    ? { ...msg, content: `Error: ${error.message}` }
                    : msg
                )
              );
            },
          },
          abortController.signal
        );

        // If no content received, remove empty assistant message
        setMessages((prev) => {
          const last = prev.find((m) => m.id === assistantId);
          if (last && !last.content) {
            return prev.filter((m) => m.id !== assistantId);
          }
          return prev;
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;

        const errorContent =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: `Error: ${errorContent}` }
              : msg
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, provider, modelName, temperature]
  );

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    provider,
    modelName,
    temperature,
    setProvider,
    setModelName,
    setTemperature,
    sendMessage,
    stopGeneration,
    clearMessages,
  };
}
