<template>
  <div class="conference-container">
    <div v-if="isShowRoomInfoTitle" @click="toggleShowRoomInfoStatus">
      <div v-if="isWeChat" class="title-container">
        <span class="text">{{ masterUserName }}</span>
        <span class="text">{{ '的视频会议' }}</span>
        <svg-icon class="chevron-down-icon" size="custom" icon-name="chevron-down"></svg-icon>
      </div>
      <div v-else class="title-container">
        <span class="text">{{ t('video conferencing', { user: masterUserName }) }}</span>
        <svg-icon class="chevron-down-icon" size="custom" icon-name="chevron-down"></svg-icon>
      </div>
    </div>
    <div v-if="isShowRoomInfo" class="roomInfo-container">
      <div ref="roomInfoRef" class="roomInfo-container-main">
        <div v-if="isWeChat" class="roomInfo-title">
          <span class="master-header">{{ masterUserName }}</span>
          <span class="master-header">{{ '的视频会议' }}</span>
          <span class="cancel" @click="handleHiddenRoomInfo">{{ t('Cancel') }}</span>
        </div>
        <div v-else class="roomInfo-title">
          <span class="master-header">{{ t('video conferencing', { user: masterUserName }) }}</span>
        </div>
        <div class="roomInfo-middle">
          <div class="roomInfo-role">
            <span>{{ t('Host') }}</span>
            <span class="text-right">{{ masterUserName }}</span>
          </div>
          <div class="roomInfo-roomMode">
            <span class="middle-left">{{ t('Room Type') }}</span>
            <span class="text-type">{{ roomType }}</span>
          </div>
          <div class="roomInfo-roomID">
            <span class="middle-left">{{ t('Room ID') }}</span>
            <span class="text-right">{{ roomId }}</span>
            <svg-icon icon-name="copy-icon" class="copy" size="custom" @click="onCopy(roomId)"></svg-icon>
          </div>
          <div v-if="!isWeChat" class="roomInfo-roomID">
            <span>{{ t('Room Link') }}</span>
            <span class="link">{{ inviteLink }}</span>
            <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(inviteLink)"></svg-icon>
          </div>
        </div>
        <div v-if="!isWeChat" class="roomInfo-bottom">
          <span>{{ t('You can share the room number or link to invite more people to join the room.') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from '../../../locales';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import SvgIcon from '../../common/SvgIcon.vue';
import { ElMessage } from '../../../elementComp';
import { isWeChat } from '../../../utils/useMediaValue';
import  { clipBoard }  from '../../../utils/utils';

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { roomId } = storeToRefs(basicStore);
const { masterUserId } = storeToRefs(roomStore);
const { t } = useI18n();
const roomInfoRef = ref();
const isShowRoomInfo = ref(false);
const roomType = computed(() => (roomStore.isFreeSpeakMode ? t('Free Speech Room') : t('Raise Hand Room')));

const { origin, pathname } = location || {};
const inviteLink = computed(() => `${origin}${pathname}#/home?roomId=${roomId.value}`);

const masterUserName = computed(() => (roomStore.getUserName(masterUserId.value)) || masterUserId.value);

const isShowRoomInfoTitle = computed(() => (masterUserName.value));

function toggleShowRoomInfoStatus() {
  isShowRoomInfo.value = !isShowRoomInfo.value;
}

async function  onCopy(value: string | number) {
  try {
    await clipBoard(value);
    ElMessage({
      message: t('Copied successfully'),
      type: 'success',
    });
  } catch (error) {
    ElMessage({
      message: t('Copied failure'),
      type: 'error',
    });
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (isShowRoomInfo.value && !roomInfoRef.value.contains(event.target)) {
    isShowRoomInfo.value = false;
  }
}

function handleHiddenRoomInfo() {
  isShowRoomInfo.value = false;
}


onMounted(() => {
  document?.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document?.removeEventListener('click', handleDocumentClick, true);
});

</script>
<style lang="scss" scoped>
.conference-container{
  min-width: 140px;
  max-width: 200px;
}

.title-container{
  display: flex;
  align-items: center;
}

.text{
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  color: var(--input-font-color);
}
.master-header{
  padding: 20px 0;
}
.text-right {
  padding-left: 30px;
}
.text-type {
  padding-left: 12px;
}
.roomInfo-middle{
  color: var(--popup-title-color-h5);
  padding-left: 25px;
}
.chevron-down-icon{
    background-size: cover;
    width: 10px;
    height: 7px;
    display: flex;
    align-items: center;
    margin-left: 5px;
}
.roomInfo-container{
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  box-sizing: border-box;
  background-color: var(--log-out-mobile);
  .roomInfo-container-main {
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
  .roomInfo-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: var(--popup-title-color-h5);
    padding: 0px 0 0 25px;
    position: relative;
  }
  .roomInfo-role,.roomInfo-roomMode,.roomInfo-roomID{
    display: flex;
    flex-direction: row;
    padding: 5px 0;
    align-items: center;
  }
  .link {
    color: var(--popup-content-color-h5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 64%;
    padding-left: 16px;
  }

  .roomInfo-bottom {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 17px;
    text-align: center;
    color: var(--popup-title-color-h5);
    padding-top: 2vh;
  }
  .copy {
    width: 14px;
    height: 14px;
    margin-left: 30px;
  }
  .qrcode {
    width: 24px;
    height: 24px;
    position: absolute;
    right: 10vw;
    top: 3vh;
  }
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
