import type { ChatMessage } from '../types';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText, streamText } from 'ai';

export const OPENROUTER_MODEL = 'meta-llama/llama-3.3-8b-instruct:free';
export const OLLAMA_MODEL = 'Intelligent-Internet/II-Medical-8B';

function getOpenRouterApiKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
  );
}

function getOllamaConfig() {
  return {
    apiKey: process.env.OLLAMA_API_KEY || '',
    baseURL: process.env.OLLAMA_BASE_URL || 'http://202.215.136.222:52550/v1',
  };
}

function getAiProvider(): 'openrouter' | 'ollama' {
  return (process.env.AI_PROVIDER as 'openrouter' | 'ollama') || 'openrouter';
}

function getModelName(): string {
  return getAiProvider() === 'ollama' ? OLLAMA_MODEL : OPENROUTER_MODEL;
}

function getOpenRouter() {
  const apiKey = getOpenRouterApiKey();
  return createOpenRouter({ apiKey: apiKey ?? '' });
}

function getOllama() {
  const config = getOllamaConfig();
  return createOpenAICompatible({
    name: 'ollama',
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

function postprocess(text: string): string {
  let out = text.trim();
  if (out.startsWith('Assistant:'))
    out = out.replace(/^Assistant:\s*/i, '').trim();
  return out;
}

export function isAiConfigured(): boolean {
  const provider = getAiProvider();
  if (provider === 'ollama') {
    const config = getOllamaConfig();
    return Boolean(config.apiKey && config.baseURL);
  }
  return Boolean(getOpenRouterApiKey());
}

export async function generateAiReply(
  messages: Array<ChatMessage>,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  if (!isAiConfigured()) {
    const provider = getAiProvider();
    return `AI is not configured. Set ${provider === 'ollama' ? 'OLLAMA_API_KEY and OLLAMA_BASE_URL' : 'OPENROUTER_API_KEY'} to enable advice.`;
  }

  const provider = getAiProvider();
  const modelName = getModelName();
  const prompt = buildPrompt(messages);

  try {
    let model: any;
    if (provider === 'ollama') {
      const ollama = getOllama();
      model = ollama(modelName);
    } else {
      const openrouter = getOpenRouter();
      model = openrouter.chat(modelName);
    }

    const { text } = await generateText({
      model,
      prompt,
      temperature: 0.7,
      maxOutputTokens: 256,
      abortSignal: opts?.signal,
    });
    return postprocess(text);
  } catch (e) {
    try {
      console.log(`[${provider}] generateText error`, String(e));
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
      const provider = getAiProvider();
      console.log(`[${provider.toUpperCase()}][UI]`, line);
    } catch {}
  };

  if (!isAiConfigured()) {
    const provider = getAiProvider();
    const errorMsg = `${provider} API key missing. Set ${provider === 'ollama' ? 'OLLAMA_API_KEY and OLLAMA_BASE_URL' : 'OPENROUTER_API_KEY'}.`;
    log(errorMsg);
    try {
      opts.onError?.(errorMsg);
    } catch {}
    return Promise.resolve();
  }

  const provider = getAiProvider();
  const modelName = getModelName();
  const prompt = buildPrompt(messages);
  const parts: Array<string> = [];

  let result: ReturnType<typeof streamText>;
  try {
    try {
      opts.onStart?.();
    } catch {}
    log(`Starting stream with model: ${modelName}`);

    let model: any;
    if (provider === 'ollama') {
      const ollama = getOllama();
      model = ollama(modelName);
    } else {
      const openrouter = getOpenRouter();
      model = openrouter.chat(modelName);
    }

    result = streamText({
      model,
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
