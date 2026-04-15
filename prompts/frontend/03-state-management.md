# Prompt: React Context State Management

## Description
Create React Context patterns for global state management with TypeScript-like patterns and performance optimization.

---

## The Prompt

```
Create a React Context pattern for [STATE TYPE] that:
1. Provides context with Provider component
2. Exports custom useContext hook with error boundary
3. Supports actions/mutations for state updates
4. Persists to localStorage when appropriate  
5. Handles async operations
6. Optimizes re-renders with useMemo/useCallback
7. Includes TypeScript-like documentation

Create examples for: Language (i18n), Theme, and User Preferences.
```

---

## Expected Output

### Generic Context Factory
```jsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Create a context with provider and hook
 * @param {string} name - Context name for error messages
 * @param {*} defaultValue - Default context value
 */
export function createSafeContext(name, defaultValue = null) {
  const Context = createContext(defaultValue);
  
  function useContextSafe() {
    const context = useContext(Context);
    if (context === null) {
      throw new Error(`use${name} must be used within a ${name}Provider`);
    }
    return context;
  }
  
  return [Context.Provider, useContextSafe, Context];
}
```

### Language Context (i18n)
```jsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

// Translations
const translations = {
  en: {
    welcome: 'Welcome',
    chat: 'Chat',
    encounter: 'New Encounter',
    stock: 'Stock',
    settings: 'Settings',
    send: 'Send',
    loading: 'Loading...',
  },
  sw: {
    welcome: 'Karibu',
    chat: 'Mazungumzo',
    encounter: 'Mkutano Mpya',
    stock: 'Hifadhi',
    settings: 'Mipangilio',
    send: 'Tuma',
    loading: 'Inapakia...',
  }
};

const I18nContext = createContext(null);

export function I18nProvider({ children, defaultLang = 'en' }) {
  const [lang, setLang] = useState(defaultLang);
  
  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('afyapack-lang');
    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);
  
  // Persist language changes
  const changeLang = useCallback((newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('afyapack-lang', newLang);
    }
  }, []);
  
  // Translation function
  const t = useCallback((key, fallback) => {
    return translations[lang]?.[key] || fallback || key;
  }, [lang]);
  
  // Memoize context value
  const value = useMemo(() => ({
    lang,
    setLang: changeLang,
    t,
    isSwahili: lang === 'sw',
    isEnglish: lang === 'en',
    availableLanguages: Object.keys(translations)
  }), [lang, changeLang, t]);
  
  return (
    <I18nContext.Provider value={value}>
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

### Theme Context
```jsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('theme');
    
    if (saved) {
      setTheme(saved);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);
  
  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggle = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  const value = useMemo(() => ({
    theme,
    setTheme,
    toggle,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }), [theme, toggle]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### User Preferences Context
```jsx
'use client';

import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'afyapack-preferences';

const defaultPreferences = {
  fontSize: 'medium',
  voiceEnabled: true,
  notifications: true,
  autoSave: true
};

function preferencesReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.key]: action.value };
    case 'RESET':
      return defaultPreferences;
    case 'LOAD':
      return { ...defaultPreferences, ...action.payload };
    default:
      return state;
  }
}

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [preferences, dispatch] = useReducer(preferencesReducer, defaultPreferences);
  
  // Load from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
      }
    } catch (e) {
      console.warn('Failed to load preferences');
    }
  }, []);
  
  // Save to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);
  
  const value = useMemo(() => ({
    ...preferences,
    set: (key, value) => dispatch({ type: 'SET', key, value }),
    reset: () => dispatch({ type: 'RESET' })
  }), [preferences]);
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
}
```

---

## Combining Providers

```jsx
// app/providers.jsx
'use client';

import { I18nProvider } from '@/lib/i18n/context';
import { ThemeProvider } from '@/lib/theme/context';
import { PreferencesProvider } from '@/lib/preferences/context';

export function Providers({ children }) {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <I18nProvider>
          {children}
        </I18nProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
}

// app/layout.js
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Performance Tips

1. **Memoize context value** to prevent unnecessary re-renders
2. **Split contexts** - separate frequently changing state from stable state
3. **Use selectors** - create hooks that select specific pieces of state
4. **Avoid putting everything in context** - local state is often better
