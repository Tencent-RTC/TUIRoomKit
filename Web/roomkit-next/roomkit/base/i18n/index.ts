import { ref } from 'vue';

export type Language = string;

const DEFAULT_LANGUAGE = 'zh-CN';

const resources: Record<string, Record<string, string>> = {};

/** Reactive so UI layers re-render when the language changes. */
const currentLanguage = ref<Language>(DEFAULT_LANGUAGE);

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

export function addResourceBundle(
  lng: Language,
  translation: Record<string, string>,
  overwrite = true,
): void {
  if (!resources[lng]) {
    resources[lng] = {};
  }
  const table = resources[lng];
  if (overwrite) {
    Object.assign(table, translation);
    return;
  }
  Object.entries(translation).forEach(([key, value]) => {
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
    addResourceBundle,
  };
}

export const i18n = {
  get language(): Language {
    return currentLanguage.value;
  },

  setLanguage,
  changeLanguage: setLanguage,
  addResourceBundle,
};
