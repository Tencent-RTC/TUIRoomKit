import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { ElMessage } from '../../../elementComp';

import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useChatStore } from '../../../stores/chat';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
export default function useChatEditor() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();
  const chatStore = useChatStore();
  const roomStore = useRoomStore();

  const { isMessageDisableByAdmin } = storeToRefs(chatStore);
  const { isMessageDisableForAllUser } = storeToRefs(roomStore);
  const editorInputEle = ref();
  const sendMsg = ref('');
  const isEmojiToolbarVisible = ref(false);
  watch(isMessageDisableByAdmin, (value) => {
    if (value) {
      sendMsg.value = '';
    }
  });

  watch(isMessageDisableForAllUser, (value) => {
    if (value) {
      sendMsg.value = '';
    }
  });
  const cannotSendMessage = computed(() => Boolean(isMessageDisableByAdmin.value || isMessageDisableForAllUser.value));
  const sendMessage = async () => {
    const msg = sendMsg.value.replace('\n', '');
    sendMsg.value = '';
    if (msg === '') {
      return;
    }
    isEmojiToolbarVisible.value = false;
    try {
      await roomEngine.instance?.sendTextMessage({
        messageText: msg,
      });
      chatStore.updateMessageList({
        ID: Math.random().toString(),
        type: 'TIMTextElem',
        payload: {
          text: msg,
        },
        nick: roomStore.localUser.userName || roomStore.localUser.userId,
        from: roomStore.localUser.userId,
        flow: 'out',
        sequence: Math.random(),
      });
    } catch (e) {
    /**
     * Message delivery failure
     *
     * 消息发送失败
    **/
      ElMessage.error(t('Failed to send the message'));
    }
  };

  const handleChooseEmoji = (emojiName: string) => {
    sendMsg.value += emojiName;
    editorInputEle.value.focus();
  };
  const togglePopover = () => {
    isEmojiToolbarVisible.value = !isEmojiToolbarVisible.value;
  };
  return {
    t,
    editorInputEle,
    sendMsg,
    isMessageDisableByAdmin,
    cannotSendMessage,
    sendMessage,
    handleChooseEmoji,
    isEmojiToolbarVisible,
    togglePopover,
  };
}
