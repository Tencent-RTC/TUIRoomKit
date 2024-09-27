import i18n from '../../locales';
import { IRoomService, EventType } from '../types';

interface IConfigManager {
  setTheme(theme: Theme): void;
  setLanguage(language: LanguageOption): void;
}

export type LanguageOption = 'zh-CN' | 'en-US';
export type Theme = 'white' | 'black';
const THEME = {
  LIGHT: 'white',
  DARK: 'black',
};

export class ConfigManager implements IConfigManager {
  private service: IRoomService;

  constructor(service: IRoomService) {
    this.service = service;
  }

  public setTheme(theme: Theme) {
    const isDarkTheme = theme === THEME.DARK;
    document.body.classList.toggle(`tui-theme-${THEME.DARK}`, isDarkTheme);
    document.body.classList.toggle(`tui-theme-${THEME.LIGHT}`, !isDarkTheme);
    this.service.basicStore.setDefaultTheme(
      isDarkTheme ? THEME.DARK : THEME.LIGHT
    );
    this.service.emit(
      EventType.THEME_CHANGED,
      isDarkTheme ? THEME.DARK : THEME.LIGHT
    );
  }

  public setLanguage(language: LanguageOption) {
    i18n.global.locale.value = language;
    this.service.basicStore.setLang(language);
    this.service.emit(EventType.LANGUAGE_CHANGED, language);
  }
}
