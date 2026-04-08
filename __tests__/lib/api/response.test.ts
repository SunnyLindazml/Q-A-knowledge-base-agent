import { describe, it, expect, vi, beforeEach } from 'vitest';
import { successResponse, errorResponse } from '@/lib/api/response';
import { ApiError, ValidationError } from '@/lib/api/errors';

// Mock NextResponse.json
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
      // Simulate NextResponse for testing
      json: async () => body,
    }),
  },
}));

describe('successResponse', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
  });

  it('should return a success response with data', () => {
    const result = successResponse({ name: 'test' }) as any;
    expect(result.body).toEqual({
      success: true,
      data: { name: 'test' },
      timestamp: 1000,
    });
    expect(result.status).toBe(200);
  });

  it('should accept custom status code', () => {
    const result = successResponse('created', 201) as any;
    expect(result.body).toEqual({
      success: true,
      data: 'created',
      timestamp: 1000,
    });
    expect(result.status).toBe(201);
  });
});

describe('errorResponse', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(2000);
  });

  it('should handle ApiError', () => {
    const apiError = new ApiError(422, 'CUSTOM_ERR', 'custom msg', {
      field: 'x',
    });
    const result = errorResponse(apiError) as any;
    expect(result.body).toEqual({
      success: false,
      error: {
        code: 'CUSTOM_ERR',
        message: 'custom msg',
        details: { field: 'x' },
      },
      timestamp: 2000,
    });
    expect(result.status).toBe(422);
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('bad input');
    const result = errorResponse(error) as any;
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle generic Error', () => {
    const error = new Error('something broke');
    const result = errorResponse(error) as any;
    expect(result.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'something broke',
      },
      timestamp: 2000,
    });
    expect(result.status).toBe(500);
  });

  it('should handle string error', () => {
    const result = errorResponse('oops') as any;
    expect(result.body.error.message).toBe('oops');
    expect(result.status).toBe(500);
  });

  it('should accept custom status for non-ApiError', () => {
    const result = errorResponse(new Error('bad'), 503) as any;
    expect(result.status).toBe(503);
  });
});
