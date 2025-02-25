<template>
  <div :class="['chat-editor', isMessageDisabled ? 'disable-editor' : '']">
    <div class="chat-input-container">
      <div class="input-content">
        <svg-icon
          style="display: flex"
          @tap="togglePopover"
          :icon="EmojiIcon"
          :class="['emoji-icon', { 'disable-emoji': isMessageDisabled }]"
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
      <span @tap="sendMessage" class="send">{{ t('Send') }}</span>
    </div>
    <emoji
      v-if="isEmojiToolbarVisible"
      class="chat-emoji"
      @choose-emoji="handleChooseEmoji"
    />
  </div>
</template>

<script setup lang="ts">
import emoji from '../EditorTools/index.vue';
import useChatEditor from './useChatEditor';
import SvgIcon from '../../common/base/SvgIcon.vue';
import EmojiIcon from '../../../assets/icons/EmojiIcon.svg';
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

.emoji-icon {
  width: 20px;
  height: 20px;
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
