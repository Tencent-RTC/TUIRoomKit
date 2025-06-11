<template>
  <div :class="['chat-editor', isMessageDisabled ? 'disable-editor' : '']">
    <div class="chat-input-container">
      <div class="input-content">
        <IconEmoji
          v-tap="togglePopover"
          size="20"
          :class="{ 'disable-emoji': isMessageDisabled }"
        />
        <input
          ref="editorInputEle"
          v-model="sendMsg"
          type="text"
          :disabled="isMessageDisabled"
          class="content-bottom-input"
          :placeholder="
            isMessageDisabled
              ? t('Muted by the moderator')
              : t('Type a message')
          "
          enterkeyhint="send"
          @keyup.enter="sendMessage"
        />
      </div>
      <span v-tap="sendMessage" class="send">{{ t('Send') }}</span>
    </div>
    <emoji
      v-if="isEmojiToolbarVisible"
      class="chat-emoji"
      @choose-emoji="handleChooseEmoji"
    />
  </div>
</template>

<script setup lang="ts">
import { IconEmoji } from '@tencentcloud/uikit-base-component-vue3';
import emoji from '../EditorTools';
import useChatEditor from './useChatEditor';
import vTap from '../../../directives/vTap';
const {
  t,
  editorInputEle,
  sendMsg,
  isEmojiToolbarVisible,
  isMessageDisabled,
  sendMessage,
  handleChooseEmoji,
  togglePopover,
} = useChatEditor();
</script>

<style lang="scss" scoped>
.chat-editor {
  .input-content {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
    font-family: 'PingFang SC';
    font-size: 16px;
    font-style: normal;
    font-weight: 450;
    line-height: 4vh;
    resize: none;
    border-radius: 8px;
    background-color: var(--bg-color-input);
    color: var(--text-color-secondary);

    .chat-emoji {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .content-bottom-input {
      box-sizing: border-box;
      width: 84%;
      height: 34px;
      padding-left: 10px;
      font-family: 'PingFang SC';
      font-size: 16px;
      font-style: normal;
      font-weight: 450;
      line-height: 4vh;
      resize: none;
      border: none;
      border-radius: 8px;
      background-color: var(--bg-color-input);
      color: var(--text-color-secondary);

      ::placeholder {
        font-family: 'PingFang SC';
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
        color: var(--text-color-secondary);
      }

      &:focus-visible {
        outline: none;
      }
    }
  }
}

.chat-input-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  padding: 5px 0;
  background-color: var(--bg-color-operate);
}

.disable-emoji {
  pointer-events: none;
}

.chat-emoji {
  width: 100vw;
  height: 200px;
}

.send {
  padding-left: 10px;
}
</style>
