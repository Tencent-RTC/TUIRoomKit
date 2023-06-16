import TUIRoomEngine, { TUIRoomEvents } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useChatStore } from '../../stores/chat';
import { storeToRefs } from 'pinia';
import { useBasicStore } from '../../stores/basic';
import { useI18n } from '../../locales';
import { computed, onUnmounted, ref } from 'vue';

export default function useSideBar() {
  const roomEngine = useGetRoomEngine();
  const { t } = useI18n();

  const chatStore = useChatStore();
  const basicStore = useBasicStore();
  const { isSidebarOpen, sidebarName } = storeToRefs(basicStore);
  const title = computed((): string => {
    let sidebarTitle = '';
    switch (sidebarName.value) {
      case 'chat':
        sidebarTitle = 'Chat';
        break;
      case 'invite':
        sidebarTitle = 'Invite';
        break;
      case 'more':
        sidebarTitle = 'More';
        break;
      case 'manage-member':
        sidebarTitle = 'Member management';
        break;
      case 'transfer-leave':
        sidebarTitle = 'Appoint a new host';
        break;
      default:
        break;
    }
    return t(sidebarTitle);
  });

  function handleClose(done: any) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    done();
  }

  /** 监听消息接收，放在这里是为了打开 chat 之前只记录消息未读数 */
  const onReceiveTextMessage = (data: { roomId: string, message: any }) => {
    console.warn('onReceiveTextMessage:', data);
    if (!basicStore.isSidebarOpen || basicStore.sidebarName !== 'chat') {
      // eslint-disable-next-line no-plusplus
      chatStore.updateUnReadCount(++chatStore.unReadCount);
    }
  };


  TUIRoomEngine.once('ready', () => {
    roomEngine.instance?.on(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
  });

  onUnmounted(() => {
    roomEngine.instance?.off(TUIRoomEvents.onReceiveTextMessage, onReceiveTextMessage);
  });
  return {
    t,
    isSidebarOpen,
    title,
    sidebarName,
    handleClose }
  ;
}

