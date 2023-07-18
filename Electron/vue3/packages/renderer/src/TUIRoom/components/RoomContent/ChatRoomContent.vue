<template>
  <div class="stream-list-chat">
    <div class="message-list">
      <div v-for="item in lastThreeMessage" :key="item.ID" ref="messageAimId" class="message-item">
        <div class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}{{ `:` }}
          <div class="message-body">
            <message-text v-if="item.type === 'TIMTextElem'" :data="item.payload.text" />
          </div>
        </div>
      </div>
    </div>
    <div ref="messageBottomEl" class="message-bottom">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import emoji from '../Chat/EditorTools/emojiContentH5.vue';
import useChatEditor from '../Chat/ChatEditor/useChatEditor';
import MessageList from '../Chat/useMessageListHook';
import MessageText from '../Chat/MessageTypes/MessageText.vue';
const { t, editorInputEle, sendMsg, cannotSendMessage, sendMessage, handleChooseEmoji } = useChatEditor();
const { messageAimId, messageBottomEl, messageList } = MessageList();
const lastThreeMessage = computed(() => messageList.value.slice(-3));
</script>

<style lang="scss" scoped>
.stream-list-chat {
  height: 139px;
  background-color: transparent;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 3%;
  top: 67%;
  bottom: 30%;
.message-list {
  height: 15vh;
  margin-bottom: 10px;
  overflow: hidden;
   &::-webkit-scrollbar {
    display: none;
  }
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
  .message-bottom {
    width: 0;
    height: 0;
  }
  }
  .chat-bottom-input {
    display: flex;
    align-items: center;
    position: relative;
    .chat-emoji {
      display: flex;
      position: absolute;
      padding-left: 6px;
    }
    .chat-input {
      width: 130px;
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
      padding-left: 31px;
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
