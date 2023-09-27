<template>
  <div class="contact-container-main">
    <div class="contact-title-main">
      <p>{{ t('Contact us') }}</p>
      <span v-if="isWeChat" v-tap="handleCloseContact" class="cancel">{{ t('Cancel') }}</span>
    </div>
    <div v-for="item in contactContentList" :key="item.id" class="contact-content-main">
      <span class="contact-title">{{ t(item.title) }}</span>
      <span class="contact-content">{{ item.content }}</span>
      <svg-icon v-tap="() => onCopy(item.copyLink)" icon-name="copy-icon" class="copy" size="custom"></svg-icon>
    </div>
    <span class="contact-bottom">
      {{ t('If you have any questions, please feel free to join our QQ group or send an email') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import useRoomMoreControl from './useRoomMoreHooks';
import SvgIcon from '../common/SvgIcon.vue';
import { isWeChat } from '../../utils/useMediaValue';
import '../../directives/vTap';


const {
  t,
  groupNumber,
  email,
  onCopy,
} = useRoomMoreControl();

const emit = defineEmits(['on-close-contact']);

const contactContentList = reactive([
  { id: 1, title: 'group chat', content: groupNumber, copyLink: groupNumber },
  { id: 2, title: 'Email', content: email, copyLink: email },
]);

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
  width: 100%;
  background: var(--popup-background-color-h5);
  border-radius: 15px 15px 0px 0px;
  position: fixed;
  bottom: 0;
  display: flex;
  flex-direction: column;
  animation-duration: 100ms;
  animation-name: popup;
  padding-bottom: 4vh;
  @keyframes popup {
  from {
    height: 0;
  }
  to {
    height: 30%;
  }
}
  .contact-title-main {
    display: flex;
    flex-direction: row;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: var(--popup-title-color-h5);
    padding: 20px;
    align-items: center;
  }
  .contact-content-main {
    width: 90%;
    height: 15%;
    display: flex;
    flex-direction: row;
    padding: 0 0 0 25px;
    align-items: center;
    margin-bottom: 10px;
  }
  .contact-title, .contact-content {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: var(--popup-title-color-h5);
    white-space: nowrap;
    width: 28%;
  }
  .contact-content {
    color: var(--popup-content-color-h5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 62%;
    font-size: 14px;
  }
  .contact-bottom {
    width: 90%;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: center;
    color: var(--popup-title-color-h5);
    padding-left: 40px;
  }
  .copy {
    width: 14px;
    height: 14px;
    margin-left: 30px;
  }
}
.cancel{
  flex: 1;
  text-align: end;
  padding-right: 30px;
  font-weight: 400;
  font-size: 16px;
}
</style>
