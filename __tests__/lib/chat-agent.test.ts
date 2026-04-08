import { describe, it, expect, vi } from 'vitest';
import { calculatorTool, webSearchTool, defaultTools } from '@/lib/tools';
import { ChatAgent } from '@/lib/agents/chat-agent';
import { BaseAgent } from '@/lib/agents/base-agent';
import { ChatMemory, createChatMemory } from '@/lib/memory/chat-memory';

// Mock createChatModel 以避免需要真实 API 密钥（顶层声明）
vi.mock('@/lib/llm/model-factory', () => ({
  createChatModel: vi.fn(() => ({
    invoke: vi.fn(),
    stream: vi.fn(),
    batch: vi.fn(),
    bindTools: vi.fn().mockReturnThis(),
    bind: vi.fn().mockReturnThis(),
    pipe: vi.fn().mockReturnThis(),
    getGraph: vi.fn(),
    withConfig: vi.fn().mockReturnThis(),
    lc_namespace: ['langchain', 'chat_models'],
  })),
}));

// ─── 计算器工具测试 ──────────────────────────────────────
describe('calculatorTool', () => {
  it('应该正确计算简单加法', async () => {
    const result = await calculatorTool.invoke({ expression: '2 + 3' });
    expect(result).toBe('5');
  });

  it('应该正确计算包含乘法的表达式', async () => {
    const result = await calculatorTool.invoke({ expression: '2 + 3 * 4' });
    expect(result).toBe('14');
  });

  it('应该正确计算浮点数', async () => {
    const result = await calculatorTool.invoke({ expression: '10 / 3' });
    expect(Number(result)).toBeCloseTo(3.333, 2);
  });

  it('对无效表达式应返回错误信息', async () => {
    const result = await calculatorTool.invoke({ expression: 'invalid' });
    expect(result).toContain('Error');
  });
});

// ─── Web 搜索工具测试 ────────────────────────────────────
describe('webSearchTool', () => {
  it('应该返回占位搜索结果', async () => {
    const result = await webSearchTool.invoke({ query: 'LangChain' });
    expect(result).toContain('搜索占位');
    expect(result).toContain('LangChain');
  });
});

// ─── 默认工具集测试 ──────────────────────────────────────
describe('defaultTools', () => {
  it('应该包含 calculator 和 web_search', () => {
    const names = defaultTools.map((t) => t.name);
    expect(names).toContain('calculator');
    expect(names).toContain('web_search');
  });

  it('应该有 2 个默认工具', () => {
    expect(defaultTools).toHaveLength(2);
  });
});

// ─── 记忆模块测试 ────────────────────────────────────────
describe('ChatMemory', () => {
  it('createChatMemory 应该返回 ChatMemory 实例', () => {
    const memory = createChatMemory();
    expect(memory).toBeInstanceOf(ChatMemory);
  });

  it('应该能添加和获取消息', async () => {
    const memory = createChatMemory();
    await memory.addUserMessage('你好');
    await memory.addAIMessage('你好！有什么可以帮你的吗？');

    const messages = await memory.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('你好');
    expect(messages[1].content).toBe('你好！有什么可以帮你的吗？');
  });

  it('clear 应该清空所有消息', async () => {
    const memory = createChatMemory();
    await memory.addUserMessage('测试');
    await memory.clear();

    const messages = await memory.getMessages();
    expect(messages).toHaveLength(0);
  });
});

// ─── 智能体创建测试 ──────────────────────────────────────
describe('ChatAgent', () => {
  it('ChatAgent.create() 应该不抛出异常', () => {
    expect(() => {
      ChatAgent.create();
    }).not.toThrow();
  });

  it('创建的智能体应该包含默认工具', () => {
    const agent = ChatAgent.create();
    const toolNames = agent.getToolNames();
    expect(toolNames).toContain('calculator');
    expect(toolNames).toContain('web_search');
  });

  it('可以禁用默认工具', () => {
    const agent = ChatAgent.create({ includeDefaultTools: false });
    const toolNames = agent.getToolNames();
    expect(toolNames).toHaveLength(0);
  });

  it('BaseAgent 应该是 ChatAgent 的父类', () => {
    const agent = ChatAgent.create();
    expect(agent).toBeInstanceOf(BaseAgent);
  });
});
