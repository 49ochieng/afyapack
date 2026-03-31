/**
 * Swahili language support for AfyaPack MCP.
 *
 * Provides:
 * - System prompt injection for Swahili responses
 * - Key medical term translations
 * - Language detection helper
 */

export const SWAHILI_SYSTEM_PROMPT = `Wewe ni msaidizi wa afya wa AfyaPack, unayefanya kazi kwa lugha ya Kiswahili.

SHERIA MUHIMU:
1. Jibu KILA wakati kwa Kiswahili, isipokuwa mtumiaji aulize kwa lugha nyingine.
2. Wewe ni zana ya msaada wa uamuzi wa kliniki TU — SIWEZI kutoa utambuzi.
3. Mwongozo wote unatoka kwenye hati za itifaki zilizohifadhiwa mahali.
4. Kila wakati ongelea alama za hatari na uwasiliane haraka.
5. Nunua vyanzo vya itifaki ulizotumia kila wakati.
6. Sema wazi wakati ushahidi haukutosha.

MUUNDO WA JIBU:
- Tumia Kiswahili safi na rahisi kueleweka
- Toa hatua za wazi na za vitendo
- Jumuisha onyo la usalama kila wakati
- Taja vyanzo vya itifaki ulizotumia`;

export const MEDICAL_TERMS_SW_EN = {
  // Symptoms
  homa: 'fever',
  kikohozi: 'cough',
  kuhara: 'diarrhoea',
  kutapika: 'vomiting',
  maumivu: 'pain',
  'maumivu ya kichwa': 'headache',
  'ugumu wa kupumua': 'difficulty breathing',
  upele: 'rash',
  'macho yaliyozama': 'sunken eyes',
  'ngozi inayorudi polepole': 'skin pinch returns slowly',
  'degedege': 'convulsions',
  'shingo ngumu': 'stiff neck',
  'kutoweza kunywa': 'unable to drink',
  'kutoweza kulisha': 'unable to feed',
  // Vitals
  joto: 'temperature',
  mapigo: 'pulse',
  shinikizo: 'blood pressure',
  // Clinical
  utambuzi: 'diagnosis',
  matibabu: 'treatment',
  dawa: 'medicine',
  hospitali: 'hospital',
  rufaa: 'referral',
  dalili: 'symptoms',
  mgonjwa: 'patient',
  mjamzito: 'pregnant',
  mimba: 'pregnancy',
  mtoto: 'child',
  watoto: 'children',
  // Actions
  rejesha: 'refer',
  angalia: 'monitor',
  toa: 'give/administer',
  pima: 'measure/test',
  // Urgency
  haraka: 'urgent',
  hatari: 'danger',
  'dalili za hatari': 'danger signs',
};

export const MEDICAL_TERMS_EN_SW = Object.fromEntries(
  Object.entries(MEDICAL_TERMS_SW_EN).map(([sw, en]) => [en, sw])
);

export const UI_STRINGS = {
  sw: {
    greeting: 'Habari! Mimi ni AfyaPack, msaidizi wako wa afya.',
    disclaimer: '⚠️ Hii ni msaada wa uamuzi wa kliniki tu. Siwezi kutoa utambuzi. Rejesha kwa daktari ukiwa na shaka.',
    not_found: 'Samahani, sijapatikana habari.',
    processing: 'Ninashughulikia...',
    error: 'Hitilafu imetokea. Tafadhali jaribu tena.',
    sources_used: 'Vyanzo vilivyotumika',
    safety_note: 'Onyo la usalama',
    refer_now: 'REJESHA MARA MOJA',
    monitor: 'FUATILIA KWA MAKINI',
  },
  en: {
    greeting: 'Hello! I am AfyaPack, your health support assistant.',
    disclaimer: '⚠️ This is clinical decision support only. I cannot diagnose. Refer to a clinician when uncertain.',
    not_found: 'Sorry, no information found.',
    processing: 'Processing...',
    error: 'An error occurred. Please try again.',
    sources_used: 'Sources used',
    safety_note: 'Safety note',
    refer_now: 'REFER NOW',
    monitor: 'MONITOR CLOSELY',
  },
};

/**
 * Detect if text is predominantly Swahili.
 */
export function detectSwahili(text) {
  const swWords = Object.keys(MEDICAL_TERMS_SW_EN);
  const commonSw = ['ni', 'ya', 'na', 'wa', 'kwa', 'je', 'habari', 'sawa', 'ndiyo', 'hapana', 'tafadhali'];
  const allSw = [...swWords, ...commonSw];
  const lower = text.toLowerCase();
  const matches = allSw.filter(w => lower.includes(w)).length;
  return matches >= 2;
}

/**
 * Build a system prompt for the given language.
 */
export function buildSystemPrompt(lang = 'sw', customInstructions = '') {
  const base = lang === 'sw' ? SWAHILI_SYSTEM_PROMPT : AFYAPACK_EN_SYSTEM_PROMPT;
  return customInstructions ? `${base}\n\n${customInstructions}` : base;
}

const AFYAPACK_EN_SYSTEM_PROMPT = `You are AfyaPack, a protocol-based clinical decision support assistant.

CRITICAL RULES:
1. Always respond in English unless user writes in Swahili.
2. You are decision support ONLY — never diagnose.
3. Base guidance on retrieved protocol excerpts only.
4. Always escalate danger signs urgently.
5. Cite protocol sources used.
6. State clearly when evidence is insufficient.`;

/**
 * Translate a clinical term from English to Swahili (or vice versa).
 */
export function translateTerm(term, direction = 'en_to_sw') {
  const lower = term.toLowerCase().trim();
  if (direction === 'en_to_sw') return MEDICAL_TERMS_EN_SW[lower] || term;
  return MEDICAL_TERMS_SW_EN[lower] || term;
}
