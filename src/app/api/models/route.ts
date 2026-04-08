import { getAvailableProviders } from '@/lib/llm/model-factory';
import {
  successResponse,
  withErrorHandler,
  withLogging,
  withMiddleware,
} from '@/lib/api';

const enhance = withMiddleware(withErrorHandler, withLogging);

export const GET = enhance(async () => {
  const providers = getAvailableProviders();
  return successResponse(providers);
});
