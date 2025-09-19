import type { ChatMessage } from '../types';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';

export const VLLM_MODEL = 'Intelligent-Internet/II-Medical-8B';

function getVllmConfig() {
  return {
    apiKey: process.env.VLLM_API_KEY || '',
    baseURL: process.env.VLLM_BASE_URL || '',
  };
}

function getModelName(): string {
  return VLLM_MODEL;
}

function getVllm() {
  const config = getVllmConfig();
  return createOpenAICompatible({
    name: 'vllm',
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
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

export function isAiConfigured(): boolean {
  const config = getVllmConfig();
  return Boolean(config.apiKey && config.baseURL);
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
      console.log('[VLLM][UI]', line);
    } catch {}
  };

  if (!isAiConfigured()) {
    const errorMsg =
      'vllm API key missing. Set VLLM_API_KEY and VLLM_BASE_URL.';
    log(errorMsg);
    try {
      opts.onError?.(errorMsg);
    } catch {}
    return Promise.resolve();
  }

  const modelName = getModelName();
  const prompt = buildPrompt(messages);
  const parts: Array<string> = [];

  let result: ReturnType<typeof streamText>;
  try {
    try {
      opts.onStart?.();
    } catch {}
    log(`Starting stream with model: ${modelName}`);

    const vllm = getVllm();
    const model: any = vllm(modelName);

    result = streamText({
      model,
      prompt,
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
