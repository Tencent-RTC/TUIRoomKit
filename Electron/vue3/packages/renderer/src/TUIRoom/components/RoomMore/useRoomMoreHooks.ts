import { ElMessage } from '../../elementComp';
import { useI18n } from '../../locales';
import { clipBoard } from '../../utils/utils';

export default function useRoomMoreHooks() {
  const { t } = useI18n();

  const groupNumber = '592465424';
  const email = 'matthewwu@tencent.com';

  async function  onCopy(value: string | number) {
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
  return {
    t,
    groupNumber,
    email,
    onCopy,
  };
}
