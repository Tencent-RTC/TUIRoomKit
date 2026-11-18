import i18next from 'i18next';
import type { i18n as I18nInstance } from 'i18next';
import { useCallback, useSyncExternalStore } from 'react';

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
  // React escapes rendered text; escaping here too would show names like `A&B` as `A&amp;B`.
  interpolation: { escapeValue: false },
  // Resources are added in code, so init finishes synchronously.
  initImmediate: false,
});

function subscribeLanguage(listener: () => void): () => void {
  i18n.on('languageChanged', listener);
  return () => {
    i18n.off('languageChanged', listener);
  };
}

function getLanguage(): Language {
  return i18n.language;
}

type TFunction = (key: string, params?: Record<string, unknown>) => string;

/** Base wording in the current language. Components call `useI18n` so they re-render on a switch. */
export const t: TFunction = (key, params) => i18n.t(key, params) as string;

/**
 * Subscribes the calling component to language changes.
 * With a `namespace`, `t` reads that namespace first and the base wording second.
 */
export function useI18n(namespace?: string) {
  const language = useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
  const namespacedT = useCallback<TFunction>(
    (key, params) => i18n.getFixedT(language, namespace ?? null)(key, params) as string,
    [language, namespace],
  );
  return {
    t: namespace ? namespacedT : t,
    language,
  };
}
