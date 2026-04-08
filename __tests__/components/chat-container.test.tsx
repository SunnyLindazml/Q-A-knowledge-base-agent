import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatContainer } from '@/components/chat/chat-container';

// Mock the useChat hook
vi.mock('@/hooks/use-chat', () => ({
  useChat: () => ({
    messages: [],
    isLoading: false,
    provider: 'openai',
    modelName: 'gpt-4',
    temperature: 0.7,
    setProvider: vi.fn(),
    setModelName: vi.fn(),
    setTemperature: vi.fn(),
    sendMessage: vi.fn(),
    stopGeneration: vi.fn(),
    clearMessages: vi.fn(),
  }),
}));

describe('ChatContainer', () => {
  it('renders without crashing', () => {
    render(<ChatContainer />);
    expect(screen.getByLabelText('消息输入框')).toBeInTheDocument();
  });

  it('contains send button', () => {
    render(<ChatContainer />);
    expect(screen.getByLabelText('发送消息')).toBeInTheDocument();
  });

  it('contains model selector', () => {
    render(<ChatContainer />);
    expect(screen.getByLabelText('选择模型提供商')).toBeInTheDocument();
  });

  it('contains model name input', () => {
    render(<ChatContainer />);
    expect(screen.getByLabelText('模型名称')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<ChatContainer />);
    expect(screen.getByText('开始一段新的对话')).toBeInTheDocument();
  });
});
