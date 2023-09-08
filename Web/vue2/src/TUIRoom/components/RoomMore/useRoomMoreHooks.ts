import { ElMessage } from '../../elementComp';
import { useI18n } from '../../locales';

export default function useRoomMoreHooks() {
  const { t } = useI18n();

  const groupNumber = '592465424';
  const email = 'matthewwu@tencent.com';

  function onCopy(value: string | number) {
    navigator.clipboard.writeText(`${value}`);
    ElMessage({
      message: t('Copied successfully'),
      type: 'success',
    });
  }
  return {
    t,
    groupNumber,
    email,
    onCopy,
  };
}
