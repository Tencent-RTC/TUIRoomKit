import { computed } from 'vue';
import TUIMessage from '../common/base/Message/index';
import { useI18n } from '../../locales';
import { clipBoard } from '../../utils/utils';
import i18n from '../../locales/index';

export default function useRoomMoreHooks() {
  const { t } = useI18n();

  const groupNumber = '770645461';
  const email = 'chaooliang@tencent.com';

  async function onCopy(value: string | number) {
    try {
      await clipBoard(value);
      TUIMessage({
        message: t('Copied successfully'),
        type: 'success',
      });
    } catch (error) {
      TUIMessage({
        message: t('Copied failure'),
        type: 'error',
      });
    }
  }

  const isZH = computed(() => i18n.global.locale.value === 'zh-CN');

  const contactContentList = [
    { id: 1, title: 'group chat', content: groupNumber, copyLink: groupNumber },
    { id: 2, title: 'Email', content: email, copyLink: email },
  ];

  const handleClick = () => {
    window.open('https://zhiliao.qq.com/s/c5GY7HIM62CK', '_blank');
  };

  return {
    t,
    onCopy,
    contactContentList,
    email,
    handleClick,
    isZH,
  };
}
