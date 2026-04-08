'use client';

import { ModelProvider } from '@/lib/llm/config';

const PROVIDERS = [
  { provider: ModelProvider.OPENAI, defaultModel: 'gpt-4', label: 'OpenAI' },
  {
    provider: ModelProvider.ANTHROPIC,
    defaultModel: 'claude-3-5-sonnet-latest',
    label: 'Anthropic',
  },
  {
    provider: ModelProvider.OLLAMA,
    defaultModel: 'llama3',
    label: 'Ollama (本地)',
  },
];

interface ModelSelectorProps {
  selectedProvider: ModelProvider;
  selectedModel: string;
  onProviderChange: (provider: ModelProvider) => void;
  onModelChange: (model: string) => void;
}

export function ModelSelector({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
}: ModelSelectorProps) {
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ModelProvider;
    onProviderChange(newProvider);
    const match = PROVIDERS.find((p) => p.provider === newProvider);
    if (match) {
      onModelChange(match.defaultModel);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <label className="text-sm text-zinc-400 shrink-0">模型:</label>
      <select
        value={selectedProvider}
        onChange={handleProviderChange}
        className="bg-zinc-800 text-zinc-200 text-sm rounded-lg border border-zinc-700 px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors"
        aria-label="选择模型提供商"
      >
        {PROVIDERS.map((p) => (
          <option key={p.provider} value={p.provider}>
            {p.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="bg-zinc-800 text-zinc-200 text-sm rounded-lg border border-zinc-700 px-3 py-1.5 outline-none focus:border-indigo-500 transition-colors w-48"
        placeholder="模型名称"
        aria-label="模型名称"
      />
    </div>
  );
}
