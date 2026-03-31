/**
 * MCP Tools: Swahili-specific tools
 */
import { chat } from '../providers/router.js';
import { SWAHILI_SYSTEM_PROMPT, translateTerm, detectSwahili, MEDICAL_TERMS_SW_EN, MEDICAL_TERMS_EN_SW } from '../swahili.js';

export const tools = [
  {
    name: 'translate_clinical_term',
    description: 'Translate clinical/medical terms between English and Swahili (Kiswahili). Useful for AfyaPack health workflows in Kenya and East Africa.',
    inputSchema: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'The medical term to translate',
        },
        direction: {
          type: 'string',
          enum: ['en_to_sw', 'sw_to_en'],
          description: '"en_to_sw" = English to Swahili, "sw_to_en" = Swahili to English',
          default: 'en_to_sw',
        },
      },
      required: ['term'],
    },
    handler: async ({ term, direction = 'en_to_sw' }) => {
      const translated = translateTerm(term, direction);
      return {
        original: term,
        translated,
        direction,
        source: translated !== term ? 'dictionary' : 'not_found',
      };
    },
  },

  {
    name: 'explain_in_swahili',
    description: 'Get a clinical explanation or health guidance in Swahili (Kiswahili) from the local AI model. Uses AfyaPack Swahili health assistant persona.',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'Health question or clinical scenario (can be in English or Swahili)',
        },
        context: {
          type: 'string',
          description: 'Optional clinical context (patient details, protocol excerpts)',
        },
        provider: {
          type: 'string',
          enum: ['foundry', 'ollama', 'auto'],
          default: 'auto',
        },
      },
      required: ['question'],
    },
    handler: async ({ question, context, provider = 'auto' }) => {
      const messages = [
        { role: 'system', content: SWAHILI_SYSTEM_PROMPT },
        {
          role: 'user',
          content: context
            ? `Muktadha (Context):\n${context}\n\nSwali: ${question}`
            : question,
        },
      ];

      const result = await chat(messages, { provider, maxTokens: 600 });

      return {
        explanation: result.content,
        model: result.model,
        provider: result.provider,
        language: 'sw',
      };
    },
  },

  {
    name: 'list_medical_terms',
    description: 'List available medical term translations between English and Swahili in the AfyaPack dictionary.',
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['en_to_sw', 'sw_to_en', 'both'],
          default: 'sw_to_en',
        },
      },
    },
    handler: async ({ direction = 'sw_to_en' }) => {
      if (direction === 'sw_to_en') {
        return { terms: MEDICAL_TERMS_SW_EN, count: Object.keys(MEDICAL_TERMS_SW_EN).length };
      }
      if (direction === 'en_to_sw') {
        return { terms: MEDICAL_TERMS_EN_SW, count: Object.keys(MEDICAL_TERMS_EN_SW).length };
      }
      return {
        sw_to_en: MEDICAL_TERMS_SW_EN,
        en_to_sw: MEDICAL_TERMS_EN_SW,
        count: Object.keys(MEDICAL_TERMS_SW_EN).length,
      };
    },
  },

  {
    name: 'detect_language',
    description: 'Detect if a text is predominantly Swahili or English.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to detect language of' },
      },
      required: ['text'],
    },
    handler: async ({ text }) => {
      const isSwahili = detectSwahili(text);
      return {
        detected_language: isSwahili ? 'sw' : 'en',
        language_name: isSwahili ? 'Swahili (Kiswahili)' : 'English',
        confidence: 'heuristic',
      };
    },
  },
];
