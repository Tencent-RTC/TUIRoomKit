import { TencentCloudChat } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { computed, onUnmounted, watch } from 'vue';
import { useRoomStore } from '../../stores/room';
import { isMobile } from '../../utils/environment';

export default function useSideBar() {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { sdkAppId, isSidebarOpen, sidebarName, roomId } =
    storeToRefs(basicStore);
  const roomStore = useRoomStore();
  const { userNumber } = storeToRefs(roomStore);

  const showSideBar = computed(
    () => isSidebarOpen.value && sidebarName.value !== 'transfer-leave'
  );
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
      case 'aiTranscription':
        sidebarTitle = `${t('AI real-time conference content')}`;
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

  /** Monitor message reception, placed here to only record unread messages before opening chat */
  const onReceiveMessage = (options: { data: any }) => {
    let messageTypeList = [TencentCloudChat.TYPES.MSG_TEXT];
    // todo Remove this logic when chat is released
    if (!isMobile || basicStore.scene !== 'chat') {
      messageTypeList = messageTypeList.concat([
        TencentCloudChat.TYPES.MSG_IMAGE,
        TencentCloudChat.TYPES.MSG_FILE,
        TencentCloudChat.TYPES.MSG_FACE,
        TencentCloudChat.TYPES.MSG_VIDEO,
      ]);
    }

    if (!options || !options.data) {
      return;
    }

    const currentConversationId = `GROUP${roomId.value}`;
    const isChatSidebarOpen =
      basicStore.isSidebarOpen && basicStore.sidebarName === 'chat';

    options.data.forEach((message: any) => {
      if (message.conversationID !== currentConversationId) return;

      const shouldUpdateUnreadCount =
        messageTypeList.includes(message.type) && !isChatSidebarOpen;

      if (shouldUpdateUnreadCount) {
        // eslint-disable-next-line no-plusplus
        chatStore.updateUnReadCount(++chatStore.unReadCount);
      }
    });
  };

  let tim = roomEngine.instance?.getTIM();
  tim?.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);

  watch(sdkAppId, () => {
    if (!tim && sdkAppId.value) {
      tim = TencentCloudChat.create({ SDKAppID: basicStore.sdkAppId });
      tim?.on(TencentCloudChat.EVENT.MESSAGE_RECEIVED, onReceiveMessage);
    }
  });

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
  };
}
