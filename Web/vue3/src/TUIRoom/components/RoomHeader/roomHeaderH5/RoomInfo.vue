<template>
  <div>
    <div v-if="isShowRoomInfoTitle" class="conference-container" @click="toggleShowRoomInfoStatus">
      <span>{{ t('video conferencing', { user: masterUserName }) }}</span>
      <svg-icon class="chevron-down-icon" size="custom" icon-name="chevron-down"></svg-icon>
    </div>
    <div v-if="isShowRoomInfo" class="roomInfo-container">
      <div ref="roomInfoRef" class="roomInfo-container-main">
        <div class="roomInfo-title">
          <p>{{ t('video conferencing', { user: masterUserName }) }}</p>
          <div>
          </div>
        </div>
        <div class="roomInfo-role">
          <h1>{{ t('Host') }}</h1>
          <h2>{{ masterUserName }}</h2>
        </div>
        <div class="roomInfo-roomMode">
          <h1>{{ t('Room Type') }}</h1>
          <h2>{{ roomType }}</h2>
        </div>
        <div class="roomInfo-roomID">
          <h1>{{ t('Room ID') }}</h1>
          <h2>{{ roomId }}</h2>
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(roomId)"></svg-icon>
        </div>
        <div class="roomInfo-roomID">
          <h1>{{ t('Room link') }}</h1>
          <h2>{{ inviteLink }}</h2>
          <svg-icon icon-name="copy-icon" class="copy" @click="onCopy(inviteLink)"></svg-icon>
        </div>
        <h3>{{ t('You can share the room number or link to invite more people to join the room.') }}</h3>
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

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { roomId } = storeToRefs(basicStore);
const { masterUserId } = storeToRefs(roomStore);
const { t } = useI18n();
const roomInfoRef = ref();
const isShowRoomInfo = ref(false);
const roomType = computed(() => (roomStore.isFreeSpeakMode ? t('Free Speech Room') : t('Raise Hand Room')));

const { origin, pathname } = location;
const inviteLink = computed(() => `${origin}${pathname}#/home?roomId=${roomId.value}`);

const masterUserName = computed(() => (roomStore.getUserName(masterUserId.value)));

const isShowRoomInfoTitle = computed(() => (masterUserName.value));

function toggleShowRoomInfoStatus() {
  isShowRoomInfo.value = !isShowRoomInfo.value;
}

function onCopy(value: string | number) {
  navigator.clipboard.writeText(`${value}`);
  ElMessage({
    message: t('Copied successfully'),
    type: 'success',
  });
}

function handleDocumentClick(event: MouseEvent) {
  if (isShowRoomInfo.value && !roomInfoRef.value.contains(event.target)) {
    isShowRoomInfo.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick, true);
});

</script>
<style lang="scss" scoped>
.conference-container{
  display: flex;
  align-items: center;
}
span{
  font-weight: 500;
  font-size: 12px;
  line-height: 17px;
  padding: 0 5px 0 5px;
  color: var(--input-font-color);
}
.chevron-down-icon{
    background-size: cover;
    width: 10px;
    height: 7px;
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
    height: 33vh;
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
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    color: var(--popup-title-color-h5);
    padding: 0px 0 0 25px;
  }
  .roomInfo-role,.roomInfo-roomMode,.roomInfo-roomID{
    width: 90%;
    height: 13%;
    display: flex;
    flex-direction: row;
    padding: 0 0 0 25px;
    align-items: center;
  }
  h1,h2 {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: var(--popup-title-color-h5);
    white-space: nowrap;
    width: 23%;
  }
  h2 {
    color: var(--popup-content-color-h5);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 64%;
  }
  h3 {
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
</style>
