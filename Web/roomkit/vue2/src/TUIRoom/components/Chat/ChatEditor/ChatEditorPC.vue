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
.tui-theme-white textarea {
  --input-border-color: var(--background-color-10);
  --chat-editor-color: var(--background-color-8);
}

.tui-theme-black textarea {
  --input-border-color: rgba(213, 224, 242, 0.2);
  --chat-editor-color: var(--background-color-2);
}

.chat-editor {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 150px;
  padding: 12px 16px;
  margin-top: 20px;
  border: 1px solid var(--input-border-color);
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
    color: var(--textarea-color);
    caret-color: var(--caret-color);
    resize: none;
    background: var(--chat-editor-color);
    border: none;

    &:focus-visible {
      outline: none;
    }

    &::placeholder {
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: rgba(143, 154, 178, 0.7);
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
