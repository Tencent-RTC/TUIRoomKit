<template>
  <div class="contact-container-main">
    <div class="contact-title-main">
      <div>{{ t('Contact us') }}</div>
      <span v-tap="handleCloseContact" class="cancel">{{ t('Cancel') }}</span>
    </div>
    <div
      v-for="item in contactContentList"
      :key="item.id"
      class="contact-content-main"
    >
      <span class="contact-title">{{ t(item.title) }}</span>
      <span class="contact-content">{{ item.content }}</span>
      <IconCopy v-tap="() => onCopy(item.copyLink)" class="copy" />
    </div>
    <span class="contact-bottom">
      {{
        t(
          'If you have any questions, please feel free to join our QQ group or send an email'
        )
      }}
    </span>
  </div>
</template>

<script setup lang="ts">
import useRoomMoreControl from './useRoomMoreHooks';
import { IconCopy } from '@tencentcloud/uikit-base-component-vue3';
import vTap from '../../directives/vTap';

const { t, onCopy, contactContentList } = useRoomMoreControl();

const emit = defineEmits(['on-close-contact']);

function handleCloseContact() {
  emit('on-close-contact');
}
</script>

<style lang="scss" scoped>
span {
  padding-right: 5px;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}

.contact-container-main {
  position: fixed;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 4vh;
  border-radius: 15px 15px 0 0;
  animation-name: popup;
  animation-duration: 200ms;
  background-color: var(--bg-color-operate);

  @keyframes popup {
    from {
      transform: scaleY(0);
      transform-origin: bottom;
    }

    to {
      transform: scaleY(1);
      transform-origin: bottom;
    }
  }

  .contact-title-main {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 30px 0 20px 25px;
    font-family: 'PingFang SC';
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    color: var(--text-color-primary);
  }

  .contact-content-main {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 90%;
    height: 15%;
    padding: 0 0 0 25px;
    margin-bottom: 10px;
  }

  .contact-title,
  .contact-content {
    width: 28%;
    font-family: 'PingFang SC';
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    white-space: nowrap;
    color: var(--text-color-primary);
  }

  .contact-content {
    width: 62%;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text-color-secondary);
  }

  .contact-bottom {
    width: 90%;
    padding-left: 40px;
    font-family: 'PingFang SC';
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 17px;
    text-align: center;
    color: var(--text-color-secondary);
  }

  .copy {
    margin-left: 30px;
    color: var(--text-color-link);
  }
}

.cancel {
  flex: 1;
  padding-right: 30px;
  font-size: 16px;
  font-weight: 400;
  text-align: end;
}
</style>
