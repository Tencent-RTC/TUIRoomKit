<template>
  <div class="message-list-container-wx">
    <scroll-view class="message-list" scroll-y="true" :scroll-top="scrollTop">
      <div
        v-for="item in messageList"
        :key="item.ID"
        ref="messageAimId"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}
        </div>
        <div class="message-body">
          <message-text v-if="item.type === 'TIMTextElem'" :data="item.payload.text" />
        </div>
      </div>
    </scroll-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MessageText from '../MessageTypes/MessageText.vue';
import useMessageList from '../useMessageListHook';
import { useChatStore } from '../../../stores/chat';
const chatStore = useChatStore();
const {
  messageAimId,
  getMessageList,
  messageList,
} = useMessageList();
const scrollTop = ref(5000);


onMounted(async () => {
  const { currentMessageList, isCompleted, nextReqMessageId } = await getMessageList();
  const filterCurrentMessageList = currentMessageList.filter((item: any) => item.type === 'TIMTextElem');
  chatStore.setMessageListInfo(filterCurrentMessageList, isCompleted, nextReqMessageId);
  scrollTop.value += 300;
});
</script>

  <style lang="scss" scoped>

  .message-list-container-wx {
    background-color: var(--message-list-color-h5);
    height: 100%;
    width: 100%;
    overflow: scroll;

    &::-webkit-scrollbar {
      display: none;
    }
    .message-top {
      display: flex;
      justify-content: center;
    }
    .message-list {
      overflow-y: scroll;
      height: 100%;
      padding: 5px 0;
    .message-item {
      padding: 0 20px;
      margin-bottom: 20px;
      word-break: break-all;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      &:last-of-type {
        margin-bottom: 0;
      }
      &.is-me {
        align-items: flex-end;
        .message-body {
          background-color: #4791FF;
          min-width: 24px;
          border-radius: 8px;
          display: inline-block;
          padding: 7px;
          font-weight: 400;
          font-size: 14px;
          color: #FFFFFF;
        }
      }
      .message-header {
        margin-bottom: 10px;
        max-width: 180px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        font-family: 'PingFang SC';
        font-style: normal;
        font-weight: 500;
        font-size: 10px;
        color: #ff7200;
        line-height: 14px;
        margin-bottom: 10px;
        max-width: 180px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .message-body {
        background-color: #817e7e;
        display: inline-block;
        padding: 7px;
        font-weight: 400;
        font-size: 14px;
        color: #FFFFFF;
        border-radius: 8px;
      }
    }
  }
    .message-bottom {
      width: 0;
      height: 0;
    }
  }
  </style>

