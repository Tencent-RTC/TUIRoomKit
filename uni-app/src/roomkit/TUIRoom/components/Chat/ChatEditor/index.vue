<template>
  <div :class="['chat-editor', cannotSendMessage ? 'disable-editor' : '']">
    <div class="chat-input-container">
      <div class="input-content">
        <div style="display: flex;background-size: cover; padding-left: 10px;" @click="togglePopover">
          <svg-icon size="20" icon="EmojiIcon"></svg-icon>
        </div>
        <input
          ref="editorInputEle" v-model="sendMsg" type="text" :disabled="cannotSendMessage"
          class="content-bottom-input"
          :placeholder="cannotSendMessage ? t('Muted by the moderator') : t('Type a message')" confirm-type="send"
          @confirm="sendMessage"
        />
      </div>
      <span class="send" @tap="sendMessage">{{ t('Send') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, defineEmits } from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { storeToRefs } from 'pinia';
import TUIMessage from '../../common/base/Message/index';
import TencentCloudChat from '@tencentcloud/chat';
import { useChatStore } from '../../../stores/chat';
import { useRoomStore } from '../../../stores/room';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { decodeSendTextMsg } from '../util';
import { roomService } from '../../../services/roomService';

const { t } = useI18n();
const basicStore = useBasicStore();
const chatStore = useChatStore();
const roomStore = useRoomStore();

const { roomId } = storeToRefs(basicStore);
const { isMessageDisableByAdmin } = storeToRefs(chatStore);
const { isMessageDisableForAllUser } = storeToRefs(roomStore);
const editorInputEle = ref();
const sendMsg = ref('');
const isEmojiToolbarVisible = ref(false);
const emit = defineEmits([
  'on-show-emoji',
]);

watch([isMessageDisableByAdmin, isMessageDisableForAllUser], ([adminFlag, globalFlag]) => {
  if (adminFlag || globalFlag) {
    sendMsg.value = '';
  }
});

const cannotSendMessage = computed(() => isMessageDisableByAdmin.value || isMessageDisableForAllUser.value);
const sendMessage = async () => {
  const result = decodeSendTextMsg(sendMsg.value);
  if (result === '') {
    return;
  }
  sendMsg.value = '';
  handleShowEmoji(false);
  try {
    const message = roomService.tim.createTextMessage({
      to: roomId.value,
      conversationType: TencentCloudChat.TYPES.CONV_GROUP,
      payload: {
        text: result,
      },
    });
    await roomService.tim.sendMessage(message);
    uni.hideKeyboard();
    chatStore.updateMessageList({
      ID: Math.random().toString(),
      type: 'TIMTextElem',
      payload: {
        text: result,
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
    TUIMessage({ type: 'error', message: t('Failed to send the message') });
  }
};

const handleChooseEmoji = (emojiName: string) => {
  sendMsg.value += emojiName;
  editorInputEle.value.focus();
};

defineExpose({
  handleChooseEmoji,
});


const togglePopover = () => {
  if (cannotSendMessage.value) return;
  isEmojiToolbarVisible.value = !isEmojiToolbarVisible.value;
  handleShowEmoji(isEmojiToolbarVisible.value);
};

const handleShowEmoji = (visible: boolean) => {
  emit('on-show-emoji', visible);
};

</script>
<style lang="scss" scoped>
.chat-editor {
  height: 140rpx;
  width: 750rpx;

  .chat-input-container {
    height: 140rpx;
    width: 750rpx;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: absolute;
    bottom: 0;
    left: 0;
    background: white;
  }

  .input-content {
    display: block;
    height: 80rpx;
    flex: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    color: #676c80;
    background: #dfdcdc;
    box-sizing: border-box;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 450;
    font-size: 16px;
    line-height: 4vh;
    border-radius: 8px;
    resize: none;

    .content-bottom-input {
      width: 600rpx;
      display: flex;
      align-items: center;
      margin-left: 10px;

      ::placeholder {
        width: 20px;
        padding-left: 10px;
      }

      &:focus-visible {
        outline: none;
      }
    }
  }
}

.emoji-icon {
  width: 20px;
  height: 20px;
}

.disable-emoji {
  pointer-events: none;
}

.send {
  padding-right: 5px;
}
</style>
