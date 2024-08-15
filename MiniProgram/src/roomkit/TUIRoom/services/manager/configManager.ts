import i18n from '../../locales';
import { IRoomService } from '../types';

interface IConfigManager {
  setTheme(theme: ThemeOption): void;
  setLanguage(language: LanguageOption): void;
}

export type LanguageOption = 'zh-CN' | 'en-US';
export type ThemeOption = 'LIGHT' | 'DARK';

const THEME = {
  LIGHT: 'tui-theme-white',
  DARK: 'tui-theme-black',
};

export class ConfigManager implements IConfigManager {
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
  }

  public setTheme(theme: ThemeOption) {
    const isDarkTheme = theme === 'DARK';
    document?.body.classList.toggle(THEME.DARK, isDarkTheme);
    document?.body.classList.toggle(THEME.LIGHT, !isDarkTheme);
    uni.setStorageSync('tuiRoom-currentTheme', isDarkTheme ? THEME.DARK : THEME.LIGHT);
  }

  public setLanguage(language: LanguageOption): void {
    i18n.global.locale.value = language;
    this.service.basicStore.setLang(language);
    uni.setStorageSync('tuiRoom-language', language);
  }
}


