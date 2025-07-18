<template>
  <div class="control-container">
    <div class="container-button-group">
      <div class="button-item" @click="enterRoom">
        <IconEnterRoom size="22" class="button-icon" />
        <span>{{ t('Join Room') }}</span>
      </div>
      <div class="button-item" @click="createRoom">
        <IconCreateRoom size="22" class="button-icon" />
        <span>{{ t('New Room') }}</span>
      </div>
      <div class="button-item" @click="scheduleRoom">
        <IconScheduleRoom size="22" class="button-icon" />
        <span>{{ t('Schedule') }}</span>
      </div>
    </div>
    <div class="conference-list-container">
      <ScheduleRoomList @join-conference="handleRoomOption('Join', $event)" />
    </div>
    <div v-if="showRoomDetail || hasGivenRoomId" class="room-detail">
      <div class="room-detail-header">
        <IconArrowStrokeBack v-tap="handleClose" class="close-icon" />
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
              v-model="roomId"
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
            <IconArrowStrokeSelectDown class="chevron-down-icon" size="14" />
          </div>
          <div class="room-detail-info-box">
            <span class="room-detail-title">{{ t('Your Name') }}</span>
            <span class="roomid-input"> {{ currentUserName }} </span>
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
import {
  IconEnterRoom,
  IconCreateRoom,
  IconScheduleRoom,
  IconArrowStrokeSelectDown,
  IconArrowStrokeBack,
  TUIToast,
  TOAST_TYPE,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomStore } from '../../../stores/room';
import useRoomControl from './useRoomControlHooks';
import vTap from '../../../directives/vTap';
import ScheduleRoomList from '../../ScheduleConference/ScheduleRoomList.vue';
import ScheduleConferencePanel from '../../ScheduleConference/ScheduleConferencePanel';

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
const roomId = ref('');
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
const currentUserName = ref();

watch(
  () => props.userName,
  val => {
    currentUserName.value = val ? val : `user_${Math.ceil(Math.random() * 10)}`;
  },
  { immediate: true }
);

const hasGivenRoomId = computed(
  () => typeof props.givenRoomId === 'string' && props.givenRoomId !== ''
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
  roomId.value = e.target.value;
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
  const roomParam = getRoomParam();
  switch (type) {
    case 'Join':
      if (!roomId.value && !params?.roomId) {
        TUIToast({
          type: TOAST_TYPE.ERROR,
          message: t('Please enter the room number'),
        });
        return;
      }
      emit(
        'enter-room',
        params || {
          roomId: String(roomId.value),
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
  height: 100vh;
  padding-top: 4rem;

  .container-button-group {
    display: flex;
    gap: 20px;
    padding: 18px 26px;
    border-bottom: 1px solid var(--stroke-color-primary);

    .button-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      justify-content: center;
      width: 90px;
      height: 80px;
      font-size: 14px;
      color: var(--text-color-button);
      text-align: center;
      background-color: var(--button-color-primary-default);
      border-radius: 8px;

      .button-icon {
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
      color: var(--uikit-color-gray-7);
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
  background-image: linear-gradient(
    -45deg,
    var(--uikit-color-theme-5) 0%,
    var(--uikit-color-theme-7) 100%
  );
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 var(--uikit-color-black-7);
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
  background-image: linear-gradient(
    -45deg,
    var(--uikit-color-theme-5) 0%,
    var(--uikit-color-theme-7) 100%
  );
  border-radius: 8px;
  box-shadow: 0 2px 4px 0 var(--uikit-color-black-7);
}

.enter-icon {
  width: 22px;
  height: 22px;
  background-size: cover;
}

.title {
  padding-left: 10px;
  line-height: 34px;
  color: var(--uikit-color-white-1);
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
  background-color: var(--bg-color-topbar);
}

.room-detail-header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 5%;
  background-color: var(--bg-color-operate);

  &-title {
    flex: 1;
    color: var(--text-color-primary);
    text-align: center;
  }
}

.close-icon {
  position: absolute;
  left: 22px;
  background-size: cover;
}

.room-detail-middle {
  width: 90%;
}

.room-detail-info {
  margin-top: 20px;
  background-color: var(--bg-color-operate);
  border-radius: 6px;
}

.room-detail-info-box {
  display: flex;
  align-items: center;
  padding: 15px 12px;
}

.room-detail-title {
  min-width: 64px;
  color: var(--text-color-primary);
}

.chevron-down-icon {
  display: flex;
}

.room-show-title {
  flex: 1;
  padding-left: 26px;
  color: var(--text-color-primary);
}

.room-show-name {
  flex: 1;
  max-width: 180px;
  padding-left: 56px;
  overflow: hidden;
  color: var(--text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.roomid-input {
  flex: 1;
  width: 100%;
  padding-left: 56px;
  font-size: 16px;
  color: var(--text-color-primary);
  background-color: var(--bg-color-operate);
  border: 0;
  outline: none;
}

.room-detail-setting {
  margin-top: 20px;
  background-color: var(--bg-color-operate);
  border-radius: 6px;
}

.room-detail-setting-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 12px;
  color: var(--text-color-primary);
}

.room-detail-bottom {
  position: absolute;
  bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90%;
  padding: 10px;
  background-image: linear-gradient(
    -45deg,
    var(--uikit-color-theme-5) 0%,
    var(--uikit-color-theme-7) 100%
  );
  border-radius: 8px;
}

.button {
  padding: 0 5.75rem;
  color: var(--uikit-color-white-1);
}

.room-type-container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 11;
  width: 100vw;
  padding-bottom: 25px;
  background-color: var(--bg-color-operate);
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
  background-color: var(--bg-color-operate);
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
  background: var(--uikit-color-black-3);
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
  color: var(--text-color-primary);
}

.choose-confirm {
  z-index: 11;
  padding: 20px;
  color: var(--uikit-color-theme-5);
}

.room-type-hidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  color: var(--text-color-link);
}

.slider {
  &-box {
    display: flex;
    align-items: center;
    width: 44px;
    height: 24px;
    background: var(--uikit-color-white-2);
    border-radius: 15px;
  }

  &-open {
    justify-content: flex-end;
    background: var(--uikit-color-theme-5) !important;
  }

  &-block {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin: 0 2px;
    background: var(--uikit-color-white-1);
    border: 0 solid var(--uikit-color-black-2);
    border-radius: 8px;
    box-shadow: 0 2px 4px 0 var(--uikit-color-white-2);
  }
}
</style>
