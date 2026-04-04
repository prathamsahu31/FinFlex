import { GoogleGenAI } from '@google/genai';

/**
 * Returns the Gemini API key from any available source.
 * Checks: Vite define (process.env), import.meta.env, and raw process.env.
 * Works in both local dev (.env file) and production (Render/Vercel system env vars).
 */
export function getGeminiApiKey(): string {
  const key =
    (typeof process !== 'undefined' && (process.env as any).VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && (process.env as any).GEMINI_API_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    '';
  return key;
}

/**
 * Creates and returns a GoogleGenAI client instance.
 * Throws a clear error if no API key is found.
 */
export function getGeminiClient(): InstanceType<typeof GoogleGenAI> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('MISSING_KEY: No Gemini API key found. Set VITE_GEMINI_API_KEY or GEMINI_API_KEY in your environment.');
  }
  return new GoogleGenAI({ apiKey });
}
