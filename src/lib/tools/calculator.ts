import { tool } from '@langchain/core/tools';
import { z } from 'zod';

export const calculatorTool = tool(
  async ({ expression }) => {
    try {
      // 简单安全的数学表达式求值
      const result = Function('"use strict"; return (' + expression + ')')();
      return String(result);
    } catch {
      return 'Error: Invalid mathematical expression';
    }
  },
  {
    name: 'calculator',
    description:
      '用于计算数学表达式。输入一个数学表达式字符串，返回计算结果。',
    schema: z.object({
      expression: z.string().describe('数学表达式，如 "2 + 3 * 4"'),
    }),
  }
);
