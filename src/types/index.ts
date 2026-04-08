import { ModelProvider } from '@/lib/llm/config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  modelConfig?: {
    provider: ModelProvider;
    modelName: string;
    temperature?: number;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  error?: string;
}
