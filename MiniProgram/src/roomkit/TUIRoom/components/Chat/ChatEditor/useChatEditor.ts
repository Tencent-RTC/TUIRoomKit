import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message/index';
import TUIMessageBox from '../../common/base/MessageBox/index';

import { TencentCloudChat } from '@tencentcloud/tuiroom-engine-wx';
import TIMUploadPlugin from 'tim-upload-plugin';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import { useChatStore } from '../../../stores/chat';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import {
  decodeSendTextMsg,
  formatFilePayload,
  formatImageInfoArray,
  MAX_FILE_SIZE,
  MESSAGE_TYPE,
} from '../util';
export default function useChatEditor() {
  const roomEngine = useGetRoomEngine();

  const { t } = useI18n();
  const basicStore = useBasicStore();
  const chatStore = useChatStore();
  const roomStore = useRoomStore();

  const { roomId } = storeToRefs(basicStore);
  const { isMessageDisabled, keyboardHeight } = storeToRefs(chatStore);
  const editorInputEle = ref();
  const sendMsg = ref('');
  const isEmojiToolbarVisible = ref(false);
  const isActionPanelVisible = ref(false);
  const hasSendContent = computed(() => sendMsg.value.trim().length > 0);

  /**
   * A panel and the keyboard occupy the same space at the bottom, so both are
   * driven by the keyboard height. That way they are swapped within a single
   * render, instead of one of them lagging a frame behind the other.
   **/
  const showEmojiPanel = computed(
    () => isEmojiToolbarVisible.value && keyboardHeight.value === 0
  );
  const showActionPanel = computed(
    () => isActionPanelVisible.value && keyboardHeight.value === 0
  );

  const closeToolPanels = () => {
    isEmojiToolbarVisible.value = false;
    isActionPanelVisible.value = false;
  };

  /**
   * Pushing the page up would move the sidebar header and the message list off
   * screen, so the editor reserves the keyboard height itself instead.
   **/
  const handleKeyboardHeightChange = (event: any) => {
    const height = event?.detail?.height || 0;
    chatStore.setKeyboardHeight(height);
    // Typing replaces the panel, which must not come back once the keyboard hides.
    if (height > 0) {
      closeToolPanels();
    }
  };

  const hideKeyboard = () => {
    if (keyboardHeight.value > 0) {
      uni.hideKeyboard();
    }
  };

  onBeforeUnmount(() => {
    chatStore.setKeyboardHeight(0);
  });

  watch(
    [isEmojiToolbarVisible, isActionPanelVisible],
    ([isEmojiOpen, isActionOpen]) => {
      chatStore.setToolPanelOpen(isEmojiOpen || isActionOpen);
    }
  );

  watch(
    () => chatStore.isToolPanelOpen,
    isOpen => {
      if (!isOpen) {
        closeToolPanels();
      }
    }
  );

  watch(isMessageDisabled, value => {
    if (value) {
      sendMsg.value = '';
      closeToolPanels();
    }
  });
  const getSenderName = () =>
    roomStore.localUser.nameCard ||
    roomStore.localUser.userName ||
    roomStore.localUser.userId;

  const getTim = () => {
    const tim = roomEngine.instance?.getTIM();
    if (!tim) {
      throw new Error('tim is null');
    }
    /**
     * Sending an image or file requires the upload plugin, which the room
     * engine does not register on its internal Chat instance.
     **/
    tim.registerPlugin({ 'tim-upload-plugin': TIMUploadPlugin });
    return tim;
  };

  const sendMessage = async () => {
    const result = decodeSendTextMsg(sendMsg.value);
    if (result === '') {
      return;
    }
    sendMsg.value = '';
    closeToolPanels();
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
        type: MESSAGE_TYPE.TEXT,
        payload: {
          text: result,
        },
        nick: getSenderName(),
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

  const sendImageMessage = async (chooseImageResult: Record<string, any>) => {
    const localImageUrl = chooseImageResult?.tempFilePaths?.[0];
    if (!localImageUrl) {
      return;
    }
    /**
     * Insert a local message first so the image shows up while uploading.
     **/
    const localMessageId = `local_image_${Math.random().toString()}`;
    chatStore.updateMessageList({
      ID: localMessageId,
      type: MESSAGE_TYPE.IMAGE,
      payload: {
        imageInfoArray: [{ imageUrl: localImageUrl }],
      },
      nick: getSenderName(),
      from: roomStore.localUser.userId,
      flow: 'out',
      sequence: Math.random(),
      progress: 0,
    });
    try {
      const tim = getTim();
      const message = tim.createImageMessage({
        to: roomId.value,
        conversationType: TencentCloudChat.TYPES.CONV_GROUP,
        payload: {
          file: chooseImageResult,
        },
        onProgress: (progress: number) => {
          chatStore.updateMessageItem(localMessageId, { progress });
        },
      });
      const imResponse = await tim.sendMessage(message);
      chatStore.updateMessageItem(localMessageId, {
        ID: imResponse.data.message.ID,
        payload: {
          imageInfoArray: formatImageInfoArray(
            imResponse.data.message.payload?.imageInfoArray
          ),
        },
        progress: 1,
      });
    } catch (e) {
      chatStore.removeMessage(localMessageId);
      TUIMessage({ type: 'error', message: t('Failed to send the image') });
    }
  };

  const chooseImage = () => {
    if (isMessageDisabled.value) {
      return;
    }
    closeToolPanels();
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res: any) => {
        sendImageMessage(res);
      },
    });
  };

  const sendFileMessage = async (chooseFileResult: Record<string, any>) => {
    const localFile = chooseFileResult?.tempFiles?.[0];
    if (!localFile?.path) {
      return;
    }
    if (localFile.size > MAX_FILE_SIZE) {
      TUIMessage({
        type: 'error',
        message: t('The file cannot exceed 100MB'),
      });
      return;
    }
    /**
     * Insert a local message first so the file shows up while uploading.
     **/
    const localMessageId = `local_file_${Math.random().toString()}`;
    chatStore.updateMessageList({
      ID: localMessageId,
      type: MESSAGE_TYPE.FILE,
      payload: {
        fileName: localFile.name,
        fileSize: localFile.size,
      },
      nick: getSenderName(),
      from: roomStore.localUser.userId,
      flow: 'out',
      sequence: Math.random(),
      progress: 0,
    });
    try {
      const tim = getTim();
      const message = tim.createFileMessage({
        to: roomId.value,
        conversationType: TencentCloudChat.TYPES.CONV_GROUP,
        payload: {
          file: chooseFileResult,
        },
        onProgress: (progress: number) => {
          chatStore.updateMessageItem(localMessageId, { progress });
        },
      });
      const imResponse = await tim.sendMessage(message);
      chatStore.updateMessageItem(localMessageId, {
        ID: imResponse.data.message.ID,
        payload: formatFilePayload(imResponse.data.message.payload),
        progress: 1,
      });
    } catch (e) {
      chatStore.removeMessage(localMessageId);
      TUIMessage({ type: 'error', message: t('Failed to send the file') });
    }
  };

  const openMessageFilePicker = () => {
    uni.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res: any) => {
        sendFileMessage(res);
      },
    });
  };

  /**
   * chooseMessageFile jumps straight into the WeChat chat list, which is
   * disorienting without warning. Explain where the user is going first.
   */
  const chooseFile = () => {
    if (isMessageDisabled.value) {
      return;
    }
    closeToolPanels();
    TUIMessageBox({
      title: t('Tips'),
      message: t('Files are selected from your WeChat chats'),
      confirmButtonText: t('Go (short)'),
      cancelButtonText: t('Cancel (short)'),
      callback: (res: { confirm?: boolean }) => {
        if (res?.confirm) {
          openMessageFilePicker();
        }
      },
    });
  };

  const handleChooseEmoji = (emojiName: string) => {
    sendMsg.value += emojiName;
  };

  const toggleEmojiPanel = () => {
    if (isMessageDisabled.value) {
      return;
    }
    const nextVisible = !isEmojiToolbarVisible.value;
    // The panel and the keyboard share the same space at the bottom.
    hideKeyboard();
    isActionPanelVisible.value = false;
    isEmojiToolbarVisible.value = nextVisible;
  };

  const toggleActionPanel = () => {
    if (isMessageDisabled.value) {
      return;
    }
    const nextVisible = !isActionPanelVisible.value;
    hideKeyboard();
    isEmojiToolbarVisible.value = false;
    isActionPanelVisible.value = nextVisible;
  };

  return {
    t,
    editorInputEle,
    sendMsg,
    hasSendContent,
    isMessageDisabled,
    keyboardHeight,
    handleKeyboardHeightChange,
    sendMessage,
    chooseImage,
    chooseFile,
    handleChooseEmoji,
    isEmojiToolbarVisible,
    isActionPanelVisible,
    showEmojiPanel,
    showActionPanel,
    toggleEmojiPanel,
    toggleActionPanel,
  };
}
