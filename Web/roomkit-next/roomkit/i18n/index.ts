import {
  addResourceBundle,
  i18n,
  setLanguage,
  t,
  useI18n,
} from '../base/i18n';
import type { Language } from '../base/i18n';
import { resource as enUS } from './locales/en-US/index';
import { resource as zhCN } from './locales/zh-CN/index';

addResourceBundle('zh-CN', zhCN);
addResourceBundle('en-US', enUS);

export {
  addResourceBundle,
  i18n,
  setLanguage,
  t,
  useI18n,
};
export type { Language };
