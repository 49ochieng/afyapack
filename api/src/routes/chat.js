/**
 * POST /api/chat
 *
 * Agentic chat endpoint. Accepts a user message + conversation history + file attachments.
 * Automatically:
 *   1. Detects intent (protocol question, stock query, danger-sign screening, referral, general)
 *   2. Routes to the right tool(s)
 *   3. Retrieves protocol context if clinical question detected
 *   4. Generates a grounded AI response with citations
 *   5. Detects language (Swahili / English) and adapts system prompt
 */

const express = require('express');
const { getDB } = require('../db/index');
const { searchProtocols } = require('../services/retrieval');
const { chat } = require('../services/foundry');

const router = express.Router();

// ── Intent patterns ──────────────────────────────────────────────────────────

const STOCK_PATTERNS = /\b(stock|supply|medicine|drug|medication|tablet|vial|amoxicillin|paracetamol|ORS|dawa|hisa|madawa|dawa za|tembe|sindano|infusion)\b/i;
const DANGER_PATTERNS = /\b(danger|urgent|critical|refer|referral|emergency|convulsions|unconscious|degedege|hatari|haraka|dharura|pitisha|peleka hospitali|kupoteza fahamu|kushindwa kupumua)\b/i;

// Comprehensive Swahili detection — common CHW vocabulary, greetings, clinical terms
const SWAHILI_PATTERNS = /\b(homa|kuhara|mtoto|mgonjwa|dawa|mimba|dalili|haraka|hatari|msaada|degedege|kushindwa|kupumua|kutapika|kikohozi|kizunguzungu|uchovu|maumivu|tumbo|kichwa|moyo|damu|vidonda|chanjo|kunyonyesha|kujifungua|ujauzito|watoto|mama|baba|hospitali|kliniki|daktari|muuguzi|mhudumu|rufaa|upungufu|baridi|joto|pumzi|mkojo|kinyesi|mdomo|macho|ngozi|mwili|wiki|leo|jana|kesho|usiku|asubuhi|jioni|sawa|asante|tafadhali|karibu|nifanye|nini|ninafanya|anaumwa|anaumia|wanaumwa|hawezi|hawana|wana|ana|sina|sisi|wewe|yeye|wao|nchi|kata|kijiji|zahanati|dispensary|ORS|coartem|oxytocin|salama|hatua|tathmini|angalia|pima|kipimo|joto la mwili|pressure|shinikizo|uzito|urefu)\b/i;

const CLINICAL_PATTERNS = /\b(fever|diarrhea|diarrhoea|vomiting|cough|breathing|malaria|dehydration|referral|protocol|treatment|manage|symptom|vital|temperature|pulse|pregnant|maternal|child|infant|homa|kuhara|mtoto|mimba|kutapika|kikohozi|kupumua|degedege|dalili|maumivu|ujauzito|kujifungua|chanjo|damu|vidonda)\b/i;

function detectIntent(message) {
  const msg = message.toLowerCase();
  if (STOCK_PATTERNS.test(msg)) return 'stock';
  if (DANGER_PATTERNS.test(msg)) return 'screening';
  if (CLINICAL_PATTERNS.test(msg)) return 'clinical';
  return 'general';
}

function detectLanguage(message) {
  // Count Swahili word matches for better accuracy on mixed messages
  const matches = (message.match(SWAHILI_PATTERNS) || []).length;
  return matches >= 1 ? 'sw' : 'en';
}

// ── System prompts ────────────────────────────────────────────────────────────

