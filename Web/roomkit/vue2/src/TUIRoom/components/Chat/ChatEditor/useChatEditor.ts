import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message/index';

import { TencentCloudChat } from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useChatStore } from '../../../stores/chat';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { decodeSendTextMsg } from '../util';
export default function useChatEditor() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();
  const basicStore = useBasicStore();
  const chatStore = useChatStore();
  const roomStore = useRoomStore();

  const { roomId } = storeToRefs(basicStore);
  const { isMessageDisabled } = storeToRefs(chatStore);
  const editorInputEle = ref();
  const sendMsg = ref('');
  const isEmojiToolbarVisible = ref(false);
  watch(isMessageDisabled, value => {
    if (value) {
      sendMsg.value = '';
    }
  });
  const sendMessage = async () => {
    const result = decodeSendTextMsg(sendMsg.value);
    if (result === '') {
      return;
    }
    sendMsg.value = '';
    isEmojiToolbarVisible.value = false;
    try {
      const tim = roomEngine.instance?.getTIM();
      if (!tim) {
        throw new Error('tim is null');
      }
      const message = tim.createTextMessage({
        to: roomId.value,
        conversationType: TencentCloudChat.TYPES.CONV_GROUP,
        payload: {
          text: result,
        },
      });
      await tim.sendMessage(message);
      chatStore.updateMessageList({
        ID: Math.random().toString(),
        type: 'TIMTextElem',
        payload: {
          text: result,
        },
        nick:
          roomStore.localUser.nameCard ||
          roomStore.localUser.userName ||
          roomStore.localUser.userId,
        from: roomStore.localUser.userId,
        flow: 'out',
        sequence: Math.random(),
      });
    } catch (e) {
      /**
       * Message delivery failure
       **/
      TUIMessage({ type: 'error', message: t('Failed to send the message') });
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
    isMessageDisabled,
    sendMessage,
    handleChooseEmoji,
    isEmojiToolbarVisible,
    togglePopover,
  };
}
