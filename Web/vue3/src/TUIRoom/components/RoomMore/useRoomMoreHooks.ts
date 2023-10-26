import { ElMessage } from '../../elementComp';
import { useI18n } from '../../locales';
import { clipBoard } from '../../utils/utils';

export default function useRoomMoreHooks() {
  const { t } = useI18n();

  const groupNumber = '770645461';
  const email = 'xinlxinli@tencent.com';

  async function onCopy(value: string | number) {
    try {
      await clipBoard(value);
      ElMessage({
        message: t('Copied successfully'),
        type: 'success',
      });
    } catch (error) {
      ElMessage({
        message: t('Copied failure'),
        type: 'error',
      });
    }
  }

  const contactContentList = [
    { id: 1, title: 'group chat', content: groupNumber, copyLink: groupNumber },
    { id: 2, title: 'Email', content: email, copyLink: email },
  ];

  return {
    t,
    contactContentList,
    onCopy,
  };
}
