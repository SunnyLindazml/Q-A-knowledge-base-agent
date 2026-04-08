import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { ModelConfig, ModelProvider, getDefaultConfig } from './config';

export function createChatModel(config?: Partial<ModelConfig>): BaseChatModel {
  const finalConfig = { ...getDefaultConfig(), ...config };

  switch (finalConfig.provider) {
    case ModelProvider.OPENAI:
      return new ChatOpenAI({
        model: finalConfig.modelName,
        temperature: finalConfig.temperature,
        maxTokens: finalConfig.maxTokens,
        apiKey: finalConfig.apiKey || process.env.OPENAI_API_KEY,
        configuration: {
          baseURL:
            finalConfig.baseUrl || process.env.OPENAI_BASE_URL || undefined,
        },
      });

    case ModelProvider.ANTHROPIC:
      return new ChatAnthropic({
        model: finalConfig.modelName,
        temperature: finalConfig.temperature,
        maxTokens: finalConfig.maxTokens,
        apiKey: finalConfig.apiKey || process.env.ANTHROPIC_API_KEY,
      });

    case ModelProvider.OLLAMA:
      return new ChatOllama({
        model: finalConfig.modelName,
        temperature: finalConfig.temperature,
        baseUrl:
          finalConfig.baseUrl ||
          process.env.OLLAMA_BASE_URL ||
          'http://localhost:11434',
      });

    default:
      throw new Error(`Unsupported model provider: ${finalConfig.provider}`);
  }
}

// 获取所有可用的模型提供商及其默认模型列表（供前端选择器使用）
export function getAvailableProviders(): Array<{
  provider: ModelProvider;
  defaultModel: string;
  label: string;
}> {
  return [
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
}
