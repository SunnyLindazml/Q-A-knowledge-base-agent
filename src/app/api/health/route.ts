import {
  successResponse,
  withErrorHandler,
  withLogging,
  withMiddleware,
} from '@/lib/api';

const startTime = Date.now();

const enhance = withMiddleware(withErrorHandler, withLogging);

export const GET = enhance(async () => {
  return successResponse({
    status: 'ok',
    version: process.env.npm_package_version ?? '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: Date.now(),
  });
});
