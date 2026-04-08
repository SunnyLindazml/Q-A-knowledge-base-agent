import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '@/lib/api/http-client';
import { ApiError } from '@/lib/api/errors';

// Helper to create a mock Response
function mockResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
}

describe('HttpClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('should make a GET request', async () => {
      const responseData = { success: true, data: { id: 1 }, timestamp: 1000 };
      fetchSpy.mockResolvedValue(mockResponse(responseData));

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      const result = await client.get('/users/1');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.test.com/users/1');
      expect(init.method).toBe('GET');
      expect(result).toEqual(responseData);
    });

    it('should handle path with leading slash', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );

      const client = new HttpClient({ baseUrl: 'https://api.test.com/' });
      await client.get('/items');

      const [url] = fetchSpy.mock.calls[0];
      expect(url).toBe('https://api.test.com/items');
    });
  });

  describe('POST requests', () => {
    it('should make a POST request with body', async () => {
      const responseData = {
        success: true,
        data: { id: 2, name: 'test' },
        timestamp: 1,
      };
      fetchSpy.mockResolvedValue(mockResponse(responseData));

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      const result = await client.post('/users', { name: 'test' });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [, init] = fetchSpy.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ name: 'test' }));
      expect(result).toEqual(responseData);
    });
  });

  describe('Error handling', () => {
    it('should throw ApiError for non-ok responses', async () => {
      fetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({ code: 'NOT_FOUND', message: 'User not found' }),
          { status: 404 }
        )
      );

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });

      try {
        await client.get('/users/999');
        expect.unreachable('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).statusCode).toBe(404);
        expect((e as ApiError).code).toBe('NOT_FOUND');
      }
    });

    it('should handle non-JSON error responses', async () => {
      fetchSpy.mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      );

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      await expect(client.get('/fail')).rejects.toThrow(ApiError);
    });
  });

  describe('Timeout', () => {
    it('should timeout after configured duration', async () => {
      fetchSpy.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            const signal = init.signal as AbortSignal;
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(new DOMException('The operation was aborted.', 'AbortError'));
              });
            }
          })
      );

      const client = new HttpClient({
        baseUrl: 'https://api.test.com',
        timeout: 50,
      });

      await expect(client.get('/slow')).rejects.toThrow(ApiError);

      try {
        await client.get('/slow');
      } catch (e) {
        expect((e as ApiError).code).toBe('TIMEOUT');
        expect((e as ApiError).statusCode).toBe(408);
      }
    });
  });

  describe('Retry logic', () => {
    it('should retry on server errors', async () => {
      fetchSpy
        .mockResolvedValueOnce(new Response('error', { status: 500 }))
        .mockResolvedValueOnce(new Response('error', { status: 500 }))
        .mockResolvedValueOnce(
          mockResponse({ success: true, data: 'ok', timestamp: 1 })
        );

      const client = new HttpClient({
        baseUrl: 'https://api.test.com',
        retries: 2,
        retryDelay: 10,
      });
      const result = await client.get('/flaky');

      expect(fetchSpy).toHaveBeenCalledTimes(3);
      expect(result.data).toBe('ok');
    });

    it('should not retry on client errors (4xx)', async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify({ code: 'BAD', message: 'bad' }), {
          status: 400,
        })
      );

      const client = new HttpClient({
        baseUrl: 'https://api.test.com',
        retries: 3,
        retryDelay: 10,
      });

      await expect(client.get('/bad')).rejects.toThrow(ApiError);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw after all retries exhausted', async () => {
      fetchSpy.mockResolvedValue(new Response('error', { status: 500 }));

      const client = new HttpClient({
        baseUrl: 'https://api.test.com',
        retries: 2,
        retryDelay: 10,
      });

      await expect(client.get('/always-fail')).rejects.toThrow(ApiError);
      expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptors', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      client.addRequestInterceptor((config) => ({
        ...config,
        headers: {
          ...config.headers,
          Authorization: 'Bearer token123',
        },
      }));

      await client.get('/protected');

      const [, init] = fetchSpy.mock.calls[0];
      expect(init.headers?.Authorization).toBe('Bearer token123');
    });

    it('should apply response interceptors', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: 'original', timestamp: 1 })
      );

      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      client.addResponseInterceptor(async (response) => {
        // Just pass through for this test - verify it's called
        return response;
      });

      const result = await client.get('/test');
      expect(result.data).toBe('original');
    });
  });

  describe('Default headers', () => {
    it('should merge default headers with request headers', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );

      const client = new HttpClient({
        baseUrl: 'https://api.test.com',
        headers: { 'X-Custom': 'value' },
      });
      await client.get('/test');

      const [, init] = fetchSpy.mock.calls[0];
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.headers['X-Custom']).toBe('value');
    });
  });

  describe('PUT, DELETE, PATCH', () => {
    it('should make PUT request', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );
      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      await client.put('/users/1', { name: 'updated' });

      const [, init] = fetchSpy.mock.calls[0];
      expect(init.method).toBe('PUT');
      expect(init.body).toBe(JSON.stringify({ name: 'updated' }));
    });

    it('should make DELETE request', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );
      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      await client.delete('/users/1');

      const [, init] = fetchSpy.mock.calls[0];
      expect(init.method).toBe('DELETE');
    });

    it('should make PATCH request', async () => {
      fetchSpy.mockResolvedValue(
        mockResponse({ success: true, data: null, timestamp: 1 })
      );
      const client = new HttpClient({ baseUrl: 'https://api.test.com' });
      await client.patch('/users/1', { name: 'patched' });

      const [, init] = fetchSpy.mock.calls[0];
      expect(init.method).toBe('PATCH');
      expect(init.body).toBe(JSON.stringify({ name: 'patched' }));
    });
  });
});
