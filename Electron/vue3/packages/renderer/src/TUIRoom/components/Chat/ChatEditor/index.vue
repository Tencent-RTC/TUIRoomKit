<template>
  <div :class="['chat-editor', { 'disable': cannotSendMessage }]">
    <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji"></emoji>
    <textarea
      ref="editorInputEle"
      v-model="sendMsg"
      :disabled="cannotSendMessage"
      class="content-bottom-input"
      :placeholder="cannotSendMessage ? t('Muted by the moderator') : t('Type a message')"
      @keyup.enter="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools/index.vue';
import useChatEditor from './useChatEditor';
const {
  t,
  editorInputEle,
  sendMsg,
  cannotSendMessage,
  sendMessage,
  handleChooseEmoji,
} = useChatEditor();
</script>

<style lang="scss" scoped>
.tui-theme-white textarea {
  --input-border-color: var(--background-color-10);
  --chat-editor-color: var(--background-color-8);
}
.tui-theme-black textarea {
  --input-border-color: rgba(213, 224, 242, 0.2);
  --chat-editor-color: var(--background-color-2);
}

.chat-editor {
  width: 100%;
  height: 150px;
  box-sizing: border-box;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--input-border-color);
  border-radius: 8px;
  padding: 12px 16px;
  position: relative;
  .chat-emoji {
    display: flex;
  }
  .content-bottom-input {
    height: 100%;
    border: none;
    background: var(--chat-editor-color);
    color: var(--textarea-color);
    box-sizing: border-box;
    caret-color: var(--caret-color);
    resize: none;
    padding: 0;
    margin-top: 8px;
    font-family: 'PingFang SC';
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    &:focus-visible {
      outline: none;
    }
    &::placeholder {
      color: rgba(143, 154, 178, 0.7);
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
    }
    &::-webkit-scrollbar {
      display: none;
    }
  }
  &.disable {
    background-color: var(--disable-color);
    .chat-emoji {
      color: #8f9ab2;
      pointer-events: none;
    }
    .content-bottom-input {
      &:disabled {
        background-color: var(--disable-color);
      }
    }
  }
}
</style>
