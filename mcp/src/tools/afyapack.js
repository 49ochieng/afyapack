/**
 * MCP Tools: AfyaPack-specific tools
 * Connects to the local AfyaPack API for health workflows.
 */

const API = process.env.AFYAPACK_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  // Guidance and referral endpoints call local AI — allow up to 2 minutes
  const isAI = path.includes('/guidance') || path.includes('/referrals');
  const timeout = isAI ? 120000 : 30000;

  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeout),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const tools = [
  {
    name: 'search_protocols',
    description: 'Search AfyaPack local clinical protocols for relevant guidance. Returns ranked chunks from local documents. Works offline. Use this to find protocol-based evidence before generating clinical guidance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Clinical search query (e.g. "fever dehydration child", "homa na kuhara mtoto", "maternal warning signs")',
        },
        top_k: {
          type: 'number',
          description: 'Number of results to return (default: 4)',
          default: 4,
        },
      },
      required: ['query'],
    },
    handler: async ({ query, top_k = 4 }) => {
      const results = await apiFetch('/api/protocols/search', {
        method: 'POST',
        body: JSON.stringify({ query, topK: top_k }),
      });
      return {
        chunks: results,
        count: results.length,
        query,
      };
    },
  },

  {
    name: 'list_protocols',
    description: 'List all local clinical protocol documents available in AfyaPack.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const docs = await apiFetch('/api/protocols');
      return { documents: docs, count: docs.length };
    },
  },

  {
    name: 'create_encounter',
    description: 'Create a new patient encounter record in AfyaPack. Automatically screens for red flags (fever, tachycardia, danger signs, maternal warning signs). Returns encounter ID and any clinical alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        age: { type: 'number', description: 'Patient age in years' },
        sex: { type: 'string', enum: ['male', 'female'], description: 'Patient sex' },
        pregnant: { type: 'boolean', description: 'Is patient pregnant?', default: false },
        symptoms: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of symptoms (English or Swahili). E.g. ["fever", "homa", "diarrhoea"]',
        },
        duration: { type: 'string', description: 'Symptom duration (e.g. "2 days", "siku 2")' },
        temperature: { type: 'number', description: 'Temperature in Celsius' },
        pulse: { type: 'number', description: 'Pulse rate in bpm' },
        danger_signs: {
          type: 'array',
          items: { type: 'string' },
          description: 'Observed danger signs',
        },
        notes: { type: 'string', description: 'Clinical notes or context' },
      },
      required: ['age', 'sex', 'symptoms'],
    },
    handler: async (data) => {
      const encounter = await apiFetch('/api/encounters', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return {
        encounter_id: encounter.id,
        red_flags: encounter.red_flags,
        has_critical_flags: encounter.red_flags?.some(f => f.severity === 'critical') || false,
        patient_summary: `${encounter.age}y ${encounter.sex}${encounter.pregnant ? ', pregnant' : ''}`,
      };
    },
  },

  {
    name: 'get_guidance',
    description: 'Generate grounded clinical guidance for a patient encounter. Uses local AI + retrieved protocol chunks. Returns structured guidance with citations and safety note.',
    inputSchema: {
      type: 'object',
      properties: {
        encounter_id: {
          type: 'string',
          description: 'Encounter ID from create_encounter',
        },
      },
      required: ['encounter_id'],
    },
    handler: async ({ encounter_id }) => {
      const guidance = await apiFetch('/api/guidance', {
        method: 'POST',
        body: JSON.stringify({ encounter_id }),
      });
      return {
        guidance_text: guidance.guidance_text,
        citations: guidance.citations,
        safety_note: guidance.safety_note,
        escalation_needed: guidance.escalation_needed,
        source_count: guidance.citations?.length || 0,
      };
    },
  },

  {
    name: 'generate_referral',
    description: 'Generate a structured referral handoff note for a patient encounter.',
    inputSchema: {
      type: 'object',
      properties: {
        encounter_id: {
          type: 'string',
          description: 'Encounter ID from create_encounter',
        },
      },
      required: ['encounter_id'],
    },
    handler: async ({ encounter_id }) => {
      const referral = await apiFetch('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({ encounter_id }),
      });
      return {
        referral_id: referral.id,
        summary: referral.summary,
        urgency: referral.urgency,
      };
    },
  },

  {
    name: 'check_stock',
    description: 'Check medicine and supply stock levels at the facility. Returns all items with low-stock warnings.',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'low', 'out', 'medicine', 'consumable'],
          description: 'Filter stock items',
          default: 'all',
        },
      },
    },
    handler: async ({ filter = 'all' }) => {
      const items = await apiFetch('/api/stock');
      const filtered = items.filter(i => {
        if (filter === 'low') return i.is_low && !i.is_out;
        if (filter === 'out') return i.is_out;
        if (filter === 'medicine') return i.category === 'medicine';
        if (filter === 'consumable') return i.category === 'consumable';
        return true;
      });

      return {
        items: filtered,
        total: filtered.length,
        low_count: items.filter(i => i.is_low).length,
        out_count: items.filter(i => i.is_out).length,
        alert: items.filter(i => i.is_low).length > 0
          ? `${items.filter(i => i.is_low).length} items need restocking`
          : 'All items adequately stocked',
      };
    },
  },

  {
    name: 'get_system_status',
    description: 'Check AfyaPack system status: API health, AI model availability, database stats.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      const health = await apiFetch('/api/health');
      return health;
    },
  },
];
