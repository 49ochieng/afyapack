# Lesson 11: Multilingual Support

> Add Swahili language support for Tanzanian health workers.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 35 minutes |
| **Objective** | Implement bilingual UI and AI responses |
| **Output** | Language toggle with Swahili translations |
| **Prerequisites** | Lesson 10 (Stock tracking complete) |
| **Files/Folders** | `web/src/lib/i18n/`, `api/src/services/swahili.js` |

---

## What We're Building

```
English Mode:                    Swahili Mode:
┌────────────────────────┐      ┌────────────────────────┐
│ Patient Triage         │      │ Uchunguzi wa Mgonjwa   │
│                        │      │                        │
│ Age: [___] years       │  ←→  │ Umri: [___] miaka      │
│ Sex: ( )Male ( )Female │      │ Jinsia: ( )Me ( )Ke    │
│                        │      │                        │
│ Symptoms:              │      │ Dalili:                │
│ □ Fever                │      │ □ Homa                 │
│ □ Cough                │      │ □ Kikohozi             │
│ □ Diarrhea             │      │ □ Kuharisha            │
│                        │      │                        │
│ [Next →]               │      │ [Endelea →]            │
└────────────────────────┘      └────────────────────────┘
```

---

## Step 1: Create Translation Files

Create folder `web/src/lib/i18n/`:

### Create English Translations

Create file `web/src/lib/i18n/en.js`:

```javascript
export default {
  // Common
  app_name: 'AfyaPack',
  loading: 'Loading...',
  error: 'Error',
  save: 'Save',
  cancel: 'Cancel',
  next: 'Next',
  previous: 'Previous',
  submit: 'Submit',
  
  // Navigation
  nav_home: 'Home',
  nav_chat: 'Chat',
  nav_encounter: 'New Encounter',
  nav_stock: 'Stock',
  nav_settings: 'Settings',
  
  // Triage Form
  triage_title: 'Patient Triage',
  triage_step1: 'Demographics',
  triage_step2: 'Symptoms',
  triage_step3: 'Vitals',
  triage_step4: 'Danger Signs',
  
  // Demographics
  age: 'Age',
  age_years: 'years',
  sex: 'Sex',
  sex_male: 'Male',
  sex_female: 'Female',
  pregnant: 'Currently pregnant',
  
  // Symptoms
  select_symptoms: 'Select all symptoms present',
  duration: 'Duration',
  duration_placeholder: 'e.g., 3 days, since yesterday',
  
  symptom_fever: 'Fever',
  symptom_cough: 'Cough',
  symptom_diarrhea: 'Diarrhea',
  symptom_vomiting: 'Vomiting',
  symptom_headache: 'Headache',
  symptom_rash: 'Rash',
  symptom_abdominal_pain: 'Abdominal pain',
  symptom_difficulty_breathing: 'Difficulty breathing',
  symptom_loss_appetite: 'Loss of appetite',
  symptom_weakness: 'Weakness',
  
  // Vitals
  vitals_note: 'Enter vital signs if measured. Leave blank if not taken.',
  temperature: 'Temperature',
  temperature_unit: '°C',
  pulse: 'Pulse',
  pulse_unit: 'beats per minute',
  
  // Danger Signs
  danger_signs_warning: 'Any danger sign requires urgent attention.',
  danger_convulsions: 'Convulsions',
  danger_unable_drink: 'Unable to drink',
  danger_unable_breastfeed: 'Unable to breastfeed',
  danger_vomiting_everything: 'Vomiting everything',
  danger_unconscious: 'Unconscious',
  danger_very_sleepy: 'Very sleepy/difficult to wake',
  danger_severe_bleeding: 'Severe bleeding',
  danger_stiff_neck: 'Stiff neck',
  
  additional_notes: 'Additional Notes',
  
  // Red Flags
  red_flags_detected: 'Red Flags Detected',
  urgent_referral: 'URGENT REFERRAL NEEDED',
  severity_critical: 'Critical',
  severity_high: 'High',
  severity_medium: 'Medium',
  
  // Guidance
  get_guidance: 'Get Guidance',
  generating_guidance: 'Generating clinical guidance...',
  clinical_guidance: 'Clinical Guidance',
  patient_summary: 'Patient Summary',
  sources: 'Sources',
  
  // Chat
  chat_welcome: 'Welcome to AfyaPack',
  chat_welcome_desc: 'Your AI-powered clinical decision support assistant.',
  chat_placeholder: 'Ask about symptoms, protocols, or treatment...',
  
  // Stock
  stock_title: 'Stock Management',
  stock_add: 'Add Item',
  stock_low_alert: 'items need restocking',
  stock_in_stock: 'In Stock',
  stock_low: 'Low Stock',
  stock_critical: 'Critical',
  
  // Language
  language: 'Language',
  lang_en: 'English',
  lang_sw: 'Kiswahili',
};
```

