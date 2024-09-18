<template>
  <div class="more-container">
    <div class="more-title">
      <svg-icon class="email-icon" :icon="EmailIcon" />
      <div class="more-notice">
        {{ t('If you have any questions, please email us.') }}
      </div>
    </div>
    <div v-if="isZH" class="more-item">
      <div class="item-title">{{ t('Join our product discussion group') }}</div>
      <tui-button class="join-button" type="primary" @click="handleClick">
        {{ t('Join now') }}
      </tui-button>
    </div>
    <div class="more-item">
      <div class="item-title">{{ t('Our email address') }}</div>
      <div class="more-content">{{ email }}</div>
      <svg-icon class="copy-icon" :icon="CopyIcon" @click="onCopy(email)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import useRoomMoreControl from './useRoomMoreHooks';
import SvgIcon from '../common/base/SvgIcon.vue';
import CopyIcon from '../common/icons/CopyIcon.vue';
import EmailIcon from '../common/icons/EmailIcon.vue';
import TuiButton from '../common/base/Button.vue';

const { t, onCopy, handleClick, email, isZH } = useRoomMoreControl();
</script>

<style lang="scss" scoped>
.more-container {
  padding: 20px;

  .more-title {
    display: flex;

    .email-icon {
      color: #7c85a6;
    }

    .more-notice {
      width: 100%;
      height: 22px;
      padding-left: 8px;
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: var(--font-color-5);
    }
  }

  .more-item {
    position: relative;
    display: flex;
    flex-direction: column;

    &:not(:first-child) {
      margin-top: 20px;

      .item-title {
        width: 100%;
        padding-bottom: 8px;
        font-size: 14px;
        font-weight: 400;
        line-height: 22px;
        color: var(--font-color-5);
      }

      .join-button {
        height: 42px;
        font-weight: 600;
      }

      .more-content {
        position: relative;
        box-sizing: border-box;
        display: inline-block;
        flex: 1;
        height: 42px;
        padding: 10px 30px 10px 16px;
        overflow: hidden;
        font-size: 14px;
        font-weight: 500;
        line-height: 22px;
        color: var(--font-color-6);
        text-overflow: ellipsis;
        white-space: nowrap;
        background-color: var(--background-color-7);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        outline: none;
        transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
      }

      .copy-icon {
        position: absolute;
        top: 36px;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        cursor: pointer;
      }
    }
  }
}
</style>
