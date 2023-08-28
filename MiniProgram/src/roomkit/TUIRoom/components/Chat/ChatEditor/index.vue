<template>
  <div :class="['chat-editor', cannotSendMessage ? 'disable-editor' : '']">
    <div class="chat-input-container">
      <div class="input-content">
        <svg-icon @tap="togglePopover" class="emoji-icon" icon-name="emoji-h5" size="medium" />
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
      <span @tap="sendMessage" class="send">{{ t('Send') }}</span>
    </div>
    <emoji v-if="isEmojiToolbarVisible" class="chat-emoji" @choose-emoji="handleChooseEmoji"></emoji>
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools/index.vue';
import useChatEditor from './useChatEditor';
import SvgIcon from '../../common/SvgIcon.vue';
const {
  t,
  editorInputEle,
  sendMsg,
  isEmojiToolbarVisible,
  cannotSendMessage,
  sendMessage,
  handleChooseEmoji,
  togglePopover,
} = useChatEditor();

</script>

  <style lang="scss" scoped>
  @import '../../../assets/style/var.scss';

    .chat-editor {
      .input-content {
        display: flex;
        width: 80%;
        align-items: center;
        justify-content: center;
        color: #676c80;
        background: var(--chat-editor-input-color-h5);
        box-sizing: border-box;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 450;
        font-size: 16px;
        line-height: 4vh;
        caret-color: var(--caret-color);
        border-radius: 8px;
        resize: none;
        border: 1px solid aliceblue;
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
    }
    .chat-input-container{
      width: 100vw;
      display: flex;
      justify-content: center;
      align-items: center;
      background: white;
      padding-top: 5px;
    }
    .emoji-icon{
      width: 20px;
      height: 20px;
    }
    .chat-emoji{
      width: 100vw;
      height: 200px;
    }
    .send{
      padding-left: 10px;
    }
  </style>

