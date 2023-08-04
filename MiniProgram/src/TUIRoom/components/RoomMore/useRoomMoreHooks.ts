import { ElMessage } from '../../elementComp';
import { useI18n } from '../../locales';
import { isWeChat } from '../../utils/useMediaValue';
import { clipBoard }   from '../../utils/utils';
export default function useRoomMoreHooks() {
  const { t } = useI18n();

  const groupNumber = '592465424';
  const email = 'matthewwu@tencent.com';

  async function onCopy(value: string | number) {
    const { code } = await clipBoard(value);
    ElMessage({
      message: code === 0 ? t('Copied successfully') : t('Copied fail'),
      type: code === 0 ? 'success' : 'error',
    });
  }
  return {
    t,
    groupNumber,
    email,
    onCopy,
  };
}
