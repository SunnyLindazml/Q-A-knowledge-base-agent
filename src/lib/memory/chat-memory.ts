import { InMemoryChatMessageHistory } from '@langchain/core/chat_history';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

/**
 * 简单的内存聊天记忆管理器
 * 基于 @langchain/core 的 InMemoryChatMessageHistory
 */
export class ChatMemory {
  private history: InMemoryChatMessageHistory;

  constructor() {
    this.history = new InMemoryChatMessageHistory();
  }

  /** 获取所有历史消息 */
  async getMessages(): Promise<BaseMessage[]> {
    return this.history.getMessages();
  }

  /** 添加用户消息 */
  async addUserMessage(content: string): Promise<void> {
    await this.history.addMessage(new HumanMessage(content));
  }

  /** 添加 AI 消息 */
  async addAIMessage(content: string): Promise<void> {
    await this.history.addMessage(new AIMessage(content));
  }

  /** 添加任意消息 */
  async addMessage(message: BaseMessage): Promise<void> {
    await this.history.addMessage(message);
  }

  /** 清空历史 */
  async clear(): Promise<void> {
    await this.history.clear();
  }
}

/** 便捷工厂函数 */
export function createChatMemory(): ChatMemory {
  return new ChatMemory();
}
