<template>
  <div :class="['chat-editor', { disable: isMessageDisabled }]">
    <div class="input-content">
      <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji" />
      <input
        ref="editorInputEle"
        v-model="sendMsg"
        type="text"
        :disabled="isMessageDisabled"
        class="content-bottom-input"
        :placeholder="
          isMessageDisabled ? t('Muted by the moderator') : t('Type a message')
        "
        enterkeyhint="send"
        @keyup.enter="sendMessage"
      />
    </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  padding-bottom: 5px;

  .input-content {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 90%;
    height: 34px;
    font-family: 'PingFang SC';
    font-size: 16px;
    font-style: normal;
    font-weight: 450;
    line-height: 4vh;
    color: #676c80;
    caret-color: var(--caret-color);
    resize: none;
    background: var(--chat-editor-input-color-h5);
    border: none;
    border-radius: 8px;

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
      color: #676c80;
      caret-color: var(--caret-color);
      resize: none;
      background: var(--chat-editor-input-color-h5);
      border: none;
      border-radius: 8px;

      ::placeholder {
        font-family: 'PingFang SC';
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 18px;
        color: #676c80;
      }

      &:focus-visible {
        outline: none;
      }
    }
  }

  &.disable {
    .chat-emoji {
      pointer-events: none;
    }
  }
}
</style>
