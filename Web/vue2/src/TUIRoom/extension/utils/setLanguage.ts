import i18n from '../../locales/index';
import { useBasicStore } from '../../stores/basic';
const languageMap = {
  zh: 'zh-CN',
  en: 'en-US',
};
export const setLanguage = (language: 'zh' | 'en') => {
  const currentLanguage = languageMap[language] as 'zh-CN' | 'en-US';
  if (!currentLanguage) return;
  const basicStore = useBasicStore();
  i18n.global.locale.value = currentLanguage;
  basicStore.setLang(currentLanguage);
  localStorage.setItem('tuiRoom-language', currentLanguage);
};
