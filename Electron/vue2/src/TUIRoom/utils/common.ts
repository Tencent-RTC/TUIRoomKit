import { getUrlParam } from './utils';

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

export function checkNumber(roomId: string) {
  const reg = /^\d+$/;
  return reg.test(roomId);
}
