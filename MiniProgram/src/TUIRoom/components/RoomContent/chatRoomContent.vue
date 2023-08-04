<template>
  <div class="stream-list-chat">
    <div class="message-list">
      <div v-for="item in messageList" :key="item.ID" ref="messageAimId" class="message-item">
        <div class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}{{ `:` }}
          <div class="message-body">
            <message-text v-if="item.type === 'TIMTextElem'" :data="item.payload.text" />
          </div>
        </div>
      </div>
    </div>
    <div ref="messageBottomEl" class="message-bottom" />
    <div v-if="!cannotSendMessage" class="chat-bottom-input">
      <emoji class="chat-emoji" @choose-emoji="handleChooseEmoji"></emoji>
      <input
        ref="editorInputEle"
        v-model="sendMsg"
        type="text"
        :disabled="cannotSendMessage"
        class="chat-input"
        :placeholder="cannotSendMessage ? t('Muted by the moderator') : t('Type a message')"
        enterkeyhint="send"
        @keyup.enter="sendMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import emoji from '../Chat/EditorTools/emojiContentH5.vue';
import useChatEditor from '../Chat/ChatEditor/useChatEditor';
import MessageList from '../Chat/MessageList';
import MessageText from '../Chat/MessageTypes/MessageText.vue';
const { t, editorInputEle, sendMsg, cannotSendMessage, sendMessage, handleChooseEmoji } = useChatEditor();
const { messageAimId, messageBottomEl, messageList } = MessageList();
</script>

<style lang="scss" scoped>
.stream-list-chat {
  height: 132px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 3%;
  top: 67%;
  bottom: 30%;
  overflow: hidden;
  .message-item {
    word-break: break-all;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 4px;
    border-radius: 4px;
    &:last-of-type {
      margin-bottom: 0;
    }
    .message-header {
      max-width: 330px;
      white-space: nowrap;
      text-overflow: ellipsis;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 14px;
      color: #ff7200;
      padding: 4px 8px 4px 8px;
      border-radius: 4px;
      margin-left: 5px;
      background: rgba(13, 16, 21, 0.7);
      display: flex;
      .message-body {
        font-weight: 500;
        font-size: 14px;
        color: #ffffff;
        padding-left: 6px;
        white-space: normal;
      }
    }
  }
  .chat-bottom-input {
    display: flex;
    align-items: center;
    .chat-emoji {
      display: flex;
    }
    .chat-input {
      width: 100px;
      height: 30px;
      background: rgba(13, 16, 21, 0.5);
      border-radius: 8px;
      border: none;
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 17px;
      color: #cfd4e6;
    }
    ::placeholder {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 12px;
      line-height: 17px;
      color: #cfd4e6;
    }
    input:focus {
      outline: none;
    }
  }
}
</style>
