import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChatAgent } from '@/lib/agents/chat-agent';
import { ModelProvider } from '@/lib/llm/config';
import {
  withErrorHandler,
  withLogging,
  withMiddleware,
  ValidationError,
} from '@/lib/api';

const chatBodySchema = z.object({
  message: z.string().min(1, 'message is required'),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.number(),
      })
    )
    .optional(),
  modelConfig: z
    .object({
      provider: z.enum(['openai', 'anthropic', 'ollama']),
      modelName: z.string(),
      temperature: z.number().optional(),
    })
    .optional(),
});

const enhance = withMiddleware(withErrorHandler, withLogging);

async function handlePost(req: NextRequest) {
  let body: z.infer<typeof chatBodySchema>;
  try {
    const raw = await req.json();
    const result = chatBodySchema.safeParse(raw);
    if (!result.success) {
      throw new ValidationError('Request validation failed', result.error);
    }
    body = result.data;
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError('Invalid JSON body');
  }

  const { message, modelConfig } = body;

  const agent = ChatAgent.create({
    modelConfig: modelConfig
      ? {
          provider: modelConfig.provider as ModelProvider,
          modelName: modelConfig.modelName,
          temperature: modelConfig.temperature,
        }
      : undefined,
  });

  const encoder = new TextEncoder();
  let lastMessageCount = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of agent.stream(message)) {
          const messages = chunk.messages;
          if (messages.length > lastMessageCount) {
            const lastMessage = messages[messages.length - 1];
            const content =
              typeof lastMessage.content === 'string'
                ? lastMessage.content
                : JSON.stringify(lastMessage.content);

            const role =
              lastMessage._getType() === 'human' ? 'user' : 'assistant';

            const data = JSON.stringify({
              role,
              content,
              messageType: lastMessage._getType(),
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            lastMessageCount = messages.length;
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export const POST = enhance(handlePost);
