import i18next from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { readonly, ref } from 'vue';

export type Language = string;

const DEFAULT_LANGUAGE = 'en-US';

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

/**
 * The RoomKit i18next instance, exposed as is: use the i18next API on it directly
 * (`changeLanguage`, `addResourceBundle`, `getFixedT`, ...).
 *
 * - Private, so a host app that also runs i18next keeps its own resources and language.
 * - Base wording lives in the default `translation` namespace; each scene rewords it in
 *   a namespace named after the scene and falls back to the base wording.
 */
// Annotated so the published typings reference i18next's own `i18n` type.
export const i18n: I18nInstance = i18next.createInstance();

i18n.init({
  lng: getBrowserLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  fallbackNS: 'translation',
  resources: {},
  // Keys are flat strings that may contain `.` and `:` (e.g. `Schedule.TZ.UTC+08:00`).
  keySeparator: false,
  nsSeparator: false,
  // Vue escapes rendered text; escaping here too would show names like `A&B` as `A&amp;B`.
  interpolation: { escapeValue: false },
  // Resources are added in code, so init finishes synchronously.
  initImmediate: false,
});

/** i18next is not reactive; this mirror lets templates re-render when the language changes. */
const language = ref<Language>(i18n.language);
i18n.on('languageChanged', (next: Language) => {
  language.value = next;
});

type TFunction = (key: string, params?: Record<string, unknown>) => string;

function createT(namespace?: string): TFunction {
  const fixedT = i18n.getFixedT(null, namespace ?? null);
  // Reading `language` ties the rendered string to it, so Vue re-renders on a switch.
  return (key, params) => fixedT(key, { ...params, lng: language.value }) as string;
}

/** Base wording, reactive to the language. */
export const t: TFunction = createT();

/** For components: `t` reads `namespace` first and the base wording second. */
export function useI18n(namespace?: string) {
  return {
    t: namespace ? createT(namespace) : t,
    language: readonly(language),
  };
}
