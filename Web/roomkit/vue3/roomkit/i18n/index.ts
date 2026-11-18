import { i18n } from '../base';
import { resource as enUS } from './locales/en-US/index';
import { resource as zhCN } from './locales/zh-CN/index';
import { resource as educationEnUS } from './locales/en-US/education';
import { resource as educationZhCN } from './locales/zh-CN/education';

/** Every key the base pack translates. */
export type TranslationKey = keyof typeof enUS;

// deep + overwrite: merge into whatever the host already added, letting the built-in copy win.
i18n.addResourceBundle('zh-CN', 'translation', zhCN, true, true);
i18n.addResourceBundle('en-US', 'translation', enUS, true, true);

// Registered up front, not with the lazy scene chunk: exit notices read them after the view is gone.
i18n.addResourceBundle('zh-CN', 'education', educationZhCN, true, true);
i18n.addResourceBundle('en-US', 'education', educationEnUS, true, true);
