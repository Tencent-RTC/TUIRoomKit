<template>
  <div class="control-container">
    <div class="container-button-group">
      <div class="button-item" @click="enterRoom">
        <svg-icon class="button-icon" :icon="EnterRoomIcon" />
        <span>{{ t('Join Room') }}</span>
      </div>
      <div class="button-item" @click="createRoom">
        <svg-icon class="button-icon" :icon="CreateRoomIcon" />
        <span>{{ t('New Room') }}</span>
      </div>
      <div class="button-item" @click="scheduleRoom">
        <svg-icon class="button-icon" :icon="ScheduleRoomIcon" />
        <span>{{ t('Schedule') }}</span>
      </div>
    </div>
    <div class="conference-list-container">
      <ScheduleRoomList @join-conference="handleRoomOption('Join', $event)" />
    </div>
    <div v-if="showRoomDetail || hasGivenRoomId" class="room-detail">
      <div class="room-detail-header">
        <svg-icon
          v-tap="handleClose"
          class="close-icon"
          :icon="ArrowStrokeBackIcon"
        />
        <span
          v-if="isJoinRoom || hasGivenRoomId"
          class="room-detail-header-title"
          >{{ t('Join Room') }}
        </span>
        <span v-else class="room-detail-header-title">{{ t('New Room') }}</span>
      </div>
      <div class="room-detail-middle">
        <div class="room-detail-info">
          <div v-if="isJoinRoom || hasGivenRoomId" class="room-detail-info-box">
            <span class="room-detail-title"> {{ t('Room ID') }}</span>
            <input
              v-model="currentRoomId"
              class="roomid-input"
              type="number"
              :placeholder="t('Enter room ID')"
              maxlength="10"
              enterkeyhint="complete"
              @keyup="handleInput"
            />
          </div>
          <div v-else class="room-detail-info-box" @click="chooseRoomType">
            <span class="room-detail-title"> {{ t('Room Type') }}</span>
            <div class="room-show-title">
              <span class="room-show-title">{{ roomType }}</span>
            </div>
            <svg-icon
              class="chevron-down-icon"
              :icon="ArrowStrokeSelectDownIcon"
            />
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
            <div
              v-tap="() => toggle('isMicOn')"
              class="slider-box"
              :class="[isMicOn && 'slider-open']"
            >
              <span class="slider-block"></span>
            </div>
          </div>
          <div class="room-detail-setting-list">
            {{ t('Turn on the video') }}
            <div
              v-tap="() => toggle('isCamerOn')"
              class="slider-box"
              :class="[isCamerOn && 'slider-open']"
            >
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
          >{{ t('Join Room') }}
        </span>
        <span v-else v-tap="() => handleRoomOption('New')" class="button">{{
          t('New Room')
        }}</span>
      </div>
    </div>
    <div v-if="showMoreType" class="room-choose-mobile">
      <div
        ref="moreTypeRef"
        :class="[
          showMoreType ? 'room-type-container' : 'close-room-type-container',
        ]"
      >
        <div class="room-choose-button">
          <span class="choose-cancel" @click="showMoreType = false">{{
            t('Cancel')
          }}</span>
          <span v-tap="handleConfirm" class="choose-confirm">{{
            t('Sure')
          }}</span>
        </div>
        <div class="room-type-hidden">
          <span
            v-tap="() => chooseCurrentType('FreeToSpeak')"
            :class="[mode === 'FreeToSpeak' && 'room-current-title']"
            class="room-choose-title"
            >{{ t('Free Speech Room') }}
          </span>
          <span
            v-tap="() => chooseCurrentType('SpeakAfterTakingSeat')"
            :class="[mode === 'SpeakAfterTakingSeat' && 'room-current-title']"
            class="room-choose-title"
            >{{ t('On-stage Speaking Room') }}
          </span>
        </div>
      </div>
    </div>
    <ScheduleConferencePanel
      :user-name="props.userName"
      @input="showScheduleRoom = $event"
      :visible="showScheduleRoom"
    />
  </div>
