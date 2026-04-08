'use client';

import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  onStop?: () => void;
}

export function MessageInput({ onSend, isLoading, onStop }: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className="border-t border-zinc-800 px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          disabled={isLoading}
          rows={1}
          className="flex-1 bg-zinc-800 text-zinc-200 text-sm rounded-xl border border-zinc-700 px-4 py-3 outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-zinc-500 disabled:opacity-50"
          aria-label="消息输入框"
        />
        {isLoading ? (
          <button
            onClick={onStop}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl px-5 py-3 transition-colors"
            aria-label="停止生成"
          >
            停止
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-xl px-5 py-3 transition-colors"
            aria-label="发送消息"
          >
            发送
          </button>
        )}
      </div>
    </div>
  );
}
