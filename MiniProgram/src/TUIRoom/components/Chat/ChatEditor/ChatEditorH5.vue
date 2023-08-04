<template>
  <div :class="['chat-editor', cannotSendMessage ? 'disable-editor' : '']">
    <div class="chat-editor-toolbar">
      <div class="left-section">
        <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji"></emoji>
        <input
          ref="editorInputEle"
          v-model="sendMsg"
          type="text"
          :disabled="cannotSendMessage"
          class="content-bottom-input"
          :placeholder="cannotSendMessage ? t('Muted by the moderator') : t('Type a message')"
          enterkeyhint="send"
          @keyup.enter="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools/emoji.vue';
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
@import '../../../assets/style/var.scss';

  .chat-editor {
    height: 11vh;
    width: 100%;
    background: var(--chat-editor-bg-color-h5);
    box-sizing: border-box;
    .chat-editor-toolbar {
      height: 6vh;
      padding: 0 14px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
    .left-section {
      padding-top: 6vh;
      position: relative;
      .chat-emoji {
        position: absolute;
        left: 4vw;
        bottom: 0;
      }
    }
    input {
      color: #676c80;
      width: 90vw;
      height: 4vh;
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
      padding-left: 10vw;
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
</style>
