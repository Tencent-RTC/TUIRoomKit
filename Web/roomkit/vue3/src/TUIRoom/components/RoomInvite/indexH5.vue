<template>
  <div class="invite-container">
    <div class="invite-container-main">
      <div class="invite-title-main">
        <div>{{ t('Invite') }}</div>
        <span v-tap="handleCloseInvite" class="cancel">{{ t('Cancel') }}</span>
      </div>
      <div
        v-for="item in visibleInviteContentList"
        :key="item.id"
        class="invite-content-main"
      >
        <span class="invite-title">{{ t(item.mobileTitle) }}</span>
        <span class="invite-content">{{ item.content }}</span>
        <svg-icon
          v-tap="() => onCopy(item.copyLink)"
          :icon="CopyIcon"
          class="copy"
        />
      </div>
      <span class="invite-bottom">
        {{ inviteBarTitle }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import CopyIcon from '../common/icons/CopyIcon.vue';
import useRoomInviteControl from './useRoomInviteHooks';
import vTap from '../../directives/vTap';

const { t, onCopy, visibleInviteContentList, inviteBarTitle } =
  useRoomInviteControl();

const emit = defineEmits(['on-close-invite']);

function handleCloseInvite() {
  emit('on-close-invite');
}
</script>

<style lang="scss" scoped>
span {
  padding-right: 5px;
  font-size: 12px;
  font-weight: 500;
  line-height: 17px;
}

.invite-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background-color: var(--log-out-mobile);
}

.invite-container-main {
  position: fixed;
  bottom: 0;
  display: flex;
  flex-direction: column;
  width: 100vw;
  padding-bottom: 4vh;
  background: var(--popup-background-color-h5);
  border-radius: 15px 15px 0 0;
  animation-name: popup;
  animation-duration: 200ms;

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

  .invite-title-main {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 30px 0 20px 25px;
    font-family: 'PingFang SC';
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 24px;
    color: var(--popup-title-color-h5);
  }

  .invite-content-main {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 90%;
    height: 13%;
    padding: 0 0 0 25px;
    margin-bottom: 10px;
  }

  .invite-title {
    width: 23%;
    font-family: 'PingFang SC';
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    color: var(--popup-title-color-h5);
    white-space: nowrap;
  }

  .invite-content {
    width: 64%;
    overflow: hidden;
    font-size: 14px;
    color: var(--popup-content-color-h5);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .invite-bottom {
    width: 90%;
    padding-left: 40px;
    font-family: 'PingFang SC';
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 17px;
    color: var(--popup-title-color-h5);
    text-align: center;
  }

  .copy {
    width: 20px;
    height: 20px;
    margin-left: 30px;
    color: var(--active-color-1);
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
