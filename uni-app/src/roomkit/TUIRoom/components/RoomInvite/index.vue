<template>
  <div class="invite-container-main">
    <div class="invite-title-main">
      <text class="invite-header">{{ t('Invite') }}</text>
      <text class="cancel" @tap="handleCloseInvite">{{ t('Cancel') }}</text>
    </div>
    <div v-for="item in visibleInviteContentList" :key="item.id" class="invite-content-main">
      <text class="invite-title">{{ t(item.mobileTitle) }}</text>
      <text class="invite-content">{{ item.content }}</text>
      <div @tap="() => onCopy(item.copyLink)">
        <svg-icon style="display: flex" icon="CopyIcon" class="copy"></svg-icon>
      </div>
    </div>
    <text class="invite-bottom">
      {{ inviteBarTitle }}
    </text>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '../common/base/SvgIcon.vue';
import useRoomInviteControl from './useRoomInviteHooks';

const {
  t,
  onCopy,
  visibleInviteContentList,
  inviteBarTitle,
} = useRoomInviteControl();


const emit = defineEmits(['on-close-invite']);

function handleCloseInvite() {
  emit('on-close-invite');
}

</script>

<style lang="scss" scoped>
.invite-container-main {
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
  .invite-header{
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: #141313;
  }
  .invite-title-main {
    display: flex;
    flex-direction: row;
		justify-content: space-between;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: #141313;
    padding: 30px 0 20px 25px;
    align-items: center;
  }
  .invite-content-main {
      display: flex;
      align-items: stretch;
			flex-direction: row;
      padding: 0 25px;
  }
  .invite-title {
		flex: 1;
    font-family: 'PingFang SC';
    font-style: normal;
    font-size: 14px;
    color: #141313;
    white-space: nowrap;
    width: 23%;
  }
  .invite-content {
		flex: 1;
    color: #636060;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 64%;
    font-size: 14px;
  }
  .invite-bottom {
      font-family: 'PingFang SC';
      font-style: normal;
      font-weight: 400;
      font-size: 12px;
      line-height: 17px;
      text-align: center;
      color: #141313;
			padding-left: 40rpx;
  }
  .copy {
    color: #1C66E5;
    margin-left: 30px;
    width: 20px;
    height: 20px;
  }
}
.cancel{
	position: absolute;
	right: 30px;
  text-align: end;
  font-weight: 400;
  font-size: 16px;
  font-family: "PingFang SC";
  font-style: normal;
  line-height: 24px;
  color: #141313;
}
</style>
