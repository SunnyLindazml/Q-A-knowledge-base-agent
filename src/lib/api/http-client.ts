import { ApiError } from './errors';
import {
  ApiResponse,
  RequestConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from './types';

const DEFAULT_CONFIG: Required<RequestConfig> = {
  baseUrl: '',
  headers: {},
  timeout: 30000,
  retries: 0,
  retryDelay: 1000,
};

export class HttpClient {
  private config: Required<RequestConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config?: RequestConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async get<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  async post<T>(
    path: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(
    path: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = this.config.baseUrl
      ? `${this.config.baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
      : path;

    let requestConfig: RequestInit & { url: string } = {
      ...init,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...(init?.headers as Record<string, string>),
      },
    };

    // 执行请求拦截器
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig);
    }

    let lastError: Error | null = null;
    const maxAttempts = this.config.retries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (attempt > 0 && this.config.retryDelay > 0) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.retryDelay)
          );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.config.timeout
        );

        const { url: requestUrl, ...fetchInit } = requestConfig;
        let response: Response;

        try {
          response = await fetch(requestUrl, {
            ...fetchInit,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        // 执行响应拦截器
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response);
        }

        if (!response.ok) {
          const body = await response.text();
          let parsed: { code?: string; message?: string } | null = null;
          try {
            parsed = JSON.parse(body);
          } catch {
            // ignore parse error
          }
          throw new ApiError(
            response.status,
            parsed?.code || `HTTP_${response.status}`,
            parsed?.message || `HTTP error ${response.status}`,
            parsed
          );
        }

        return (await response.json()) as ApiResponse<T>;
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          lastError = new ApiError(
            408,
            'TIMEOUT',
            `Request timed out after ${this.config.timeout}ms`
          );
        } else if (error instanceof ApiError) {
          lastError = error;
        } else {
          lastError =
            error instanceof Error
              ? error
              : new Error(String(error));
        }

        // 不重试客户端错误 (4xx)
        if (lastError instanceof ApiError && lastError.statusCode < 500) {
          break;
        }
      }
    }

    if (lastError instanceof ApiError) {
      throw lastError;
    }
    throw new ApiError(
      500,
      'REQUEST_FAILED',
      lastError?.message || 'Request failed'
    );
  }
}

// 单例默认实例
export const httpClient = new HttpClient();
