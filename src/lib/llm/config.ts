// 支持的模型提供商
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
}

// 模型配置接口
export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

// 各提供商的默认模型
export const DEFAULT_MODELS: Record<ModelProvider, string> = {
  [ModelProvider.OPENAI]: 'gpt-4',
  [ModelProvider.ANTHROPIC]: 'claude-3-5-sonnet-latest',
  [ModelProvider.OLLAMA]: 'llama3',
};

// 从环境变量获取默认配置
export function getDefaultConfig(): ModelConfig {
  const provider =
    (process.env.DEFAULT_MODEL_PROVIDER as ModelProvider) ||
    ModelProvider.OPENAI;
  return {
    provider,
    modelName: process.env.DEFAULT_MODEL_NAME || DEFAULT_MODELS[provider],
    temperature: 0.7,
    maxTokens: 4096,
  };
}
