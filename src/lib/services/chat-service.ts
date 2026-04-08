import { ChatMessage, ChatRequest } from '@/types';

export interface StreamChatCallbacks {
  onMessage: (data: { role: string; content: string; messageType?: string }) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

/**
 * 发送聊天消息（非流式），返回完整响应
 */
export async function sendMessage(
  request: ChatRequest,
  signal?: AbortSignal
): Promise<ChatMessage> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg =
      errorData?.error?.message ?? errorData?.error ?? `HTTP ${response.status}`;
    throw new Error(msg);
  }

  // 对于流式端点，读取全部内容拼接
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let lastContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') break;

      try {
        const data = JSON.parse(dataStr);
        if (data.error) throw new Error(data.error);
        if (data.role === 'assistant') {
          lastContent = data.content;
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    role: 'assistant',
    content: lastContent,
    timestamp: Date.now(),
  };
}

/**
 * 流式聊天 — 通过回调逐步返回消息
 */
export async function streamChat(
  request: ChatRequest,
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg =
      errorData?.error?.message ?? errorData?.error ?? `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') {
          callbacks.onDone?.();
          return;
        }

        try {
          const data = JSON.parse(dataStr);
          if (data.error) {
            callbacks.onError?.(new Error(data.error));
            return;
          }
          callbacks.onMessage(data);
        } catch (e) {
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
    callbacks.onDone?.();
  } catch (error) {
    if ((error as Error).name === 'AbortError') return;
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
