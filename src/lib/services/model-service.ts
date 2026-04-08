import { ModelProvider } from '@/lib/llm/config';
import type { ApiResponse } from '@/lib/api';

export interface ProviderInfo {
  provider: ModelProvider;
  defaultModel: string;
  label: string;
}

/**
 * 获取可用的模型提供商列表
 */
export async function getAvailableModels(): Promise<ProviderInfo[]> {
  const response = await fetch('/api/models');

  if (!response.ok) {
    throw new Error(`Failed to fetch models: HTTP ${response.status}`);
  }

  const json: ApiResponse<ProviderInfo[]> = await response.json();

  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? 'Failed to fetch models');
  }

  return json.data;
}
