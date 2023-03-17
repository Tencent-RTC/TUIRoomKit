import { getUrlParam } from './utils';

/**
 * 获取语言
 * @returns language
 */
export function getLanguage() {
  let language = getUrlParam('lang') || localStorage.getItem('tuiRoom-language') || navigator.language || 'zh';
  language = language.replace(/_/, '-').toLowerCase();

  if (language === 'zh-cn' || language === 'zh') {
    language = 'zh-CN';
  } else if (language === 'en' || language === 'en-us' || language === 'en-GB') {
    language = 'en-US';
  }
  return language;
}

/**
 * 判断字符串是否是数字
 * @returns boolean
 */
export function checkNumber(roomId: string) {
  const reg = /^\d+$/;
  return reg.test(roomId);
}
