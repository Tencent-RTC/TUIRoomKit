import { getUrlParam } from './utils';

/**
 * Get Language
 * @returns language
 */
export function getLanguage() {
  let language = getUrlParam('lang') || uni.getStorageSync('tuiRoom-language') || navigator?.language || 'zh';
  language = language.replace(/_/, '-').toLowerCase();

  if (language === 'zh-cn' || language === 'zh') {
    language = 'zh-CN';
  } else if (language === 'en' || language === 'en-us' || language === 'en-GB') {
    language = 'en-US';
  }
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
