import { roomService, LanguageOption } from '../../services';
const languageMap = {
  zh: 'zh-CN',
  en: 'en-US',
};
export const setLanguage = (language: 'zh' | 'en') => {
  const currentLanguage = languageMap[language] as LanguageOption;
  if (!currentLanguage) return;
  roomService.setLanguage(currentLanguage);
};
