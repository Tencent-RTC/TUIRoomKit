<template>
  <div class="invite-container">
    <div class="invite-notice">{{ t('Share the room ID or invite link') }}</div>
    <div class="invite-content">
      <div class="invite-item">
        <span class="invite-title">{{ t('Invite by room number') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="roomId">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(roomId)"></svg-icon>
        </div>
      </div>
      <div v-if="roomLinkDisplay" class="invite-item">
        <span class="invite-title">{{ t('Invite via room link') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="inviteLink">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(inviteLink)"></svg-icon>
        </div>
      </div>
      <div class="invite-item">
        <span class="invite-title">{{ t('Invite via client scheme') }}</span>
        <div class="input-area">
          <input class="input" type="text" :value="schemeLink">
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(schemeLink)"></svg-icon>
        </div>
      </div>
    </div>
    <!-- <div>允许访客通过链接进入房间</div> -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import useRoomInviteControl from './useRoomInviteHooks';
import SvgIcon from '../common/SvgIcon.vue';

const {
  t,
  roomLinkDisplay,
  roomId,
  inviteLink,
  schemeLink,
  onCopy,
} = useRoomInviteControl();

onMounted(() => {
  // eslint-disable-next-line no-underscore-dangle
  if ((window as any).__TRTCElectron) {
    roomLinkDisplay.value = false;
  }
});
</script>

<style lang="scss" scoped>
.invite-container{
  padding: 20px 32px;
}
.invite-notice{
  font-size: 14px;
  width: 100%;
  height: 22px;
  line-height: 22px;
  opacity: 0.8;
  font-weight: 400;
  color: var(--input-font-color);
  font-family: PingFangSC-Regular;
}
.invite-content{
  width: 100%;
  margin-top: 20px;
  .invite-item {
    &:not(:first-child) {
      margin-top: 20px;
    }
    .invite-title {
      font-size: 14px;
      color: var(--more-notice-color);
      width: 100%;
      opacity: 0.8;
    }
    .input-area {
      margin-top: 10px;
      position: relative;
      .input{
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
