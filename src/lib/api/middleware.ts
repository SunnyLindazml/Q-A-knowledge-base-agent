import { NextRequest, NextResponse } from 'next/server';
import { ZodType } from 'zod';
import { errorResponse } from './response';
import { ApiError, ValidationError } from './errors';

// 中间件类型定义
export type ApiHandler = (
  req: NextRequest,
  context?: unknown
) => Promise<NextResponse> | NextResponse;

export type Middleware = (handler: ApiHandler) => ApiHandler;

// withErrorHandler — 统一捕获错误并返回标准格式
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: unknown) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return errorResponse(error);
      }
      if (error instanceof Error) {
        return errorResponse(error);
      }
      return errorResponse(String(error));
    }
  };
}

// withValidation — 请求体验证（使用 zod schema）
export function withValidation<T>(
  schema: ZodType<T>,
  handler: (req: NextRequest, body: T) => Promise<NextResponse>
): ApiHandler {
  return async (req: NextRequest) => {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON body');
    }

    const result = schema.safeParse(rawBody);
    if (!result.success) {
      throw new ValidationError('Request validation failed', result.error);
    }

    return handler(req, result.data as T);
  };
}

// withLogging — 请求日志
export function withLogging(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: unknown) => {
    const start = Date.now();
    const method = req.method;
    const url = req.url;

    console.log(`[API] ${method} ${url} - started`);

    const response = await handler(req, context);

    const duration = Date.now() - start;
    console.log(
      `[API] ${method} ${url} - ${response.status} (${duration}ms)`
    );

    return response;
  };
}

// withMiddleware — 组合多个中间件
export function withMiddleware(
  ...middlewares: Middleware[]
): (handler: ApiHandler) => ApiHandler {
  return (handler: ApiHandler) => {
    return middlewares.reduceRight(
      (next, middleware) => middleware(next),
      handler
    );
  };
}
