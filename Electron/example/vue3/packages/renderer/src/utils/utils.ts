
/**
 * Gets the value of the specified key from window.location.href.
 * @param {*} key The key to get
 * @returns The value corresponding to the key specified in window.location.href.
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
 * Get Language
 * @returns language
 */
export function getLanguage() {
  let language = getUrlParam('lang') || navigator.language || 'zh';
  language = language.replace(/_/, '-').toLowerCase();

  if (language === 'zh-cn' || language === 'zh') {
    language = 'zh-CN';
  } else if (language === 'en' || language === 'en-us' || language === 'en-GB') {
    language = 'en-US';
  }
  return language;
}