</template>
<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onUnmounted,
  defineEmits,
  defineProps,
  defineExpose,
} from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';
import { useRoomStore } from '../../../stores/room';
import useRoomControl from './useRoomControlHooks';
import vTap from '../../../directives/vTap';
import CreateRoomIcon from '../../common/icons/CreateRoomIcon.vue';
import EnterRoomIcon from '../../common/icons/EnterRoomIcon.vue';
import ArrowStrokeBackIcon from '../../common/icons/ArrowStrokeBackIcon.vue';
import ArrowStrokeSelectDownIcon from '../../common/icons/ArrowStrokeSelectDownIcon.vue';
import ScheduleRoomIcon from '../../common/icons/ScheduleRoomIcon.vue';
import ScheduleRoomList from '../../ScheduleConference/ScheduleRoomList.vue';
import ScheduleConferencePanel from '../../ScheduleConference/ScheduleConferencePanel';
import TUIMessage from '../../common/base/Message/index';

const { t } = useRoomControl();

const moreTypeRef = ref();
const roomStore = useRoomStore();
const showRoomDetail = ref(false);
const showMoreType = ref(false);
const showScheduleRoom = ref(false);
const isJoinRoom = ref(false);
const roomType = computed(() =>
  mode.value === 'FreeToSpeak'
    ? t('Free Speech Room')
    : t('On-stage Speaking Room')
);
const isMicOn = ref(true);
const isCamerOn = ref(true);
const mode = ref('FreeToSpeak');
const tuiRoomParam = {
  isOpenCamera: true,
  isOpenMicrophone: true,
  defaultCameraId: '',
  defaultMicrophoneId: '',
  defaultSpeakerId: '',
};
const emit = defineEmits(['create-room', 'enter-room', 'update-user-name']);

interface Props {
  userName: string;
  givenRoomId: string | null;
}
const props = defineProps<Props>();
defineExpose({
  getRoomParam,
});
const currentUserName = ref(
  props.userName || `user_${Math.ceil(Math.random() * 10)}`
);

const currentRoomId = ref(props.givenRoomId);

const hasGivenRoomId = computed(
  () => typeof currentRoomId.value === 'string' && currentRoomId.value !== ''
);

function createRoom() {
  showRoomDetail.value = !showRoomDetail.value;
  isJoinRoom.value = false;
}
function enterRoom() {
  showRoomDetail.value = !showRoomDetail.value;
  isJoinRoom.value = true;
}

function scheduleRoom() {
  showScheduleRoom.value = !showScheduleRoom.value;
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
  currentRoomId.value = '';
  showRoomDetail.value = false;
  showMoreType.value = false;
}
function toggle(type: string) {
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
  currentRoomId.value = e.target.value;
}

function handleInputName(e: any) {
  currentUserName.value = e.target.value;
}

function handleDocumentClick(event: MouseEvent) {
  if (showMoreType.value && !moreTypeRef.value.contains(event.target)) {
    showMoreType.value = false;
  }
}

function handleRoomOption(
  type: string,
  params?: {
    roomId: string;
    roomParam?: {
      isOpenCamera?: boolean;
      isOpenMicrophone?: boolean;
    };
  }
) {
  emit('update-user-name', currentUserName.value);
  const roomParam = getRoomParam();
  switch (type) {
    case 'Join':
      if (!currentRoomId.value && !params?.roomId) {
        TUIMessage({
          type: 'error',
          message: t('Please enter the room number'),
        });
        return;
      }
      emit(
        'enter-room',
        params || {
          roomId: String(currentRoomId.value),
          roomParam,
        }
      );
      break;
    case 'New':
      emit('create-room', {
        roomMode: mode.value,
        roomParam,
        isSeatEnabled: Boolean(mode.value === 'SpeakAfterTakingSeat'),
      });
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
.control-container {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: 100%;
  padding-top: 4rem;

  .container-button-group {
    display: flex;
    gap: 20px;
    padding: 18px 26px;
    border-bottom: 1px solid #ccc;

    .button-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      justify-content: center;
      width: 90px;
      height: 80px;
      font-size: 14px;
      color: #fff;
      text-align: center;
      background-color: #006eff;
      border-radius: 8px;

      .button-icon {
        width: 22px;
        height: 22px;
        background-size: cover;
      }
    }
  }

  .conference-list-container {
    width: 100%;
    height: 100%;
    overflow: auto;

    .list-empty {
      display: flex;
      flex-direction: column;
      gap: 20px;
      align-items: center;
      width: 100%;
      height: 100%;
      margin-top: 36%;
      font-size: 14px;
      color: #8f9ab2;
      text-align: center;
    }
  }
}

.container-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 80px;
}