function buildSystemPrompt(lang, intent) {
  const base = lang === 'sw'
    ? `You are AfyaPack, a health decision support assistant for frontline health workers in East Africa.

CRITICAL RULES:
1. You are NOT a diagnostic tool. Never state a diagnosis.
2. Base guidance ONLY on protocol excerpts provided. Do not fabricate clinical facts.
3. Use plain, clear language for frontline workers.
4. Structure responses: brief assessment → numbered action steps → referral trigger (if any).
5. Always state when referral or escalation is needed, and how urgently.
6. If retrieved protocols don't cover the question, say so explicitly.
7. End every response with a one-line safety reminder.`

    : `You are AfyaPack, a health decision support assistant for frontline community health workers. Never diagnose. Base guidance only on the protocol excerpts provided.

Response format:
**Assessment:** [1-2 sentences on the clinical situation]
**Action steps:**
1. [first step]
2. [second step]
3. ...
**Refer immediately if:** [danger signs only, or "none identified"]
*Decision support only — not a diagnosis.*`;

  const stockAddition = lang === 'sw'
    ? '\n\nUnajibu pia maswali kuhusu hisa za dawa na vifaa vya hospitali. Toa orodha wazi na ushauri wa hatua za kuchukua kama dawa imekwisha.'
    : '\n\nYou are also helping with medicine and supply stock management. Provide clear inventory status and actionable steps when items are low or out.';

  if (intent === 'stock') {
    return base + stockAddition;
  }

  return base;
}

// ── Swahili ↔ English helpers ─────────────────────────────────────────────────
// Word-level translation of common clinical Swahili terms so that small models
// (which don't speak Swahili) receive an English version of the query.

const SW_TO_EN = {
  homa: 'fever', kuhara: 'diarrhea', kutapika: 'vomiting', kikohozi: 'cough',
  kupumua: 'breathing', degedege: 'convulsions', kizunguzungu: 'dizziness',
  maumivu: 'pain', tumbo: 'abdomen', kichwa: 'head', moyo: 'heart',
  damu: 'blood', vidonda: 'wounds', upungufu: 'deficiency',
  mimba: 'pregnancy', ujauzito: 'pregnancy', kujifungua: 'delivery',
  mtoto: 'child', watoto: 'children', mama: 'mother', mgonjwa: 'patient',
  dawa: 'medicine', chanjo: 'vaccine', rufaa: 'referral',
  hospitali: 'hospital', zahanati: 'clinic', daktari: 'doctor',
  muuguzi: 'nurse', dalili: 'symptoms', hatari: 'danger',
  dharura: 'emergency', haraka: 'urgent', msaada: 'help',
  nifanye: 'what should I do', nianze: 'where do I start',
  ana: 'has', anaumwa: 'is sick', hawezi: 'cannot',
  siku: 'days', wiki: 'weeks', miaka: 'years old',
};

function swahiliToEnglish(text) {
  let translated = text;
  for (const [sw, en] of Object.entries(SW_TO_EN)) {
    translated = translated.replace(new RegExp(`\\b${sw}\\b`, 'gi'), en);
  }
  return translated;
}

// ── Swahili post-processor ────────────────────────────────────────────────────
// Replaces English section headers with Swahili equivalents so Swahili-detected
// queries always get bilingual-looking responses even from a small English model.

