import { computed, ref } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { ElMessage } from '../../elementComp';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isElectronEnv } from '../../utils/utils';

export default function useRoomInvite() {
  const { t } = useI18n();

  const roomLinkDisplay = ref(true);

  const basicStore = useBasicStore();
  const { roomId } = storeToRefs(basicStore);

  const { origin, pathname } = location;
  const isElectron = isElectronEnv();

  let inviteLink = computed(() => `${origin}${pathname}#/home?roomId=${roomId.value}`);

  // todo: schema 唤起
  const schemeLink = computed(() => `tuiroom://joinroom?roomId=${roomId.value}`);

  function onCopy(value: string | number) {
    navigator.clipboard.writeText(`${value}`);
    ElMessage({
      message: t('Copied successfully'),
      type: 'success',
    });
  }
  return {
    t,
    roomLinkDisplay,
    roomId,
    origin,
    pathname,
    isElectron,
    inviteLink,
    schemeLink,
    onCopy,
  };
}
