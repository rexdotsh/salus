import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { vllm } from '@/lib/ai/vllm';

export async function POST(req: Request) {
  const { messages, model }: { messages: UIMessage[]; model: string } =
    await req.json();

  const middleware = extractReasoningMiddleware({
    tagName: 'think',
  });

  const wrappedLanguageModel = wrapLanguageModel({
    model: vllm(model),
    middleware: middleware,
  });

  const result = streamText({
    model: wrappedLanguageModel,
    messages: convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
  });

  return result.toUIMessageStreamResponse({
    sendReasoning: true,
  });
}
