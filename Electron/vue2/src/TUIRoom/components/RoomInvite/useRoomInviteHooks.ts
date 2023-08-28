import { computed } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { ElMessage } from '../../elementComp';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isElectronEnv, clipBoard } from '../../utils/utils';

export default function useRoomInvite() {
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const { roomId, shareLink, isRoomLinkVisible } = storeToRefs(basicStore);

  const { origin, pathname } = location || {};
  const isElectron = isElectronEnv();

  const inviteLink = computed(() => {
    if (shareLink.value) {
      const urlConcatenation = shareLink.value.indexOf('?') !== -1 ? '&' : '?';
      return `${shareLink.value}${urlConcatenation}roomId=${roomId.value}`;
    }
    return `${origin}${pathname}#/home?roomId=${roomId.value}`;
  });
  const schemeLink = computed(() => `tuiroom://joinroom?roomId=${roomId.value}`);

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
    isRoomLinkVisible,
    roomId,
    origin,
    pathname,
    isElectron,
    inviteLink,
    schemeLink,
    onCopy,
  };
}
