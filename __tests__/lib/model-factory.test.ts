import { describe, it, expect } from 'vitest';
import { createChatModel } from '@/lib/llm/model-factory';
import { ModelProvider } from '@/lib/llm/config';

describe('Model Factory', () => {
  it('should create an OpenAI model', () => {
    const model = createChatModel({
      provider: ModelProvider.OPENAI,
      modelName: 'gpt-4',
      apiKey: 'test-key',
    });
    expect(model).toBeDefined();
  });

  it('should create an Anthropic model', () => {
    const model = createChatModel({
      provider: ModelProvider.ANTHROPIC,
      modelName: 'claude-3-5-sonnet-latest',
      apiKey: 'test-key',
    });
    expect(model).toBeDefined();
  });

  it('should create an Ollama model', () => {
    const model = createChatModel({
      provider: ModelProvider.OLLAMA,
      modelName: 'llama3',
    });
    expect(model).toBeDefined();
  });

  it('should throw for unsupported provider', () => {
    expect(() =>
      createChatModel({ provider: 'unsupported' as ModelProvider })
    ).toThrow('Unsupported model provider');
  });
});
