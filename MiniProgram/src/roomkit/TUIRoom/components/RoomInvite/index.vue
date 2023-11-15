<template>
  <div class="invite-container-main">
    <div class="invite-title-main">
      <div>{{ t('Invite') }}</div>
      <span @tap="handleCloseInvite" class="cancel">{{ t('Cancel') }}</span>
    </div>
    <div v-for="item in visibleInviteContentList" :key="item.id" class="invite-content-main">
      <span class="invite-title">{{ t(item.mobileTitle) }}</span>
      <span class="invite-content">{{ item.content }}</span>
      <svg-icon style="display: flex" @tap="() => onCopy(item.copyLink)" :icon="CopyIcon" class="copy"></svg-icon>
    </div>
    <span class="invite-bottom">
      {{ t('You can share the room number or link to invite more people to join the room.') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '../common/base/SvgIcon.vue';
import CopyIcon from '../../assets/icons/CopyIcon.svg';
import useRoomInviteControl from './useRoomInviteHooks';

const {
  t,
  onCopy,
  visibleInviteContentList,
} = useRoomInviteControl();


const emit = defineEmits(['on-close-invite']);

function handleCloseInvite() {
  emit('on-close-invite');
}

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
  background: var(--popup-background-color-h5);
  border-radius: 15px 15px 0px 0px;
  position: fixed;
  bottom: 0;
  display: flex;
  flex-direction: column;
  animation-duration: 200ms;
  animation-name: popup;
  padding-bottom: 4vh;
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
  .invite-title-main {
    display: flex;
    flex-direction: row;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: var(--popup-title-color-h5);
    padding: 30px 0 20px 25px;
    align-items: center;
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
    font-size: 14px;
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
    color: var(--active-color-1);
    margin-left: 30px;
    width: 20px;
    height: 20px;
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
