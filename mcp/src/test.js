/**
 * AfyaPack MCP — End-to-End Test Suite
 *
 * Tests all layers:
 *   1. Foundry Local connectivity
 *   2. Ollama connectivity
 *   3. Swahili response generation
 *   4. AfyaPack API (protocols, encounters, guidance, stock)
 *   5. Full clinical workflow (Swahili + English)
 *
 * Run: node src/test.js
 */

import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const { config } = await import('dotenv');
config({ path: join(__dirname, '../.env') });

import * as foundry from './providers/foundry.js';
import * as ollama from './providers/ollama.js';
import { chat, detectProviders, listAllModels } from './providers/router.js';
import { detectSwahili, translateTerm } from './swahili.js';
import { tools as afyapackTools } from './tools/afyapack.js';

const API = process.env.AFYAPACK_API_URL || 'http://localhost:3001';

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

async function test(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    const result = await fn();
    console.log(`\x1b[32m✓ PASS\x1b[0m${result ? ` (${result})` : ''}`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31m✗ FAIL\x1b[0m — ${err.message}`);
    failed++;
  }
}

function expect(val, msg) {
  if (!val) throw new Error(msg || `Expected truthy, got ${JSON.stringify(val)}`);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log('\n\x1b[1m═══ AfyaPack MCP — End-to-End Test ═══\x1b[0m\n');

// 1. Provider Detection
console.log('\x1b[36m▸ Provider Detection\x1b[0m');

const providers = await detectProviders();

await test('Detect Foundry Local', async () => {
  expect(typeof providers.foundry === 'boolean', 'foundry should be boolean');
  return providers.foundry ? `✓ ${providers.foundry_model}` : '✗ not available (OK)';
});

await test('Detect Ollama', async () => {
  expect(typeof providers.ollama === 'boolean', 'ollama should be boolean');
  return providers.ollama ? `✓ ${providers.ollama_model}` : '✗ not available (OK)';
});

await test('List all models', async () => {
  const models = await listAllModels();
  expect(Array.isArray(models), 'should return array');
  return `${models.length} models found`;
});

// 2. Foundry Local
console.log('\n\x1b[36m▸ Foundry Local\x1b[0m');

await test('Foundry availability check', async () => {
  const ok = await foundry.isAvailable();
  return ok ? 'available' : 'not available (OK — will use Ollama)';
});

if (providers.foundry) {
  await test('Foundry English response', async () => {
    const r = await foundry.chat([{ role: 'user', content: 'Reply with exactly: FOUNDRY_OK' }], { maxTokens: 20 });
    expect(r.content, 'should return content');
    expect(r.provider === 'foundry', 'provider should be foundry');
    return `${r.content.slice(0, 40).trim()}`;
  });

  await test('Foundry Swahili response', async () => {
    const r = await foundry.chat(
      [
        { role: 'system', content: 'Jibu kwa Kiswahili tu. Wewe ni msaidizi wa afya.' },
        { role: 'user', content: 'Habari? Jibu kwa neno moja.' },
      ],
      { maxTokens: 30 },
    );
    expect(r.content, 'should return content');
    return `"${r.content.slice(0, 50).trim()}"`;
  });
}

// 3. Ollama
console.log('\n\x1b[36m▸ Ollama\x1b[0m');

await test('Ollama availability check', async () => {
  const ok = await ollama.isAvailable();
  return ok ? 'available' : 'not available (OK — will use Foundry)';
});

if (providers.ollama) {
  await test('Ollama model list', async () => {
    const models = await ollama.listModels();
    expect(models.length > 0, 'should have at least one model');
    return models.map(m => m.id).join(', ');
  });
}

// 4. Router
console.log('\n\x1b[36m▸ Model Router\x1b[0m');

await test('Router auto-selects provider', async () => {
  const r = await chat(
    [{ role: 'user', content: 'Say: OK' }],
    { provider: 'auto', maxTokens: 10 },
  );
  expect(r.content, 'should return content');
  expect(r.provider, 'should have provider set');
  return `${r.provider} → "${r.content.slice(0, 30).trim()}"`;
});

// 5. Swahili
console.log('\n\x1b[36m▸ Swahili Support\x1b[0m');

await test('Detect Swahili text', async () => {
  expect(detectSwahili('Mtoto ana homa na kuhara'), 'homa/kuhara should detect as Swahili');
  expect(!detectSwahili('Child has fever and diarrhoea'), 'English should not detect as Swahili');
  return 'detection working';
});

await test('Translate en→sw: fever', async () => {
  const t = translateTerm('fever', 'en_to_sw');
  expect(t === 'homa', `expected "homa", got "${t}"`);
  return `fever → ${t}`;
});

await test('Translate sw→en: homa', async () => {
  const t = translateTerm('homa', 'sw_to_en');
  expect(t === 'fever', `expected "fever", got "${t}"`);
  return `homa → ${t}`;
});

await test('Translate sw→en: degedege', async () => {
  const t = translateTerm('degedege', 'sw_to_en');
  expect(t === 'convulsions', `expected "convulsions", got "${t}"`);
  return `degedege → ${t}`;
});

await test('Swahili AI response', async () => {
  const r = await chat(
    [
      { role: 'system', content: 'Jibu kwa Kiswahili tu. Wewe ni msaidizi wa afya.' },
      { role: 'user', content: 'Ni dalili gani za homa kwa mtoto?' },
    ],
    { provider: 'auto', maxTokens: 100 },
  );
  expect(r.content, 'should return content');
  return `"${r.content.slice(0, 60).trim()}"`;
});

// 6. AfyaPack API
console.log('\n\x1b[36m▸ AfyaPack API\x1b[0m');

const statusTool = afyapackTools.find(t => t.name === 'get_system_status');
const searchTool = afyapackTools.find(t => t.name === 'search_protocols');
const encounterTool = afyapackTools.find(t => t.name === 'create_encounter');
const guidanceTool = afyapackTools.find(t => t.name === 'get_guidance');
const stockTool = afyapackTools.find(t => t.name === 'check_stock');

await test('API health check', async () => {
  const status = await statusTool.handler({});
  expect(status.status === 'ok', `Expected status ok, got ${status.status}`);
  return `DB: ${status.db.protocol_chunks} chunks, ${status.db.stock_items} stock items`;
});

await test('Search protocols (English)', async () => {
  const result = await searchTool.handler({ query: 'fever dehydration child', top_k: 3 });
  expect(result.count > 0, `Expected results, got ${result.count}`);
  return `${result.count} chunks found`;
});

await test('Search protocols (Swahili)', async () => {
  const result = await searchTool.handler({ query: 'homa kuhara mtoto', top_k: 3 });
  expect(result.count >= 0, 'should return array');
  return `${result.count} chunks found for Swahili query`;
});

await test('Search maternal protocols', async () => {
  const result = await searchTool.handler({ query: 'maternal warning signs pregnancy', top_k: 3 });
  expect(result.count > 0, `Expected maternal results, got ${result.count}`);
  return `${result.count} chunks found`;
});

let testEncounterId;

await test('Create encounter (child fever — Swahili scenario)', async () => {
  const result = await encounterTool.handler({
    age: 2,
    sex: 'male',
    pregnant: false,
    symptoms: ['homa', 'kuhara', 'kutoweza kunywa'],
    duration: 'siku 2',
    temperature: 39.2,
    pulse: 118,
    danger_signs: ['macho yaliyozama'],
    notes: 'Mtoto hajala tangu asubuhi',
  });
  expect(result.encounter_id, 'should return encounter ID');
  testEncounterId = result.encounter_id;
  const flagCount = result.red_flags?.length || 0;
  return `ID: ${result.encounter_id.slice(0, 20)} | Red flags: ${flagCount} | Critical: ${result.has_critical_flags}`;
});

await test('Create encounter (maternal — critical)', async () => {
  const result = await encounterTool.handler({
    age: 28,
    sex: 'female',
    pregnant: true,
    symptoms: ['severe headache', 'blurred vision', 'facial swelling'],
    duration: '1 day',
    temperature: 37.8,
    pulse: 95,
    danger_signs: ['severe headache with visual disturbance'],
    notes: '32 weeks gestation',
  });
  expect(result.encounter_id, 'should return encounter ID');
  expect(result.has_critical_flags, 'maternal case should have critical flags');
  return `Critical flags: ${result.has_critical_flags} | Flags: ${result.red_flags?.length}`;
});

await test('Generate AI guidance for encounter', async () => {
  expect(testEncounterId, 'need encounter ID from previous test');
  const result = await guidanceTool.handler({ encounter_id: testEncounterId });
  expect(result.guidance_text, 'should return guidance');
  expect(result.source_count >= 0, 'should have source count');
  return `Sources: ${result.source_count} | Escalation: ${result.escalation_needed}`;
});

await test('Check stock — all items', async () => {
  const result = await stockTool.handler({ filter: 'all' });
  expect(result.total > 0, `Expected stock items, got ${result.total}`);
  return `${result.total} items | ${result.low_count} low | ${result.out_count} out`;
});

await test('Check stock — low items only', async () => {
  const result = await stockTool.handler({ filter: 'low' });
  expect(Array.isArray(result.items), 'should return array');
  return `${result.total} low items`;
});

// 7. Full Swahili workflow
console.log('\n\x1b[36m▸ Full Swahili Clinical Workflow\x1b[0m');

await test('Swahili encounter + search + AI guidance', async () => {
  // Create encounter
  const enc = await encounterTool.handler({
    age: 3,
    sex: 'female',
    symptoms: ['homa', 'kutoweza kunywa', 'degedege'],
    duration: 'masaa 6',
    temperature: 40.1,
    pulse: 130,
    danger_signs: ['degedege', 'kutoweza kunywa'],
  });

  // Search protocols
  const protocols = await searchTool.handler({ query: 'convulsions fever child urgent' });

  // Get guidance
  const guidance = await guidanceTool.handler({ encounter_id: enc.encounter_id });

  expect(enc.has_critical_flags, 'degedege + joto 40.1 should be critical');
  expect(guidance.guidance_text, 'should return guidance');

  return `Enc: ${enc.encounter_id.slice(0, 15)} | Critical: ${enc.has_critical_flags} | Protocol chunks: ${protocols.count} | Guidance generated: ✓`;
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n\x1b[1m─────────────────────────────────────────\x1b[0m');
console.log(`\x1b[1mResults: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m`);

if (failed === 0) {
  console.log('\x1b[32m\n✓ All tests passed — AfyaPack MCP is ready!\x1b[0m\n');
} else {
  console.log('\x1b[33m\n⚠ Some tests failed. Check the errors above.\x1b[0m\n');
  process.exit(1);
}