### Create Swahili Translations

Create file `web/src/lib/i18n/sw.js`:

```javascript
export default {
  // Common
  app_name: 'AfyaPack',
  loading: 'Inapakia...',
  error: 'Hitilafu',
  save: 'Hifadhi',
  cancel: 'Ghairi',
  next: 'Endelea',
  previous: 'Rudi',
  submit: 'Wasilisha',
  
  // Navigation
  nav_home: 'Nyumbani',
  nav_chat: 'Mazungumzo',
  nav_encounter: 'Mgonjwa Mpya',
  nav_stock: 'Hifadhi',
  nav_settings: 'Mipangilio',
  
  // Triage Form
  triage_title: 'Uchunguzi wa Mgonjwa',
  triage_step1: 'Taarifa za Mgonjwa',
  triage_step2: 'Dalili',
  triage_step3: 'Vipimo',
  triage_step4: 'Ishara za Hatari',
  
  // Demographics
  age: 'Umri',
  age_years: 'miaka',
  sex: 'Jinsia',
  sex_male: 'Mwanaume',
  sex_female: 'Mwanamke',
  pregnant: 'Ana mimba',
  
  // Symptoms
  select_symptoms: 'Chagua dalili zote zilizopo',
  duration: 'Muda',
  duration_placeholder: 'mfano, siku 3, tangu jana',
  
  symptom_fever: 'Homa',
  symptom_cough: 'Kikohozi',
  symptom_diarrhea: 'Kuharisha',
  symptom_vomiting: 'Kutapika',
  symptom_headache: 'Maumivu ya kichwa',
  symptom_rash: 'Upele',
  symptom_abdominal_pain: 'Maumivu ya tumbo',
  symptom_difficulty_breathing: 'Ugumu wa kupumua',
  symptom_loss_appetite: 'Kupoteza hamu ya kula',
  symptom_weakness: 'Udhaifu',
  
  // Vitals
  vitals_note: 'Ingiza vipimo vya mwili vikipimwa. Acha wazi kama havijapimwa.',
  temperature: 'Joto la mwili',
  temperature_unit: '°C',
  pulse: 'Mapigo ya moyo',
  pulse_unit: 'kwa dakika',
  
  // Danger Signs
  danger_signs_warning: 'Ishara yoyote ya hatari inahitaji umakini wa dharura.',
  danger_convulsions: 'Kushutuka/Kifafa',
  danger_unable_drink: 'Hawezi kunywa',
  danger_unable_breastfeed: 'Hawezi kunyonya',
  danger_vomiting_everything: 'Anapika kila kitu',
  danger_unconscious: 'Amezimia',
  danger_very_sleepy: 'Amelala sana/Haanguki',
  danger_severe_bleeding: 'Kutoka damu kali',
  danger_stiff_neck: 'Shingo ngumu',
  
  additional_notes: 'Maelezo ya Ziada',
  
  // Red Flags
  red_flags_detected: 'Ishara za Hatari Zimegunduliwa',
  urgent_referral: 'UHAMISHO WA DHARURA UNAHITAJIKA',
  severity_critical: 'Hatari Kubwa',
  severity_high: 'Hatari',
  severity_medium: 'Wastani',
  
  // Guidance
  get_guidance: 'Pata Mwongozo',
  generating_guidance: 'Inatengeneza mwongozo wa kiafya...',
  clinical_guidance: 'Mwongozo wa Kiafya',
  patient_summary: 'Muhtasari wa Mgonjwa',
  sources: 'Vyanzo',
  
  // Chat
  chat_welcome: 'Karibu AfyaPack',
  chat_welcome_desc: 'Msaidizi wako wa maamuzi ya kiafya unaotumia AI.',
  chat_placeholder: 'Uliza kuhusu dalili, itifaki, au matibabu...',
  
  // Stock
  stock_title: 'Usimamizi wa Dawa',
  stock_add: 'Ongeza',
  stock_low_alert: 'vinahitaji kujazwa',
  stock_in_stock: 'Ipo',
  stock_low: 'Inapungua',
  stock_critical: 'Hatari',
  
  // Language
  language: 'Lugha',
  lang_en: 'English',
  lang_sw: 'Kiswahili',
};
```

