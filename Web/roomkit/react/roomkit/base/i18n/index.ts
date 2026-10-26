import { useSyncExternalStore } from 'react';

export type Language = string;

const DEFAULT_LANGUAGE = 'en-US';

const resources: Record<string, Record<string, string>> = {};

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

let currentLanguage: Language = getBrowserLanguage();
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLanguage(): Language {
  return currentLanguage;
}

function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : placeholder,
  );
}

/** Falls back to the default language, then to the key itself. */
export function t(key: string, params?: Record<string, unknown>): string {
  const table = resources[currentLanguage];
  const template = table?.[key] ?? resources[DEFAULT_LANGUAGE]?.[key] ?? key;
  return interpolate(template, params);
}

export function setLanguage(language: Language): void {
  if (currentLanguage === language) {
    return;
  }
  currentLanguage = language;
  listeners.forEach(listener => listener());
}

export function addTranslations(
  language: Language,
  translations: Record<string, string>,
  overwrite = true,
): void {
  if (!resources[language]) {
    resources[language] = {};
  }
  const table = resources[language];
  if (overwrite) {
    Object.assign(table, translations);
    return;
  }
  Object.entries(translations).forEach(([key, value]) => {
    if (!Object.prototype.hasOwnProperty.call(table, key)) {
      table[key] = value;
    }
  });
}

/**
 * Subscribes the calling component to language changes. Components that render
 * translated text must call this so they re-render when the language switches.
 */
export function useI18n() {
  const language = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  return {
    language,
    t,
    setLanguage,
    addTranslations,
  };
}

export const i18n = {
  get language(): Language {
    return currentLanguage;
  },

  setLanguage,
  changeLanguage: setLanguage,
  addTranslations,
  subscribe,
};
