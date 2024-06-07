<template>
  <div class="contact-container-main">
    <div class="contact-title-main" @touchmove.stop.prevent="() => {}">
      <text class="contact-header">{{ t('Contact us') }}</text>
      <text class="cancel" @tap="handleCloseContact">{{ t('Cancel') }}</text>
    </div>
    <div v-for="item in contactContentList" :key="item.id" class="contact-content-main">
      <text class="contact-title">{{ t(item.title) }}</text>
      <text class="contact-content">{{ item.content }}</text>
      <div class="copy-container" @tap="() => onCopy(item.copyLink)">
        <svg-icon style="display: flex" class="copy" icon="CopyIcon"></svg-icon>
      </div>
    </div>
    <text class="contact-bottom">
      {{ t('If you have any questions, please feel free to join our QQ group or send an email') }}
    </text>
  </div>
</template>

<script setup lang="ts">
import useRoomMoreControl from './useRoomMoreHooks';
import SvgIcon from '../common/base/SvgIcon.vue';


const {
  t,
  onCopy,
  contactContentList,
} = useRoomMoreControl();

const emit = defineEmits(['on-close-contact']);

function handleCloseContact() {
  emit('on-close-contact');
}
</script>

<style lang="scss" scoped>
span{
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  padding-right: 5px;
}
.contact-container-main {
  width: 750rpx;
  background: #d4d4d4;
  border-radius: 15px 15px 0px 0px;
  position: fixed;
  bottom: 0;
  display: flex;
  flex-direction: column;
  animation-duration: 200ms;
  animation-name: popup;
  padding-bottom: 20px;
  @keyframes popup {
  from {
    transform-origin: bottom;
    transform: scaleY(0);
  }
  to {
    transform-origin: bottom;
    transform: scaleY(1);
  }
}
  .contact-title-main {
    display: flex;
    flex-direction: row;
    padding: 30px 0 20px 25px;
    align-items: center;
    .contact-header{
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 500;
      font-size: 20px;
      line-height: 24px;
      color: #141313;
    }
    .cancel{
      font-family: "PingFang SC";
      font-style: normal;
      line-height: 24px;
      color: #141313;
      flex: 1;
      text-align: right;
      font-weight: 400;
      padding-right: 30px;
      font-size: 16px;
    }
  }
  .contact-content-main {
    display: flex;
    align-items: stretch;
    flex-direction: row;
    padding: 5px 25px;
  }
  .contact-title, .contact-content {
    width: 210rpx;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    letter-spacing: -0.24px;
    color: #141313;
  }
  .contact-content {
    width: 465rpx;
    color: #636060;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }
  .copy-container {
    position: absolute;
    right: 40rpx;
    cursor: pointer;
    .copy {
      width: 20px;
      height: 20px;
    }
  }
  .contact-bottom {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: center;
    color: #141313;
    padding-left: 40rpx;
    padding-top: 5px;
  }
  .copy {
    width: 20px;
    height: 20px;
		position: absolute;
		right: 40rpx;
    color: #1C66E5;
  }
}
</style>
