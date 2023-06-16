<template>
  <div
    :class="['chat-editor', cannotSendMessage ? 'disable-editor': '']"
  >
    <textarea
      ref="editorInputEle"
      v-model="sendMsg"
      class="content-bottom-input"
      :disabled="cannotSendMessage"
      :placeholder="cannotSendMessage ? t('Muted by the moderator') : t('Type a message')"
      @keyup.enter="sendMessage"
    />
    <div v-if="!cannotSendMessage" class="chat-editor-toolbar">
      <div class="left-section">
        <emoji @choose-emoji="handleChooseEmoji"></emoji>
      </div>
      <div :class="['send-btn', `${sendMsg.length > 0 ? 'active' : ''}`]" @click="sendMessage">{{ t('Send') }}</div>
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
    height: 188px;
    background: var(--chat-editor-bg-color);
    box-sizing: border-box;
    &.disable-editor {
      textarea {
      }
    }
    textarea {
      height: 138px;
      color: var(--textarea-color);
      width: 100%;
      background: var(--chat-editor-bg-color);
      border: none;
      box-sizing: border-box;
      padding: 12px 14px;
      caret-color: var(--caret-color);
      resize: none;
      &:focus-visible {
        outline: none;
      }
    }
    .send-btn {
      padding: 6px 18px;
      background: var(--send-btn-color);
      border-radius: 2px;
      font-size: 14px;
      color: var(--send-btn);
      &:hover {
        cursor: pointer;
        background: $primaryHighLightColor;
        color: $whiteColor;
      }
      &.active {
        background: $primaryHighLightColor;
        color: $whiteColor;
      }
    }
    .chat-editor-toolbar {
      height: 44px;
      padding: 0 14px 12px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
</style>
