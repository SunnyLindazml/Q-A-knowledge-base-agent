import { NextResponse } from 'next/server';
import { ApiResponse } from './types';
import { ApiError } from './errors';

// 成功响应
export function successResponse<T>(
  data: T,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      timestamp: Date.now(),
    },
    { status }
  );
}

// 错误响应
export function errorResponse(
  error: ApiError | Error | string,
  status?: number
): NextResponse<ApiResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: Date.now(),
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : error;
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
      timestamp: Date.now(),
    },
    { status: status || 500 }
  );
}
