import { TencentCloudChat } from '@tencentcloud/tuiroom-engine-wx';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { computed, onUnmounted, watch } from 'vue';
import { useRoomStore } from '../../stores/room';

export default function useSideBar() {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { sdkAppId, isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const roomStore = useRoomStore();
  const { userNumber } = storeToRefs(roomStore);

  const showSideBar = computed(() => isSidebarOpen.value && sidebarName.value !== 'transfer-leave');
  const title = computed((): string => {
    let sidebarTitle = '';
    switch (sidebarName.value) {
      case 'chat':
        sidebarTitle = t('Chat');
        break;
      case 'invite':
        sidebarTitle = t('Invite');
        break;
      case 'more':
        sidebarTitle = t('More');
        break;
      case 'apply':
        sidebarTitle = t('Members applying on stage');
        break;
      case 'manage-member':
        sidebarTitle = `${t('Members')} (${userNumber.value})`;
        break;
      default:
        break;
    }
    return sidebarTitle;
  });

  function handleClose(done: any) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    done();
  }

  /** 监听消息接收，放在这里是为了打开 chat 之前只记录消息未读数 */
  const onReceiveMessage = (options: { data: any }) => {
    if (!options || !options.data) {
      return;
    }
    options.data.forEach((message: any) => {
      if (message.type === TencentCloudChat.TYPES.MSG_TEXT) {
        if (!basicStore.isSidebarOpen || basicStore.sidebarName !== 'chat') {
          // eslint-disable-next-line no-plusplus
          chatStore.updateUnReadCount(++chatStore.unReadCount);
        }
      }
    });
  };

  let tim = roomEngine.instance?.getTIM();

  watch(sdkAppId, () => {
    if (!tim) {
      tim = TencentCloudChat.create({ SDKAppID: basicStore.sdkAppId });
    }
    tim?.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  }, { immediate: true });

  onUnmounted(() => {
    tim?.off(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
  });

  return {
    t,
    isSidebarOpen,
    title,
    sidebarName,
    handleClose,
    showSideBar,
  }
  ;
}