.container-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.container-bottom {
  display: flex;
  flex-direction: column;
  width: 210px;
  padding-top: 250px;
}

.create-room {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 6%;
  margin-top: 5%;
  background-image: linear-gradient(-45deg, #006eff 0%, #0c59f2 100%);
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
}

.add-icon {
  width: 22px;
  height: 22px;
  background-size: cover;
}

.join-room {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 6%;
  background-image: linear-gradient(-45deg, #006eff 0%, #0c59f2 100%);
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2);
}

.enter-icon {
  width: 22px;
  height: 22px;
  background-size: cover;
}

.title {
  padding-left: 10px;
  line-height: 34px;
  color: #fff;
}

.room-detail {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 9;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100vw;
  height: auto;
  overflow-y: scroll;
  background: var(--room-detail);
}

.room-detail-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5%;
  background: var(--room-detail-background);

  &-title {
    flex: 1;
    color: var(--room-detail-title);
    text-align: center;
  }
}

.close-icon {
  position: absolute;
  left: 22px;
  width: 10px;
  height: 18px;
  background-size: cover;
}

.room-detail-middle {
  width: 90%;
}

.room-detail-info {
  margin-top: 20px;
  background: var(--room-detail-background);
  border-radius: 6px;
}

.room-detail-info-box {
  display: flex;
  align-items: center;
  padding: 15px 12px;
}

.room-detail-title {
  min-width: 64px;
  color: var(--room-detail-title);
}

.chevron-down-icon {
  display: flex;
  width: 14px;
  height: 9px;
}

.room-show-title {
  flex: 1;
  padding-left: 26px;
  color: var(--room-detail-title);
}

.room-show-name {
  flex: 1;
  max-width: 180px;
  padding-left: 56px;
  overflow: hidden;
  color: var(--room-detail-title);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.roomid-input {
  flex: 1;
  width: 100%;
  padding-left: 56px;
  font-size: 16px;
  color: #676c80;
  background: var(--room-detail-background);
  border: 0;
  outline: none;
}

.room-detail-setting {
  margin-top: 20px;
  background: var(--room-detail-background);
  border-radius: 6px;
}

.room-detail-setting-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 12px;
  color: var(--room-detail-title);
}

.room-detail-bottom {
  position: absolute;
  bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  padding: 10px;
  background-image: linear-gradient(-45deg, #006eff 0%, #0c59f2 100%);
  border-radius: 8px;
}

.button {
  padding: 0 5.75rem;
  color: white;
}

.room-type-container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 11;
  width: 100vw;
  padding-bottom: 25px;
  background: var(--log-out-cancel);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transition: all 0.25s linear;
}

.close-room-type-container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 11;
  width: 100vw;
  height: 0;
  background: var(--log-out-cancel);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  transition: all 0.25s linear;
}

.room-choose-mobile {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 9;
  box-sizing: border-box;
  width: 100vw;
  height: auto;
  background: var(--log-out-mobile);
}

.room-choose-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.choose-cancel {
  z-index: 11;
  padding: 20px;
  color: var(--room-detail-title);
}

.choose-confirm {
  z-index: 11;
  padding: 20px;
  color: #146efa;
}

.room-type-hidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--log-out-cancel);
  border-radius: 13px;
}

.room-choose-title {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
}

.room-current-title {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px;
  color: var(--room-detail-title);
  background: var(--choose-type);
}

.slider {
  &-box {
    display: flex;
    align-items: center;
    width: 44px;
    height: 24px;
    background: #e1e1e3;
    border-radius: 15px;
  }

  &-open {
    justify-content: flex-end;
    background: #006eff !important;
  }

  &-block {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin: 0 2px;
    background: #fff;
    border: 0 solid rgba(0, 0, 0, 0.85);
    border-radius: 8px;
    box-shadow: 0 2px 4px 0 #d1d1d1;
  }
}
</style>
