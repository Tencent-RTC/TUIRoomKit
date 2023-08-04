<template>
  <div class="invite-container-main">
    <div class="invite-title-main">
      <p>{{ t('Invite') }}</p>
    </div>
    <div v-for="item in inviteContentList" :key="item.id" class="invite-content-main">
      <span class="invite-title">{{ t(item.title) }}</span>
      <span class="invite-content">{{ item.content }}</span>
      <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(item.copyLink)"></svg-icon>
    </div>
    <span class="invite-bottom">
      {{ t('You can share the room number or link to invite more people to join the room.') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
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

const inviteContentList = reactive([
  { id: 1, title: 'Room ID', content: roomId, copyLink: roomId },
  { id: 2, title: 'Room link', content: inviteLink, copyLink: inviteLink },
  { id: 3, title: 'scheme', content: schemeLink, copyLink: inviteLink },
]);

onMounted(() => {
  // eslint-disable-next-line no-underscore-dangle
  if ((window as any).__TRTCElectron) {
    roomLinkDisplay.value = false;
  }
});
</script>

<style lang="scss" scoped>
span{
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  padding-right: 5px;
}
.invite-container-main {
  width: 100%;
  height: 29vh;
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
  .invite-title-main {
    display: flex;
    flex-direction: row;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: var(--popup-title-color-h5);
    padding: 0px 0 0 25px;
  }
  .invite-content-main {
    width: 90%;
    height: 13%;
    display: flex;
    flex-direction: row;
    padding: 0 0 0 25px;
    align-items: center;
    margin-bottom: 10px;
  }
  .invite-title {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: var(--popup-title-color-h5);
    white-space: nowrap;
    width: 23%;
  }
  .invite-content {
    color: var(--popup-content-color-h5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 64%;
  }
  .invite-bottom {
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

</style>
