import type { ChatMessage } from '../types';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, streamText } from 'ai';

export const OPENROUTER_MODEL = 'meta-llama/llama-3.3-8b-instruct:free';

function getOpenRouterApiKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  );
}

function getModelName(): string {
  return OPENROUTER_MODEL;
}

function getOpenRouter() {
  const apiKey = getOpenRouterApiKey();
  return createOpenRouter({ apiKey: apiKey ?? '' });
}

function buildPrompt(messages: Array<ChatMessage>): string {
  const system = '';

  const fewShot = '';
  ('');

  const history = messages
    .slice(-8)
    .map((m) => {
      if (m.role === 'user') return `User: ${m.content}`;
      if (m.role === 'assistant') return `Assistant: ${m.content}`;
      return `Context: ${m.content}`;
    })
    .join('\n');

  const prompt = `${system}\n\n${fewShot}${history}\nAssistant:`;
  return prompt;
}

function postprocess(text: string): string {
  let out = text.trim();
  if (out.startsWith('Assistant:'))
    out = out.replace(/^Assistant:\s*/i, '').trim();
  return out;
}

export function isAiConfigured(): boolean {
  return Boolean(getOpenRouterApiKey());
}

export async function generateAiReply(
  messages: Array<ChatMessage>,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  if (!isAiConfigured()) {
    return 'AI is not configured. Set OPENROUTER_API_KEY to enable advice.';
  }

  const openrouter = getOpenRouter();
  const modelName = getModelName();
  const prompt = buildPrompt(messages);
  try {
    const { text } = await generateText({
      model: openrouter.chat(modelName),
      prompt,
      temperature: 0.7,
      maxOutputTokens: 256,
      abortSignal: opts?.signal,
    });
    return postprocess(text);
  } catch (e) {
    try {
      console.log('[OpenRouter] generateText error', String(e));
    } catch {}
    return 'Unable to reach AI service right now. Please try again.';
  }
}

export async function generateAiReplyStream(
  messages: Array<ChatMessage>,
  opts: {
    signal?: AbortSignal;
    onLog?: (line: string) => void;
    onToken?: (delta: string) => void;
    onStart?: () => void;
    onComplete?: (full: string) => void;
    onError?: (errorMessage: string) => void;
  } = {},
): Promise<void> {
  const log = (line: string) => {
    try {
      opts.onLog?.(line);
    } catch {}
    try {
      console.log('[OpenRouter][UI]', line);
    } catch {}
  };

  if (!isAiConfigured()) {
    log('OpenRouter API key missing. Set OPENROUTER_API_KEY.');
    try {
      opts.onError?.('OpenRouter API key missing.');
    } catch {}
    return Promise.resolve();
  }

  const openrouter = getOpenRouter();
  const modelName = getModelName();
  const prompt = buildPrompt(messages);
  const parts: Array<string> = [];

  let result: ReturnType<typeof streamText>;
  try {
    try {
      opts.onStart?.();
    } catch {}
    log(`Starting stream with model: ${modelName}`);
    result = streamText({
      model: openrouter.chat(modelName),
      prompt,
      temperature: 0.7,
      maxOutputTokens: 256,
      abortSignal: opts?.signal,
    });
  } catch (e) {
    log(`Failed to start stream: ${String(e)}`);
    try {
      opts.onError?.(String(e));
    } catch {}
    return;
  }

  try {
    for await (const delta of result.textStream) {
      if (typeof delta === 'string') {
        parts.push(delta);
        opts.onToken?.(delta);
      } else if (delta && typeof (delta as any).type === 'string') {
        const d: any = delta;
        if (d.type === 'text-delta' && typeof d.value === 'string') {
          parts.push(d.value);
          opts.onToken?.(d.value);
        }
      }
    }
    try {
      opts.onComplete?.(parts.join(''));
    } catch {}
  } catch (e) {
    log(`Streaming error: ${String(e)}`);
    try {
      opts.onError?.(String(e));
    } catch {}
  }
}
