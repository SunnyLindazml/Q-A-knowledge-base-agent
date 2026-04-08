import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withErrorHandler,
  withValidation,
  withLogging,
  withMiddleware,
} from '@/lib/api/middleware';
import { ApiError, NotFoundError, ValidationError } from '@/lib/api/errors';

// Mock next/server
vi.mock('next/server', async () => {
  class MockNextRequest {
    method: string;
    url: string;
    private _body: string | null;

    constructor(url: string, init?: { method?: string; body?: string }) {
      this.method = init?.method || 'GET';
      this.url = url;
      this._body = init?.body || null;
    }

    async json() {
      if (!this._body) throw new Error('No body');
      return JSON.parse(this._body);
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
        json: async () => body,
      }),
    },
  };
});

function createRequest(
  url: string,
  init?: { method?: string; body?: unknown }
): NextRequest {
  return new NextRequest(url, {
    method: init?.method || 'GET',
    body: init?.body ? JSON.stringify(init.body) : undefined,
  }) as unknown as NextRequest;
}

async function createJsonResponse(data: unknown, status = 200) {
  const mod = await import('next/server');
  return mod.NextResponse.json(data, { status }) as any;
}

describe('withErrorHandler', () => {
  it('should pass through successful responses', async () => {
    const handler = vi.fn().mockResolvedValue(
      (await import('next/server')).NextResponse.json({ ok: true })
    );

    const wrapped = withErrorHandler(handler);
    const req = createRequest('http://test.com/api');
    const result = (await wrapped(req)) as any;

    expect(result.body).toEqual({ ok: true });
  });

  it('should catch ApiError and return formatted response', async () => {
    const handler = vi.fn().mockRejectedValue(
      new NotFoundError('item not found')
    );

    const wrapped = withErrorHandler(handler);
    const req = createRequest('http://test.com/api');
    const result = (await wrapped(req)) as any;

    expect(result.status).toBe(404);
    expect(result.body.success).toBe(false);
    expect(result.body.error.code).toBe('NOT_FOUND');
  });

  it('should catch generic Error', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('unexpected'));

    const wrapped = withErrorHandler(handler);
    const req = createRequest('http://test.com/api');
    const result = (await wrapped(req)) as any;

    expect(result.status).toBe(500);
    expect(result.body.success).toBe(false);
    expect(result.body.error.message).toBe('unexpected');
  });

  it('should catch string errors', async () => {
    const handler = vi.fn().mockRejectedValue('string error');

    const wrapped = withErrorHandler(handler);
    const req = createRequest('http://test.com/api');
    const result = (await wrapped(req)) as any;

    expect(result.status).toBe(500);
    expect(result.body.error.message).toBe('string error');
  });
});

describe('withValidation', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number().min(0),
  });

  it('should pass validated body to handler', async () => {
    const handler = vi.fn().mockImplementation(async (_req, body) => {
      const { NextResponse } = await import('next/server');
      return NextResponse.json({ received: body });
    });

    const wrapped = withErrorHandler(withValidation(schema, handler));
    const req = createRequest('http://test.com/api', {
      method: 'POST',
      body: { name: 'John', age: 25 },
    });

    const result = (await wrapped(req)) as any;
    expect(result.body.received).toEqual({ name: 'John', age: 25 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return validation error for invalid body', async () => {
    const handler = vi.fn();

    const wrapped = withErrorHandler(withValidation(schema, handler));
    const req = createRequest('http://test.com/api', {
      method: 'POST',
      body: { name: 123 },
    });

    const result = (await wrapped(req)) as any;
    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should return validation error for invalid JSON', async () => {
    const handler = vi.fn();

    // Create a request that will fail on json()
    const req = {
      method: 'POST',
      url: 'http://test.com/api',
      json: () => Promise.reject(new Error('Invalid JSON')),
    } as unknown as NextRequest;

    const wrapped = withErrorHandler(withValidation(schema, handler));
    const result = (await wrapped(req)) as any;

    expect(result.status).toBe(400);
    expect(result.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('withLogging', () => {
  it('should log request start and end', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const handler = vi.fn().mockResolvedValue({
      status: 200,
      body: { ok: true },
    });

    const wrapped = withLogging(handler);
    const req = createRequest('http://test.com/api/test');
    await wrapped(req);

    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy.mock.calls[0][0]).toContain('[API]');
    expect(consoleSpy.mock.calls[0][0]).toContain('started');
    expect(consoleSpy.mock.calls[1][0]).toContain('200');

    consoleSpy.mockRestore();
  });
});

describe('withMiddleware', () => {
  it('should compose middlewares in correct order', async () => {
    const order: string[] = [];

    const middleware1 = (handler: any) => async (req: any) => {
      order.push('m1-before');
      const res = await handler(req);
      order.push('m1-after');
      return res;
    };

    const middleware2 = (handler: any) => async (req: any) => {
      order.push('m2-before');
      const res = await handler(req);
      order.push('m2-after');
      return res;
    };

    const handler = vi.fn().mockImplementation(async () => {
      order.push('handler');
      return { status: 200 };
    });

    const composed = withMiddleware(middleware1, middleware2)(handler);
    const req = createRequest('http://test.com/api');
    await composed(req);

    expect(order).toEqual([
      'm1-before',
      'm2-before',
      'handler',
      'm2-after',
      'm1-after',
    ]);
  });

  it('should work with empty middleware list', async () => {
    const handler = vi.fn().mockResolvedValue({ status: 200 });
    const composed = withMiddleware()(handler);
    const req = createRequest('http://test.com/api');
    await composed(req);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
