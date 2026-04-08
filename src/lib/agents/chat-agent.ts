import { StructuredToolInterface } from '@langchain/core/tools';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { createChatModel } from '@/lib/llm/model-factory';
import { ModelConfig } from '@/lib/llm/config';
import { defaultTools } from '@/lib/tools';
import { BaseAgent, BaseAgentConfig } from './base-agent';

export interface ChatAgentOptions {
  /** 自定义模型配置（可选，默认使用 getDefaultConfig） */
  modelConfig?: Partial<ModelConfig>;
  /** 自定义模型实例（可选，优先于 modelConfig） */
  model?: BaseChatModel;
  /** 额外工具（会与默认工具合并） */
  extraTools?: StructuredToolInterface[];
  /** 是否包含默认工具集（默认 true） */
  includeDefaultTools?: boolean;
  /** 系统提示词 */
  systemPrompt?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  '你是一个有用的 AI 助手。你可以使用工具来帮助用户解决问题。请用中文回答。';

/**
 * 聊天智能体 — 开箱即用的对话 Agent
 *
 * 自动使用 model-factory 创建模型，并注入默认工具集。
 */
export class ChatAgent extends BaseAgent {
  private constructor(config: BaseAgentConfig) {
    super(config);
  }

  /** 创建聊天智能体 */
  static create(options: ChatAgentOptions = {}): ChatAgent {
    const {
      modelConfig,
      model,
      extraTools = [],
      includeDefaultTools = true,
      systemPrompt = DEFAULT_SYSTEM_PROMPT,
    } = options;

    const llm = model ?? createChatModel(modelConfig);

    const tools: StructuredToolInterface[] = [
      ...(includeDefaultTools ? defaultTools : []),
      ...extraTools,
    ];

    return new ChatAgent({
      model: llm,
      tools,
      systemPrompt,
      name: 'chat-agent',
    });
  }
}

export { createChatModel };
