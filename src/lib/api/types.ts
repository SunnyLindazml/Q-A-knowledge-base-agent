// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: number;
}

// HTTP 请求配置
export interface RequestConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// 请求拦截器
export type RequestInterceptor = (
  config: RequestInit & { url: string }
) => Promise<RequestInit & { url: string }> | (RequestInit & { url: string });

// 响应拦截器
export type ResponseInterceptor = (
  response: Response
) => Promise<Response> | Response;
