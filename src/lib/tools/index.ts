import { StructuredToolInterface } from '@langchain/core/tools';
import { calculatorTool } from './calculator';
import { webSearchTool } from './web-search';

// 默认工具集
export const defaultTools: StructuredToolInterface[] = [
  calculatorTool,
  webSearchTool,
];

export { calculatorTool, webSearchTool };
