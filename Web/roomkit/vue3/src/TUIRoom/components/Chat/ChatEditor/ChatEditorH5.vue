<template>
  <div :class="['chat-editor', { 'disable': isMessageDisabled }]">
    <div class="input-content">
      <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji"></emoji>
      <input
        ref="editorInputEle"
        v-model="sendMsg"
        type="text"
        :disabled="isMessageDisabled"
        class="content-bottom-input"
        :placeholder="isMessageDisabled ? t('Muted by the moderator') : t('Type a message')"
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
    width: 100vw;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 5px;
    .input-content {
      display: flex;
      width: 90%;
      align-items: center;
      justify-content: center;
      color: #676c80;
      height: 34px;
      background: var(--chat-editor-input-color-h5);
      border: none;
      box-sizing: border-box;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 450;
      font-size: 16px;
      line-height: 4vh;
      caret-color: var(--caret-color);
      border-radius: 8px;
      resize: none;
      .chat-emoji {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    .content-bottom-input {
        color: #676c80;
        width: 84%;
        height: 34px;
        background: var(--chat-editor-input-color-h5);
        border: none;
        box-sizing: border-box;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 450;
        font-size: 16px;
        line-height: 4vh;
        caret-color: var(--caret-color);
        border-radius: 8px;
        resize: none;
        padding-left: 10px;
        ::placeholder {
          font-family: 'PingFang SC';
          font-style: normal;
          font-weight: 400;
          font-size: 16px;
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
