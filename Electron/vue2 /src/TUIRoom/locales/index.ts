import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { createI18n, useI18n } from 'vue-i18n-bridge';
import { getLanguage } from '../utils/common';
import ZH from './zh-CN';
import EN from './en-US';

// 参考文档：https://vue-i18n.intlify.dev/guide/migration/vue2.html#vue-i18n-bridge
Vue.use(VueI18n, { bridge: true });

export default createI18n({
  legacy: false,
  locale: getLanguage() || 'zh-CN',
  messages: {
    'zh-CN': ZH,
    'en-US': EN,
  },
}, VueI18n);

export { useI18n };

