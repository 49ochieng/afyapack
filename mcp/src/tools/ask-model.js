/**
 * MCP Tools: ask_foundry, ask_ollama, ask_local_model
 * Direct access to local AI models.
 */
import { z } from 'zod';
import { chat } from '../providers/router.js';
import { detectSwahili, buildSystemPrompt } from '../swahili.js';

export const tools = [
  {
    name: 'ask_foundry',
    description: 'Send a prompt to Foundry Local (qwen2.5-0.5b). Ideal for fast, local responses. Supports Swahili. Returns the model response.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt to send. Can be in English or Swahili (Kiswahili).',
        },
        system_prompt: {
          type: 'string',
          description: 'Optional system prompt override. Defaults to AfyaPack health assistant prompt.',
        },
        language: {
          type: 'string',
          enum: ['sw', 'en', 'auto'],
          description: 'Response language. "sw" = Swahili, "en" = English, "auto" = detect from prompt.',
          default: 'auto',
        },
        max_tokens: {
          type: 'number',
          description: 'Maximum tokens in response (default: 500)',
          default: 500,
        },
      },
      required: ['prompt'],
    },
    handler: async ({ prompt, system_prompt, language = 'auto', max_tokens = 500 }) => {
      const lang = language === 'auto' ? (detectSwahili(prompt) ? 'sw' : 'en') : language;
      const sysPrompt = system_prompt || buildSystemPrompt(lang);

      const result = await chat(
        [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: prompt },
        ],
        { provider: 'foundry', maxTokens: max_tokens },
      );

      return {
        response: result.content,
        model: result.model,
        provider: result.provider,
        language: lang,
      };
    },
  },

  {
    name: 'ask_ollama',
    description: 'Send a prompt to Ollama (mistral:latest). Larger, more capable model. Supports Swahili. Returns the model response.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt to send. Can be in English or Swahili (Kiswahili).',
        },
        system_prompt: {
          type: 'string',
          description: 'Optional system prompt override.',
        },
        language: {
          type: 'string',
          enum: ['sw', 'en', 'auto'],
          default: 'auto',
        },
        max_tokens: {
          type: 'number',
          default: 600,
        },
      },
      required: ['prompt'],
    },
    handler: async ({ prompt, system_prompt, language = 'auto', max_tokens = 600 }) => {
      const lang = language === 'auto' ? (detectSwahili(prompt) ? 'sw' : 'en') : language;
      const sysPrompt = system_prompt || buildSystemPrompt(lang);

      const result = await chat(
        [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: prompt },
        ],
        { provider: 'ollama', maxTokens: max_tokens },
      );

      return {
        response: result.content,
        model: result.model,
        provider: result.provider,
        language: lang,
      };
    },
  },

  {
    name: 'ask_local_model',
    description: 'Send a prompt to the best available local model (auto-selects Foundry Local or Ollama). Use this for general queries.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Prompt in English or Swahili.',
        },
        language: {
          type: 'string',
          enum: ['sw', 'en', 'auto'],
          default: 'auto',
        },
        max_tokens: {
          type: 'number',
          default: 500,
        },
        temperature: {
          type: 'number',
          description: 'Creativity (0.0 = focused, 1.0 = creative). Default: 0.3',
          default: 0.3,
        },
      },
      required: ['prompt'],
    },
    handler: async ({ prompt, language = 'auto', max_tokens = 500, temperature = 0.3 }) => {
      const lang = language === 'auto' ? (detectSwahili(prompt) ? 'sw' : 'en') : language;
      const sysPrompt = buildSystemPrompt(lang);

      const result = await chat(
        [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: prompt },
        ],
        { provider: 'auto', maxTokens: max_tokens, temperature },
      );

      return {
        response: result.content,
        model: result.model,
        provider: result.provider,
        language: lang,
      };
    },
  },
];
