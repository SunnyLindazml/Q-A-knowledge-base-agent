'use client';

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

/** Simple markdown-like rendering: bold, italic, inline code, code blocks */
function renderContent(content: string): string {
  let html = content
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```...```
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="bg-zinc-900 rounded-lg p-3 my-2 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`;
  });

  // Inline code `...`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-zinc-700 px-1.5 py-0.5 rounded text-sm">$1</code>'
  );

  // Bold **...**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *...*
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Line breaks
  html = html.replace(/\n/g, '<br/>');

  return html;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-lg">开始一段新的对话</p>
          <p className="text-sm mt-1 text-zinc-600">
            输入消息与 AI 助手交流
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-200'
            }`}
          >
            {msg.role === 'assistant' && !msg.content && isLoading ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            ) : (
              <div
                className="prose-invert break-words"
                dangerouslySetInnerHTML={{
                  __html: renderContent(msg.content),
                }}
              />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
