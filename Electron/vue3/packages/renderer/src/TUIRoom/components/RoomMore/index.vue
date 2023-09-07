<template>
  <div class="more-container">
    <div class="more-notice">{{ t('Join our QQ group chat or email us.') }}</div>
    <div class="more-content">
      <div class="more-item">
        <span class="more-title">{{ t('group chat') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="groupNumber">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(groupNumber)"></svg-icon>
        </div>
      </div>
      <div class="more-item">
        <span class="more-title">{{ t('Email') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="email">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(email)"></svg-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useRoomMoreControl from './useRoomMoreHooks';
import SvgIcon from '../common/SvgIcon.vue';

const {
  t,
  groupNumber,
  email,
  onCopy,
} = useRoomMoreControl();
</script>

<style lang="scss" scoped>
.more-container{
  padding: 20px 32px;
}
.more-notice{
  font-size: 14px;
  width: 100%;
  height: 22px;
  line-height: 22px;
  font-weight: 400;
  color: var(--more-notice-color);
  opacity: 0.8;
  font-family: PingFangSC-Regular;
}
.more-content{
  width: 100%;
  margin-top: 20px;
  .more-item {
    &:not(:first-child) {
      margin-top: 20px;
    }
    .more-title {
      font-size: 14px;
      color: var(--more-notice-color);
      width: 100%;
      opacity: 0.8;
    }
    .input-area {
      margin-top: 10px;
      position: relative;
      .input{
        appearance: none;
        -webkit-appearance: none;
        background-color: var(--input-bg-color);
        background-image: none;
        border-radius: 2px;
        border: 1px solid var(--input-border-color);
        box-sizing: border-box;
        color: var(--input-font-color);
        opacity: 0.8;
        display: inline-block;
        font-size: 14px;
        height: 32px;
        line-height: 32px;
        outline: none;
        padding: 0 40px 0 10px;
        transition: border-color .2s cubic-bezier(.645,.045,.355,1);
        width: 416px;
      }
      .copy {
        width: 14px;
        height: 14px;
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
        cursor: pointer;
      }
    }
  }
}
</style>
