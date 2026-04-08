import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { StructuredToolInterface } from '@langchain/core/tools';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage } from '@langchain/core/messages';

export interface BaseAgentConfig {
  /** LLM 模型实例 */
  model: BaseChatModel;
  /** 工具列表 */
  tools?: StructuredToolInterface[];
  /** 系统提示词 */
  systemPrompt?: string;
  /** 智能体名称 */
  name?: string;
}

export interface AgentResponse {
  /** 最终输出内容 */
  output: string;
  /** 完整消息历史 */
  messages: BaseMessage[];
}

/**
 * 智能体基类 — 封装 LangGraph 的 createReactAgent
 *
 * 提供 invoke / stream 两种调用方式，
 * 底层使用 LangGraph prebuilt ReAct agent。
 */
export class BaseAgent {
  protected agent: ReturnType<typeof createReactAgent>;
  protected config: BaseAgentConfig;

  constructor(config: BaseAgentConfig) {
    this.config = config;
    this.agent = createReactAgent({
      llm: config.model,
      tools: config.tools ?? [],
      prompt: config.systemPrompt,
      name: config.name,
    });
  }

  /** 同步调用，返回智能体完整响应 */
  async invoke(input: string): Promise<AgentResponse> {
    const result = await this.agent.invoke({
      messages: [{ role: 'user', content: input }],
    });

    const messages: BaseMessage[] = result.messages;
    const lastMessage = messages[messages.length - 1];
    const output =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return { output, messages };
  }

  /** 流式调用，逐步返回消息 */
  async *stream(
    input: string
  ): AsyncGenerator<{ messages: BaseMessage[] }, void, unknown> {
    const stream = await this.agent.stream(
      { messages: [{ role: 'user', content: input }] },
      { streamMode: 'values' }
    );

    for await (const chunk of stream) {
      yield { messages: chunk.messages };
    }
  }

  /** 获取当前工具列表名称 */
  getToolNames(): string[] {
    return (this.config.tools ?? []).map((t) => t.name);
  }
}