---

## Step 2: Create i18n Context

Create file `web/src/lib/i18n/context.js`:

### Copilot Prompt

```
@workspace Create a React context for internationalization that:
- Stores current language (en/sw) in localStorage
- Provides t(key) function for translations
- Provides setLanguage function
- Falls back to English if key not found
```

### Expected Code

```jsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './en';
import sw from './sw';

const translations = { en, sw };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  
  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('afyapack_language');
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);
  
  // Set language and save preference
  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('afyapack_language', lang);
    }
  }, []);
  
  // Translate function
  const t = useCallback((key, params = {}) => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    
    // Replace parameters like {name} with values
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
    
    return text;
  }, [language]);
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
```

---

## Step 3: Add Provider to Layout

Update `web/src/app/layout.js`:

```jsx
import { I18nProvider } from '@/lib/i18n/context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

---

## Step 4: Create Language Switcher Component

Create file `web/src/components/LanguageSwitcher.jsx`:

```jsx
'use client';

import { Globe } from 'lucide-react';
import { Button } from './ui/button';
import { useI18n } from '@/lib/i18n/context';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sw' : 'en');
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="w-4 h-4" />
      <span>{language === 'en' ? 'SW' : 'EN'}</span>
    </Button>
  );
}
```

---

## Step 5: Update Components to Use Translations

Update the encounter form to use translations:

```jsx
'use client';

import { useI18n } from '@/lib/i18n/context';

export default function EncounterForm() {
  const { t } = useI18n();
  
  // Get localized symptom options
  const SYMPTOM_OPTIONS = [
    { key: 'fever', label: t('symptom_fever') },
    { key: 'cough', label: t('symptom_cough') },
    { key: 'diarrhea', label: t('symptom_diarrhea') },
    { key: 'vomiting', label: t('symptom_vomiting') },
    // ... more symptoms
  ];
  
  return (
    <div>
      <h1>{t('triage_title')}</h1>
      
      <div>
        <label>{t('age')} ({t('age_years')})</label>
        <input placeholder={t('age')} />
      </div>
      
      <div>
        <label>{t('sex')}</label>
        <label><input type="radio" /> {t('sex_male')}</label>
        <label><input type="radio" /> {t('sex_female')}</label>
      </div>
      
      <button>{t('next')}</button>
    </div>
  );
}
```

---

## Step 6: Add Swahili Detection to API

Update `api/src/services/swahili.js`:

### Copilot Prompt

```
@workspace Create a Swahili language service with:
- detectSwahili(text) - Check if text contains Swahili
- translateToEnglish(text) - Translate Swahili medical terms to English
- translateToSwahili(text) - Translate English medical terms to Swahili
- Common medical term dictionary
```

### Expected Code

```javascript
// Swahili medical terms dictionary
const MEDICAL_TERMS = {
  // Symptoms
  'homa': 'fever',
  'kikohozi': 'cough',
  'kuharisha': 'diarrhea',
  'kutapika': 'vomiting',
  'maumivu ya kichwa': 'headache',
  'upele': 'rash',
  'udhaifu': 'weakness',
  
  // Body parts
  'kichwa': 'head',
  'tumbo': 'stomach',
  'kifua': 'chest',
  'mgongo': 'back',
  'miguu': 'legs',
  'mikono': 'arms',
  
  // Conditions
  'malaria': 'malaria',
  'nimonia': 'pneumonia',
  'kuhara': 'diarrhea',
  'degedege': 'convulsions',
  
  // Actions
  'hospitali': 'hospital',
  'dawa': 'medicine',
  'chanjo': 'vaccine',
  'maji': 'water/fluids',
};

