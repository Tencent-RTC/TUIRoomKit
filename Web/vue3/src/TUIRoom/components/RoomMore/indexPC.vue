<template>
  <div class="more-container">
    <div class="more-notice">{{ t('Join our QQ group chat or email us.') }}</div>
    <div v-for="item in contactContentList" :key="item.id" class="more-item">
      <div class="more-title">{{ t(item.title) }}</div>
      <div class="more-content">{{ item.content }}</div>
      <svg-icon class="copy-icon" @click="onCopy(item.copyLink)">
        <copy-icon></copy-icon>
      </svg-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import useRoomMoreControl from './useRoomMoreHooks';
import SvgIcon from '../common/base/SvgIcon.vue';
import CopyIcon from '../common/icons/CopyIcon.vue';

const { t, onCopy, contactContentList } = useRoomMoreControl();
</script>

<style lang="scss" scoped>
.more-container {
  padding: 20px;
  .more-notice {
    font-size: 14px;
    width: 100%;
    height: 22px;
    line-height: 22px;
    font-weight: 400;
    color: var(--font-color-5);
  }
  .more-item {
    display: flex;
    flex-direction: column;
    position: relative;
    &:not(:first-child) {
      margin-top: 20px;
      .more-title {
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        color: var(--font-color-5);
        width: 100%;
        padding-bottom: 8px;
      }
      .more-content {
        flex: 1;
        background-color: var(--background-color-7);
        border-radius: 8px;
        border: 1px solid var(--border-color);
        box-sizing: border-box;
        color: var(--font-color-6);
        display: inline-block;
        font-size: 14px;
        height: 42px;
        font-weight: 500;
        line-height: 22px;
        outline: none;
        padding: 10px 30px 10px 16px;
        transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        position: relative;
      }
      .copy-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        cursor: pointer;
        position: absolute;
        top: 36px;
        right: 0;
      }
    }
  }
}
</style>
