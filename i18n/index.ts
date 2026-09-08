/**
 * i18n configuration with TypeScript type safety.
 *
 * Types are inferred from pt.json (source of truth). This enables
 * autocomplete in t('...') calls and compile-time errors for missing keys.
 *
 * Language resolution order:
 *   1. Saved preference in SQLite (user manually chose a language)
 *   2. Device locale from expo-localization (auto-detect on first install)
 *   3. Fallback to 'pt'
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next, useTranslation as useI18NextTranslation } from 'react-i18next';

import { kv } from '../services/sqliteKv';
import pt from './pt.json';
import en from './en.json';

// ── Persistence ─────────────────────────────────────────────────────
const STORAGE_KEY = 'combo-forge:language';

/**
 * Determine the initial language:
 *   1. User explicitly chose one → SQLite has it → use it.
 *   2. First launch → detect from device locale.
 *      - Device language is Portuguese (pt-BR, pt-PT, etc.) → 'pt'
 *      - Anything else → 'en'
 */
function resolveInitialLanguage(): string {
  // 1. Saved preference
  try {
    const saved = kv?.getItemSync(STORAGE_KEY);
    if (saved === 'en' || saved === 'pt') return saved;
  } catch { /* ignore */ }

  // 2. Device locale
  try {
    const deviceLocale = getLocales()[0]?.languageCode ?? '';
    if (deviceLocale === 'pt') return 'pt';
  } catch { /* ignore */ }

  // 3. Default
  return 'en';
}

function persistLanguage(lng: string): void {
  try {
    kv?.setItemSync(STORAGE_KEY, lng);
  } catch { /* ignore */ }
}

// ── Type-safe translation function ──────────────────────────────────
type TranslationKeys = typeof pt;

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: TranslationKeys;
    };
  }
}

// ── Init i18next ────────────────────────────────────────────────────
// i18n.use() é o método de instância padrão do i18next (não a named export
// `use`); é assim que toda a documentação oficial encadeia .use().init().
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: 'pt',
  ns: ['translation'],
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false,
  },
});

// Persist language on every change.
i18n.on('languageChanged', (lng) => {
  persistLanguage(lng);
});

/**
 * Drop-in replacement for useTranslation with full type safety.
 * Usage: const { t } = useTranslation();
 *        t('start.tagline')  // autocompleted + type-checked
 */
export function useTranslation(ns?: string | string[]) {
  return useI18NextTranslation(ns);
}

export default i18n;
