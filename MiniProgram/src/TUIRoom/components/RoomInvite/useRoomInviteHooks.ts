import { computed, ref } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { ElMessage } from '../../elementComp';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isElectronEnv, clipBoard } from '../../utils/utils';
import { isWeChat } from '../../utils/useMediaValue';

export default function useRoomInvite() {
  const { t } = useI18n();

  const roomLinkDisplay = ref(true);

  const basicStore = useBasicStore();
  const { roomId } = storeToRefs(basicStore);

  const { origin, pathname } = location || {};
  const isElectron = isElectronEnv();

  let inviteLink = computed(() => `${origin}${pathname}#/home?roomId=${roomId.value}`);
  if (isElectron) {
    inviteLink = computed(() => `https://web.sdk.qcloud.com/trtc/webrtc/test/xinli-test/tuiroom-wasm/index.html#home?roomId=${roomId.value}`);
  }
  if (isWeChat) {
    inviteLink = computed(() => 'https://web.sdk.qcloud.com/trtc/webrtc/test/xinli-test/tuiroom-vue2/index.html');
  }
  // todo: schema 唤起
  const schemeLink = computed(() => `tuiroom://joinroom?roomId=${roomId.value}`);

  async function onCopy(value: string | number) {
    const { code } = await clipBoard(value);
    ElMessage({
      message: code === 0 ? t('Copied successfully') : t('Copied fail'),
      type: code === 0 ? 'success' : 'error',
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
