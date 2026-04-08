import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  InternalServerError,
} from '@/lib/api/errors';

describe('ApiError', () => {
  it('should create an ApiError with correct properties', () => {
    const error = new ApiError(500, 'TEST_ERROR', 'test message', {
      key: 'value',
    });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('test message');
    expect(error.details).toEqual({ key: 'value' });
  });

  it('should work without details', () => {
    const error = new ApiError(400, 'BAD', 'bad request');
    expect(error.details).toBeUndefined();
  });
});

describe('ValidationError', () => {
  it('should have status 400 and correct code', () => {
    const error = new ValidationError('invalid input', ['field required']);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ValidationError');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('invalid input');
    expect(error.details).toEqual(['field required']);
  });
});

describe('AuthenticationError', () => {
  it('should have status 401 and default message', () => {
    const error = new AuthenticationError();
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('AuthenticationError');
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.message).toBe('未授权访问');
  });

  it('should accept custom message', () => {
    const error = new AuthenticationError('custom auth error');
    expect(error.message).toBe('custom auth error');
  });
});

describe('NotFoundError', () => {
  it('should have status 404 and default message', () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('资源未找到');
  });
});

describe('InternalServerError', () => {
  it('should have status 500 and default message', () => {
    const error = new InternalServerError();
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('InternalServerError');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(error.message).toBe('服务器内部错误');
  });
});