function swahilify(text) {
  return text
    .replace(/\*\*Assessment[:\s]*/gi,      '**Tathmini (Assessment):** ')
    .replace(/\*\*Action steps?[:\s]*/gi,   '**Hatua za kuchukua (Action steps):**\n')
    .replace(/\*\*Refer immediately if[:\s]*/gi, '**Peleka hospitali ikiwa (Refer if):** ')
    .replace(/\*\*Safety (note|reminder)[:\s]*/gi, '**Onyo la usalama:** ')
    .replace(/Decision support only[^.]*\./gi, 'Msaada wa maamuzi tu — si utambuzi.')
    .replace(/Not a diagnosis[^.]*\./gi,    'Si utambuzi.')
    .replace(/\bfever\b/gi, 'homa (fever)')
    .replace(/\bdiarrhea\b/gi, 'kuhara (diarrhea)')
    .replace(/\bdehydration\b/gi, 'upungufu wa maji (dehydration)')
    .replace(/\bconvulsions?\b/gi, 'degedege (convulsions)')
    .replace(/\brefer\b/gi, 'peleka hospitali (refer)')
    .replace(/\bORS\b/g, 'ORS (maji ya chumvi na sukari)')
    .replace(/\bpregnant\b/gi, 'mjamzito (pregnant)');
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { message, history = [], attachments = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const lang = detectLanguage(message);
    const intent = detectIntent(message);
    // Translate Swahili to English early — used for retrieval + model input
    const queryForModel = lang === 'sw' ? swahiliToEnglish(message) : message;

    let citations = [];
    let tool_used = null;
    let contextBlock = '';

    // ── Tool: Stock lookup ──────────────────────────────────────────────────
    if (intent === 'stock') {
      try {
        const db = getDB();
        const items = db.prepare('SELECT * FROM stock ORDER BY name').all();
        const lowItems = items.filter(i => i.is_low || i.is_out);
        const stockSummary = items
          .map(i => `${i.name} (${i.category}): ${i.quantity} ${i.unit}${i.is_out ? ' — OUT OF STOCK' : i.is_low ? ' — LOW' : ''}`)
          .join('\n');

        contextBlock = `\nCURRENT STOCK LEVELS:\n${stockSummary}\n\nSummary: ${items.length} items total, ${lowItems.filter(i => i.is_out).length} out of stock, ${lowItems.filter(i => i.is_low && !i.is_out).length} running low.\n`;
        tool_used = 'stock_check';
      } catch {
        contextBlock = '\n[Stock data unavailable]\n';
      }
    }

    // ── Tool: Protocol retrieval (for clinical questions) ──────────────────
    if (intent === 'clinical' || intent === 'screening') {
      try {
        const chunks = searchProtocols(queryForModel, 2);
        if (chunks.length > 0) {
          const chunksText = chunks
            .map((c, i) => `[${i + 1}] "${c.doc_title}"${c.section ? ` — ${c.section}` : ''}:\n${c.content}`)
            .join('\n\n');
          contextBlock = `\nRELEVANT PROTOCOL EXCERPTS:\n${chunksText}\n\nRespond based ONLY on these protocol excerpts. Cite them by number.\n`;
          citations = chunks.map(c => ({
            id: c.id,
            title: c.doc_title,
            section: c.section,
            score: c.score,
          }));
          tool_used = 'protocol_search';
        }
      } catch {
        // proceed without context
      }
    }

    // ── Build messages ──────────────────────────────────────────────────────
    const systemPrompt = buildSystemPrompt(lang, intent);

    // Trim history to last 6 turns
    const recentHistory = history.slice(-4).filter(m => m.role && m.content);

    // Build attachment block
    let attachmentBlock = '';
    if (attachments.length > 0) {
      const parts = attachments.map(a => {
        if (a.content) {
          return `--- Attached file: ${a.name} ---\n${a.content.slice(0, 2000)}\n---`;
        }
        return `--- Attached file: ${a.name} (${a.type || 'file'}, content not extractable) ---`;
      });
      attachmentBlock = '\n\nATTACHED FILES:\n' + parts.join('\n\n');
    }

    // Use translated query for the model input
    const modelMessage = queryForModel;

    // Inject context + attachments into user message
    const userContent = (contextBlock || attachmentBlock)
      ? `${modelMessage}${contextBlock}${attachmentBlock}`
      : modelMessage;

    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: userContent },
    ];

    // ── Call AI ─────────────────────────────────────────────────────────────
    const reply = await chat(llmMessages, {
      maxTokens: 300,
      temperature: 0.25,
      lang,
    });

    // Detect escalation signal in reply
    const escalation_needed =
      /urgent|refer immediately|emergency|critical|escalat/i.test(reply) ||
      (lang === 'sw' && /haraka|hospitali mara moja|hatari sana/i.test(reply));

    // For Swahili queries: relabel English section headers with Swahili equivalents
    const finalReply = lang === 'sw' ? swahilify(reply) : reply;

    res.json({
      reply: finalReply,
      citations,
      escalation_needed,
      tool_used: tool_used || (intent === 'general' ? null : intent),
      language: lang,
      intent,
    });

  } catch (err) {
    console.error('[Chat] Error:', err);
    res.status(500).json({ error: err.message || 'Chat generation failed' });
  }
});

module.exports = router;
