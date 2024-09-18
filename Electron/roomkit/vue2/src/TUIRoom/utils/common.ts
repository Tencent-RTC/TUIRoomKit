import { getUrlParam } from './utils';

const THEME = {
  LIGHT: 'white',
  DARK: 'black',
};

type ThemeOption = 'LIGHT' | 'DARK';

/**
 * Get Language
 * @returns language
 */
export function getLanguage() {
  const isWxMiniProgram = typeof wx !== 'undefined' && wx.getSystemInfoSync;

  let language =
    getUrlParam('lang') ||
    localStorage.getItem('tuiRoom-language') ||
    navigator.language ||
    (isWxMiniProgram ? 'zh-CN' : 'en-US');
  language = language.replace(/_/, '-').toLowerCase();
  const isZh = language.startsWith('zh');
  language = isZh ? 'zh-CN' : 'en-US';

  return language;
}

/**
 * Determine if a string is a number
 * @returns boolean
 */
export function checkNumber(roomId: string) {
  const reg = /^\d+$/;
  return reg.test(roomId);
}

export function toTargetTheme(themeOption: ThemeOption) {
  const theme = themeOption === 'DARK' ? THEME.DARK : THEME.LIGHT;
  return theme;
}
