<template>
  <div class="control-container">
    <div v-if="!showRoomDetail" class="container-header">
      <div>
        <div v-if="!isEN" class="container-icon">
          <svg-icon
            class="tencent-cloud" icon-name="tencent-cloud" size="custom"
          ></svg-icon>
          <svg-icon
            class="tencent-cloud-text" icon-name="tencent-cloud-text" size="custom"
          ></svg-icon>
        </div>
        <div v-else class="login-logo">
          <img class="login-top" :src="logoEn">
        </div>
      </div>
      <div class="container-bottom">
        <div v-tap="enterRoom" class="join-room">
          <svg-icon class="enter-icon" icon-name="enter-room" size="custom"></svg-icon>
          <span class="title">{{ t('Join Room') }}</span>
        </div>
        <div v-tap="createRoom" class="create-room">
          <svg-icon class="add-icon" icon-name="add-icon" size="custom"></svg-icon>
          <span class="title">{{ t('New Room') }}</span>
        </div>
      </div>
    </div>
    <div v-if="showRoomDetail || hasGivenRoomId " class="room-detail">
      <div class="room-detail-header">
        <svg-icon v-tap="handleClose" class="close-icon" icon-name="close-back" size="custom"></svg-icon>
        <span v-if="isJoinRoom || hasGivenRoomId" class="room-detail-header-title">{{ t('Join Room') }}</span>
        <span v-else class="room-detail-header-title">{{ t('New Room') }}</span>
      </div>
      <div class="room-detail-middle">
        <div class="room-detail-info">
          <div v-if="isJoinRoom || hasGivenRoomId" class="room-detail-info-box">
            <span class="room-detail-title"> {{ t('Room ID') }}</span>
            <input
              v-model="roomId"
              class="roomid-input"
              type="number" :placeholder="t('Enter room ID')" maxlength="10" enterkeyhint="complete"
              @keyup="handleInput"
            />
          </div>
          <div v-else class="room-detail-info-box" @click="chooseRoomType">
            <span class="room-detail-title"> {{ t('Room Type') }}</span>
            <div class="room-show-title">
              <span class="room-show-title">{{ roomType }}</span>
            </div>
            <svg-icon class="chevron-down-icon" icon-name="chevron-down" size="custom"></svg-icon>
          </div>
          <div class="room-detail-info-box">
            <span class="room-detail-title">{{ t('Your Name') }}</span>
            <input
              v-model="currentUserName"
              class="roomid-input"
              enterkeyhint="complete"
              maxlength="16"
              minlength="1"
              @keyup="handleInputName"
            />
          </div>
        </div>
        <div class="room-detail-setting">
          <div class="room-detail-setting-list">
            {{ t('Turn on the microphone') }}
            <div v-tap="() => toggle('isMicOn')" class="slider-box" :class="[isMicOn && 'slider-open']">
              <span class="slider-block"></span>
            </div>
          </div>
          <div class="room-detail-setting-list">
            {{ t('Turn on the video') }}
            <div v-tap="() => toggle('isCamerOn')" class="slider-box" :class="[isCamerOn && 'slider-open']">
              <span class="slider-block"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="room-detail-bottom">
        <span
          v-if="isJoinRoom || hasGivenRoomId"
          v-tap="() => handleRoomOption('Join')"
          class="button"
        >{{ t('Join Room') }}</span>
        <span v-else v-tap="() => handleRoomOption('New')" class="button">{{ t('New Room') }}</span>
      </div>
    </div>
    <div v-if="showMoreType" class="room-choose-mobile">
      <div ref="moreTypeRef" :class="[showMoreType ? 'room-type-container' : 'close-room-type-container']">
        <div class="room-choose-button">
          <span class="choose-cancel" @click="showMoreType = false">{{ t('Cancel') }}</span>
          <span v-tap="handleConfirm" class="choose-confirm">{{ t('Sure') }}</span>
        </div>
        <div class="room-type-hidden">
          <span
            v-tap="() => chooseCurrentType('FreeToSpeak')"
            :class="[mode === 'FreeToSpeak' && 'room-current-title']" class="room-choose-title"
          >{{ t('Free Speech Room') }}</span>
          <span
            v-tap="() => chooseCurrentType('SpeakAfterTakingSeat')"
            :class="[mode === 'SpeakAfterTakingSeat' && 'room-current-title']" class="room-choose-title"
          >{{ t('Raise Hand Room') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import SvgIcon from '../../common/SvgIcon.vue';
import { useRoomStore } from '../../../stores/room';
import useRoomControl from './useRoomControlHooks';
import '../../../directives/vTap';

const {
  logoEn,
  t,
  isEN,
} = useRoomControl();

const moreTypeRef = ref();
const roomStore = useRoomStore();
const showRoomDetail = ref(false);
const showMoreType = ref(false);
const isJoinRoom = ref(false);
const roomType =  computed(() => (mode.value === 'FreeToSpeak' ? t('Free Speech Room') : t('Raise Hand Room')));
const isMicOn = ref(true);
const isCamerOn = ref(true);
const mode = ref('FreeToSpeak');
const roomId = ref('');
const tuiRoomParam = {
  isOpenCamera: true,
  isOpenMicrophone: true,
  defaultCameraId: '',
  defaultMicrophoneId: '',
  defaultSpeakerId: '',
};
const emit = defineEmits(['create-room', 'enter-room', 'update-user-name']);

interface Props{
  userName: string
  givenRoomId: string | null
}
const props =  defineProps<Props>();
defineExpose({
  getRoomParam,
});
const currentUserName = ref(props.userName ||  `user_${Math.ceil(Math.random() * 10)}`);
const hasGivenRoomId = computed(() => (typeof props.givenRoomId === 'string' && props.givenRoomId !== ''));

watch(
  () => props.givenRoomId,
  (val) => {
    if (val) {
      roomId.value = val;
    }
  },
  { immediate: true },
);

function createRoom() {
  showRoomDetail.value = !showRoomDetail.value;
  isJoinRoom.value = false;
}
function enterRoom() {
  showRoomDetail.value = !showRoomDetail.value;
  isJoinRoom.value = true;
}
function chooseRoomType() {
  showMoreType.value = !showMoreType.value;
}
function chooseCurrentType(roomType: string) {
  mode.value = roomType;
}
function handleConfirm() {
  showMoreType.value = !showMoreType.value;
}
function handleClose() {
  showRoomDetail.value = false;
  showMoreType.value = false;
}
function toggle(type:string) {
  switch (type) {
    case 'isMicOn':
      isMicOn.value = !isMicOn.value;
      tuiRoomParam.isOpenMicrophone = isMicOn.value;
      break;
    case 'isCamerOn':
      isCamerOn.value = !isCamerOn.value;
      tuiRoomParam.isOpenCamera = isCamerOn.value;
      break;
    default:
      break;
  }
}
function getRoomParam() {
  tuiRoomParam.defaultCameraId = roomStore.currentCameraId;
  tuiRoomParam.defaultMicrophoneId = roomStore.currentMicrophoneId;
  tuiRoomParam.defaultSpeakerId = roomStore.currentSpeakerId;
  return tuiRoomParam;
}

function handleInput(e: any) {
  roomId.value = e.target.value;
}

function handleInputName(e: any) {
  currentUserName.value = e.target.value;
}

function handleDocumentClick(event: MouseEvent) {
  if (showMoreType.value && !moreTypeRef.value.contains(event.target)) {
    showMoreType.value = false;
  }
}


function handleRoomOption(type:string) {
  emit('update-user-name', currentUserName.value);
  switch (type) {
    case 'Join':
      emit('enter-room', String(roomId.value));
      break;
    case 'New':
      emit('create-room', mode.value);
      break;
    default:
      break;
  }
}


onMounted(() => {
  document?.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document?.removeEventListener('click', handleDocumentClick, true);
});

</script>
<style lang="scss" scoped>
@import '../../../assets/style/var.scss';
.control-container{
    width: 100vw;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
}

.container-header{
   padding-top: 80px;
}
.container-icon{
    display: flex;
    flex-direction: column;
    align-items: center
}
.container-bottom{
    padding-top: 250px;
    display: flex;
    flex-direction: column;
    width: 210px
    }
.create-room{
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20);
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 6%;
    margin-top: 5%;
}
.add-icon{
    width: 22px;
    height: 22px;
    background-size: cover;
}
.join-room{
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    box-shadow: 0 2px 4px 0 rgba(0,0,0,0.20);
    border-radius: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 6%;
   }
.enter-icon{
    width: 22px;
    height: 22px;
    background-size: cover;
   }
.title{
    line-height: 34px;
    color: #FFFFFF;
    padding-left: 10px
}

.room-detail{
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100vw;
    height: auto;
    box-sizing: border-box;
    z-index: 9;
    background: var(--room-detail);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
}
.room-detail-header{
    background: var(--room-detail-background);
    display: flex;
    align-items: center;
    width: 100%;
    padding: 5%;
    &-title {
     flex: 1;
     text-align: center;
     color: var(--room-detail-title);
    }
}
.close-icon{
    position: absolute;
    left: 22px;
    width: 10px;
    height: 18px;
    background-size: cover;
}
.room-detail-middle{
    width: 90%;
}
.room-detail-info{
    background: var(--room-detail-background);
    margin-top: 20px;
    border-radius: 6px
}
.room-detail-info-box{
    display: flex;
    padding: 15px 12px;
    align-items: center;
}
.room-detail-title{
    min-width: 64px;
    color: var(--room-detail-title);
}
.chevron-down-icon{
    width: 14px;
    height: 9px;
    display: flex;
}
.room-show-title{
    color: var(--room-detail-title);
    flex: 1;
    padding-left: 26px;
}
.room-show-name{
    color: var(--room-detail-title);
    flex: 1;
    padding-left: 56px;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.roomid-input{
    width: 100%;
    border: 0px;
    outline: none;
    flex: 1;
    padding-left: 56px;
    background: var(--room-detail-background);
    color: #676C80;
    font-size: 16px;
}
.room-detail-setting{
    background: var(--room-detail-background);
    margin-top: 20px;
    border-radius: 6px;
}
.room-detail-setting-list{
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 12px;
    color: var(--room-detail-title);
}
.room-detail-bottom{
    background-image: linear-gradient(-45deg, #006EFF 0%, #0C59F2 100%);
    width: 90%;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    padding: 10px;
    position: absolute;
    bottom: 30px;
}
.button{
        color: white;
        padding: 0px 5.75rem;
    }
.room-type-container{
    position: fixed;
    bottom: 0;
    left: 0;
    background: var(--log-out-cancel);
    width: 100vw;
    z-index: 11;
   border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    padding-bottom: 25px;
    transition: all  .25s  linear;
}

.close-room-type-container{
    position: fixed;
    bottom: 0;
    left: 0;
    height: 0;
    background: var(--log-out-cancel);
    width: 100vw;
    z-index: 11;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    transition: all  .25s  linear;
}
.room-choose-mobile{
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 100vw;
    height: auto;
    box-sizing: border-box;
    z-index: 9;
    background:  var(--log-out-mobile);
}
.room-choose-button{
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.choose-cancel{
    color: var(--room-detail-title);
    z-index: 11;
    padding: 20px;
}
.choose-confirm{
    color: #146EFA;
    z-index: 11;
    padding: 20px;
}
.room-type-hidden{
    background: var(--log-out-cancel);
    border-radius: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
.tencent-cloud{
    width: 120px;
    height: 32px;
    background-size: cover;
}
.tencent-cloud-text{
    width: 169px;
    height: 27px;
    margin-top: 10px;
    background-size: cover;
}
.room-choose-title{
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    width: 100%;
}
.room-current-title{
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--choose-type);
    color: var(--room-detail-title);
    width: 100%;
}
.slider {
  &-box {
    display: flex;
    align-items: center;
    width: 44px;
    height: 24px;
    border-radius: 15px;
    background: #E1E1E3;
  }
  &-open {
    background: #006EFF !important;
    justify-content: flex-end;
  }
  &-block {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 8px;
    margin: 0 2px;
    background: #FFFFFF;
    border: 0 solid rgba(0,0,0,0.85);
    box-shadow: 0 2px 4px 0 #D1D1D1;
  }
}
.login-logo{
    display: flex;
    justify-content: center;
    padding-top: 20%;
}
.login-top{
    width: 60vw;
}
</style>
