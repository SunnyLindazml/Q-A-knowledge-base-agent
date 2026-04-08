'use client';

import { useChat } from '@/hooks/use-chat';
import { ModelSelector } from '@/components/ui/model-selector';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';

export function ChatContainer() {
  const {
    messages,
    isLoading,
    provider,
    modelName,
    setProvider,
    setModelName,
    sendMessage,
    stopGeneration,
    clearMessages,
  } = useChat();

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <ModelSelector
          selectedProvider={provider}
          selectedModel={modelName}
          onProviderChange={setProvider}
          onModelChange={setModelName}
        />
        {messages.length > 0 && (
          <button
            onClick={clearMessages}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-800"
          >
            清空对话
          </button>
        )}
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput
        onSend={sendMessage}
        isLoading={isLoading}
        onStop={stopGeneration}
      />
    </div>
  );
}
