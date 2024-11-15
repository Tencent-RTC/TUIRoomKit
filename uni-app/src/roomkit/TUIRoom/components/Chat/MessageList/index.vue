<template>
  <div class="message-list-container-wx">
    <scroll-view
      id="messageScrollList" ref="messageListRef" class="message-list" scroll-y="true"
      style="padding-bottom: 80px;" :scroll-into-view="targetJumpMessage" scroll-with-animation="true"
      lower-threshold="50" upper-threshold="50" @scrolltoupper="handleScrolltoupper" @scrolltolower="handleScrolltolower"
    >
      <div
        v-for="(item, index) in messageList" :id="'ID' + '-' + item.ID" :key="item.ID"
        :class="['message-item', `${'out' === item.flow ? 'is-me' : ''}`]"
      >
        <div v-if="getDisplaySenderName(index)" class="message-header" :title="item.nick || item.from">
          {{ item.nick || item.from }}
        </div>
        <div class="message-body">
          <message-text :data="item.payload.text" />
        </div>
      </div>
    </scroll-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import MessageText from '../MessageTypes/MessageText.vue';
import useMessageList from './useMessageListHook';

const {
  setMessageListInfo,
  messageList,
  getDisplaySenderName,
  targetJumpMessage,
  handleScrolltoupper,
  handleScrolltolower,
} = useMessageList();


onMounted(async () => {
  setMessageListInfo();
});
</script>

<style lang="scss" scoped>
.message-list-container-wx {
  background-color: #d4d4d4;
  width: 750rpx;
  height: 1300rpx;
  padding-bottom: 30px;
  overflow: scroll;

  &::-webkit-scrollbar {
    display: none;
  }

  .message-top {
    display: flex;
    justify-content: center;
  }

  .load-more {
    height: 30px;
    width: 200px;
    display: flex;
    align-self: center;
    justify-content: center;
    align-items: center;
  }

  .load-more-text {
    display: block;
    justify-content: center;
    font-size: 14px;
    line-height: 20px;
    font-weight: 400;
  }

  .message-list {
    overflow-y: scroll;
    height: 1440rpx;
    white-space: nowrap;

    .message-item {
      padding: 0 20px;
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
          display: flex;
          flex-direction: row;
          max-width: 270px;
          flex-wrap: wrap;
        }
      }

      .message-header {
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
        margin-top: 10px;
        display: flex;
        flex-direction: row;
        max-width: 270px;
        flex-wrap: wrap;
      }
    }
  }
}
</style>
