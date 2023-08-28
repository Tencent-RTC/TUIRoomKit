import { createI18n, useI18n } from 'vue-i18n';        // 引入vue-i18n组件
import ZH from './zh-CN';
import EN from './en-US';

// 注册i8n实例并引入语言文件
const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  messages: {
    'zh-CN': ZH,
    'en-US': EN,
  },
});

export default i18n;

export { useI18n };
