import { ref } from 'vue';

export type Language = string;

const DEFAULT_LANGUAGE = 'en-US';

const resources: Record<string, Record<string, string>> = {};

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

/** Reactive so UI layers re-render when the language changes. */
const currentLanguage = ref<Language>(getBrowserLanguage());

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
  const table = resources[currentLanguage.value];
  const template = table?.[key] ?? resources[DEFAULT_LANGUAGE]?.[key] ?? key;
  return interpolate(template, params);
}

export function setLanguage(language: Language): void {
  currentLanguage.value = language;
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

export function useI18n() {
  return {
    language: currentLanguage,
    t,
    setLanguage,
    addTranslations,
  };
}

export const i18n = {
  get language(): Language {
    return currentLanguage.value;
  },

  setLanguage,
  changeLanguage: setLanguage,
  addTranslations,
};
