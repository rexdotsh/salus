import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

if (!process.env.VLLM_API_KEY || !process.env.VLLM_BASE_URL) {
  throw new Error('VLLM_API_KEY or VLLM_BASE_URL is not set');
}

export const vllm = createOpenAICompatible({
  name: 'VLLM | Vast.ai',
  apiKey: process.env.VLLM_API_KEY,
  baseURL: process.env.VLLM_BASE_URL,
});
