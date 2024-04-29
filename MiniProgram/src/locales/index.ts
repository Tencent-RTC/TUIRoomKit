/**
 * i18n 使用说明：
 *
 * <script>
 * import i18n, { useI18n } from '../locale';
 * const { t } = useI18n();
 *
 * // case 1: 翻译文本中没有变量
 * t('happy');
 * i18n.t('happy');
 * // case 2: 翻译文本中存在变量
 * t('kick sb. out of room', { someOneName: 'xiaoming' });
 * i18n.t('kick sb. out of room', { someOneName: 'xiaoming' });
 * </script>
 *
 * // 切换语言
 * switch (i18n.global.locale.value) {
 *  case 'en-US':
 *    i18n.global.locale.value = 'zh-CN';
 *    break;
 *  case 'zh-CN':
 *    i18n.global.locale.value = 'en-US';
 *    break;
 * }
 * </script>
 */

import ZH from './zh-CN';
import EN from './en-US';
import { ref } from 'vue';

const locale = ref('');
class TUIKitI18n {
  messages: Record<string, any>;
  global: Record<string, any>;

  constructor(options: { messages: Record<string, any>, locale: string }) {
    this.messages = options.messages;
    locale.value = options.locale;
    this.global = {};
    this.global.locale = locale;
    this.global.t = this.t.bind(this);
  }

  private getNamed(option: Record<string, any>) {
    return (key: string) => option[key] || key;
  }

  private t(key: any, option?: Record<string, any>) {
    const message = this.messages[locale.value];
    if (!message[key]) {
      return key;
    }
    if (typeof message[key] === 'function') {
      const named = this.getNamed(option || {});
      return message[key]({ named });
    }
    return message[key];
  }

  // 兼容 App.use 不报错
  public install() {
  }
}

const i18n = new TUIKitI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': ZH,
    'en-US': EN,
  },
});

export default i18n;

export function useI18n() {
  return {
    t: i18n.global.t.bind(i18n),
  };
}