// Common Swahili patterns
const SWAHILI_PATTERNS = [
  /\bana\b/i,      // has
  /\bkwa\b/i,      // for/with
  /\bna\b/i,       // and/with
  /\bya\b/i,       // of
  /\bni\b/i,       // is
  /\bhana\b/i,     // doesn't have
  /\bsiku\b/i,     // days
  /\bmtoto\b/i,    // child
  /\bmama\b/i,     // mother
  /\bmzee\b/i,     // elder
];

// Detect if text is likely Swahili
function detectSwahili(text) {
  const lower = text.toLowerCase();
  
  // Check for medical terms
  const hasMedicalTerms = Object.keys(MEDICAL_TERMS).some(term => 
    lower.includes(term)
  );
  
  // Check for Swahili patterns
  const hasPatterns = SWAHILI_PATTERNS.some(pattern => 
    pattern.test(lower)
  );
  
  // Check for specific Swahili words
  const swahiliWords = ['mtoto', 'mama', 'baba', 'siku', 'mwezi', 'mwaka', 'dawa', 'hospitali'];
  const hasSwahiliWords = swahiliWords.some(word => lower.includes(word));
  
  return hasMedicalTerms || hasPatterns || hasSwahiliWords;
}

// Translate Swahili medical terms to English
function translateToEnglish(text) {
  let result = text;
  
  // Sort by length (longer first) to avoid partial matches
  const sortedTerms = Object.entries(MEDICAL_TERMS)
    .sort((a, b) => b[0].length - a[0].length);
  
  sortedTerms.forEach(([swahili, english]) => {
    const regex = new RegExp(swahili, 'gi');
    result = result.replace(regex, english);
  });
  
  return result;
}

// Translate English medical terms to Swahili
function translateToSwahili(text) {
  let result = text;
  
  // Reverse the dictionary
  const reversed = Object.entries(MEDICAL_TERMS)
    .map(([sw, en]) => [en, sw])
    .sort((a, b) => b[0].length - a[0].length);
  
  reversed.forEach(([english, swahili]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    result = result.replace(regex, swahili);
  });
  
  return result;
}

module.exports = {
  detectSwahili,
  translateToEnglish,
  translateToSwahili,
  MEDICAL_TERMS,
};
```

---

## Step 7: Add Language Handling to Chat

Update `api/src/routes/chat.js`:

```javascript
const { detectSwahili, translateToEnglish, translateToSwahili } = require('../services/swahili');

router.post('/', async (req, res) => {
  const { message, history = [], preferredLanguage } = req.body;
  
  // Detect if message is in Swahili
  const isSwahili = preferredLanguage === 'sw' || detectSwahili(message);
  
  // Translate to English for processing
  const processedMessage = isSwahili ? translateToEnglish(message) : message;
  
  // ... generate response ...
  
  // If user prefers Swahili, translate response
  let finalResponse = result.text;
  if (isSwahili) {
    finalResponse = translateToSwahili(result.text);
  }
  
  res.json({
    message: finalResponse,
    originalLanguage: isSwahili ? 'sw' : 'en',
    // ...
  });
});
```

---

## Validation Checklist

- [ ] Language switcher toggles between EN/SW
- [ ] UI labels change when language switches
- [ ] Preference persists across page refresh
- [ ] Chat detects Swahili input
- [ ] Medical terms translate correctly
- [ ] Form labels are all translated

---

## What You Learned

- How to implement i18n in React
- How to use React Context for global state
- How to detect language from text
- How to handle bilingual AI responses
- How to persist language preferences

---

## Next Step

**Proceed to Lesson 12:** UI Polish

You'll add animations and make the app feel professional.

---

*The app speaks Swahili. Make it beautiful. →*
