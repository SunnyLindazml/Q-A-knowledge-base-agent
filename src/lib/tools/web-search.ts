import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const webSearchTool = tool(
  async ({ query }) => {
    // 占位实现 — 实际使用时替换为真实搜索 API（如 Tavily、SerpAPI 等）
    return `[搜索占位] 未找到关于 "${query}" 的搜索结果。请配置搜索 API 后使用。`;
  },
  {
    name: 'web_search',
    description: '搜索互联网获取最新信息。输入搜索关键词。',
    schema: z.object({
      query: z.string().describe('搜索关键词'),
    }),
  }
);
