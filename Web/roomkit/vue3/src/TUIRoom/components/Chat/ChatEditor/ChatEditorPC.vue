<template>
  <div :class="['chat-editor', { disable: isMessageDisabled }]">
    <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji" />
    <textarea
      ref="editorInputEle"
      v-model="sendMsg"
      :disabled="isMessageDisabled"
      class="content-bottom-input"
      :placeholder="
        isMessageDisabled ? t('Muted by the moderator') : t('Type a message')
      "
      @keyup.enter="sendMessage"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools';
import useChatEditor from './useChatEditor';
const {
  t,
  editorInputEle,
  sendMsg,
  isMessageDisabled,
  sendMessage,
  handleChooseEmoji,
} = useChatEditor();
</script>

<style lang="scss" scoped>
.chat-editor {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 150px;
  padding: 12px 16px;
  margin-top: 20px;
  border: 1px solid var(--stroke-color-module);
  border-radius: 8px;

  .chat-emoji {
    display: flex;
  }

  .content-bottom-input {
    box-sizing: border-box;
    height: 100%;
    padding: 0;
    margin-top: 8px;
    font-family: 'PingFang SC';
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-primary);
    resize: none;
    background: var(--bg-color-input);
    border: none;

    &:focus-visible {
      outline: none;
    }

    &::placeholder {
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: var(--uikit-color-gray-5);
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &.disable {
    background-color: var(--text-color-button-disable);

    .chat-emoji {
      color: var(--uikit-color-gray-7);
      pointer-events: none;
    }

    .content-bottom-input {
      &:disabled {
        background-color: var(--text-color-button-disable);
      }
    }
  }
}
</style>
