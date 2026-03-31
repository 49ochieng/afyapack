/**
 * AfyaPack MCP Server
 *
 * Exposes AfyaPack health tools to Claude via the Model Context Protocol.
 * Connects to local AI models (Foundry Local + Ollama) and the AfyaPack API.
 * Supports Swahili (Kiswahili) for East African frontline health workers.
 *
 * Transport: stdio (for Claude Desktop / Claude Code integration)
 *
 * Usage:
 *   node src/index.js
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env before anything else
const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

try {
  const { config } = await import('dotenv');
  config({ path: join(__dirname, '../.env') });
} catch {}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { detectProviders, chat, listAllModels } from './providers/router.js';
import { tools as askModelTools } from './tools/ask-model.js';
import { tools as afyapackTools } from './tools/afyapack.js';
import { tools as swahiliTools } from './tools/swahili-tools.js';
import { detectSwahili, UI_STRINGS } from './swahili.js';

// ─── Create MCP Server ───────────────────────────────────────────────────────

const server = new McpServer({
  name: 'afyapack-mcp',
  version: '1.0.0',
});

// ─── Register all tools ──────────────────────────────────────────────────────

const allTools = [...askModelTools, ...afyapackTools, ...swahiliTools];

for (const tool of allTools) {
  // Build zod schema from the inputSchema
  const zodSchema = buildZodSchema(tool.inputSchema);

  server.tool(
    tool.name,
    tool.description,
    zodSchema,
    async (args) => {
      try {
        const result = await tool.handler(args);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const lang = detectSwahili(JSON.stringify(args)) ? 'sw' : 'en';
        const errorMsg = lang === 'sw'
          ? `Hitilafu: ${err.message}`
          : `Error: ${err.message}`;
        return {
          content: [{ type: 'text', text: errorMsg }],
          isError: true,
        };
      }
    },
  );
}

// ─── Additional meta-tools ───────────────────────────────────────────────────

server.tool(
  'list_local_models',
  'List all locally available AI models (Foundry Local and Ollama).',
  {},
  async () => {
    const [providers, models] = await Promise.all([
      detectProviders(),
      listAllModels(),
    ]);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ providers, models }, null, 2),
        },
      ],
    };
  },
);

server.tool(
  'afyapack_help',
  'Get help and usage information for AfyaPack MCP tools in English or Swahili.',
  { language: z.enum(['sw', 'en']).default('en').optional() },
  async ({ language = 'en' }) => {
    const strings = UI_STRINGS[language] || UI_STRINGS.en;
    const toolNames = allTools.map(t => `• ${t.name}: ${t.description.slice(0, 80)}…`).join('\n');

    const helpText = language === 'sw'
      ? `# AfyaPack MCP — Msaada

${strings.greeting}
${strings.disclaimer}

## Zana Zinazopatikana:
${toolNames}

## Mifano:
- Uliza: "Omba search_protocols kwa homa na kuhara"
- Unda mkutano: "Tumia create_encounter kwa mtoto wa miaka 2 na homa"
- Angalia hisa: "Tumia check_stock kuona dawa zinazokaribia kuisha"
- Maelezo kwa Kiswahili: "Tumia explain_in_swahili kwa 'malaria treatment'"
`
      : `# AfyaPack MCP — Help

${strings.greeting}
${strings.disclaimer}

## Available Tools:
${toolNames}

## Examples:
- Search protocols: use search_protocols with "fever dehydration child"
- Create encounter: use create_encounter for a 2-year-old with fever
- Check stock: use check_stock to see low medicines
- Swahili explanation: use explain_in_swahili for "homa na kuhara mtoto"
`;

    return {
      content: [{ type: 'text', text: helpText }],
    };
  },
);

// ─── Start server ─────────────────────────────────────────────────────────────

async function main() {
  // Log to stderr (stdout is reserved for MCP protocol)
  const log = (...args) => process.stderr.write(`[AfyaPack MCP] ${args.join(' ')}\n`);

  log('Starting AfyaPack MCP server...');

  const providers = await detectProviders();
  log(`Foundry Local: ${providers.foundry ? `✓ (${providers.foundry_model})` : '✗ not reachable'}`);
  log(`Ollama:        ${providers.ollama ? `✓ (${providers.ollama_model})` : '✗ not reachable'}`);
  log(`AfyaPack API:  ${process.env.AFYAPACK_API_URL || 'http://localhost:3001'}`);
  log(`Language:      ${process.env.DEFAULT_LANGUAGE || 'sw'} (${process.env.DEFAULT_LANGUAGE === 'sw' ? 'Kiswahili' : 'English'})`);
  log(`Tools:         ${allTools.length + 2} registered`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('MCP server ready — listening on stdio');
}

main().catch(err => {
  process.stderr.write(`[AfyaPack MCP] Fatal: ${err.message}\n`);
  process.exit(1);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildZodSchema(inputSchema) {
  if (!inputSchema?.properties) return {};
  const shape = {};
  const props = inputSchema.properties;
  const required = inputSchema.required || [];

  for (const [key, prop] of Object.entries(props)) {
    let zodType;

    if (prop.type === 'string') {
      zodType = prop.enum ? z.enum(prop.enum) : z.string();
    } else if (prop.type === 'number') {
      zodType = z.number();
    } else if (prop.type === 'boolean') {
      zodType = z.boolean();
    } else if (prop.type === 'array') {
      zodType = z.array(z.string());
    } else {
      zodType = z.any();
    }

    // Apply default
    if (prop.default !== undefined) {
      zodType = zodType.default(prop.default);
    }

    // Make optional if not required
    if (!required.includes(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return shape;
}
