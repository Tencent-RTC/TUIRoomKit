/**
 * Get the value of the specified key from window.location.href
 * @param {*} key key to get
 * @returns Get the value of the specified key from window.location.href
 * @example
 * const value = getUrlParam(key);
 */
export function getUrlParam(key: string) {
  const url = window?.location.href.replace(/^[^?]*\?/, '');
  const regexp = new RegExp(`(^|&)${key}=([^&#]*)(&|$|)`, 'i');
  const paramMatch = url?.match(regexp);

  return paramMatch ? paramMatch[2] : null;
}

/**
 * Get language
 * @returns language
 */
export function getLanguage() {
  let language = getUrlParam('lang')
    || localStorage.getItem('tuiRoom-language')
    || navigator.language
    || 'en-US';
  language = language.replace(/_/, '-').toLowerCase();
  const isZh = language.startsWith('zh');
  language = isZh ? 'zh-CN' : 'en-US';

  return language;
}

/**
 * Get Theme
 * @returns Theme
 */
export function getTheme() {
  let storedTheme = localStorage.getItem('tuiRoom-currentTheme') || 'LIGHT';

  if (storedTheme === 'light') {
    storedTheme = 'LIGHT';
  } else if (storedTheme === 'dark') {
    storedTheme = 'DARK';
  }

  return storedTheme;
}

export function setItemInSessionStorage(key: string, value: object) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function generateTempUserID(userId: string) {
  const timestamp = String(Date.now()).slice(-4);
  return `${userId}_${timestamp}`;
}

export function isValidTestUserId(userId: string) {
  const regex = /_([0-9]{4})$/;
  return regex.test(userId);
}
