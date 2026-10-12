import { reactive } from 'vue';
import type { IconOverrides } from './icons/names';

export type ThemeName = 'light' | 'dark';

export interface UIConfig {
  theme?: ThemeName;
  icons?: IconOverrides;
}

const THEME_STORAGE_KEY = 'tuiRoom-theme';

function readStoredTheme(): ThemeName {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

export const uiConfig: UIConfig = reactive({
  theme: readStoredTheme(),
  icons: {} as IconOverrides,
});

export function setUIConfig(options: UIConfig): void {
  if (options.theme !== undefined) {
    uiConfig.theme = options.theme;
    localStorage.setItem(THEME_STORAGE_KEY, options.theme);
  }
  if (options.icons !== undefined) {
    uiConfig.icons = { ...uiConfig.icons, ...options.icons };
  }
}

export function useUIConfig() {
  return { uiConfig, setUIConfig };
}
