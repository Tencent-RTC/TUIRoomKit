<template>
  <div
    v-click-outside="handleHideVideoSettingTab"
    class="video-control-container"
  >
    <icon-button
      :title="title"
      :has-more="true"
      :disabled="isCameraDisabled"
      @click-icon="handleClickIcon"
      @click-more="handleMore"
    >
      <div class="video-icon-container">
        <template v-if="!currentRoom">
          <IconCameraOn v-if="isCameraTesting" size="24" />
          <IconCameraOff v-else size="24" />
        </template>
        <template v-else>
          <IconCameraOn
            v-if="cameraStatus === DeviceStatus.On"
            size="24"
          />
          <IconCameraOff v-else size="24" />
        </template>
        <IconUnSupport
          v-if="hasNotSupportError"
          class="un-support-icon"
          size="14"
        />
      </div>
    </icon-button>
    <VideoSettingPanel
      v-show="showVideoSettingTab"
      :video-preview-visible="false"
      class="video-tab"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIToast,
  TUIMessageBox,
  IconCameraOn,
  IconCameraOff,
  IconUnSupport,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, useRoomState, DeviceStatus, useRoomParticipantState, DeviceError, RoomParticipantRole, useRoomModal, RoomType } from 'tuikit-atomicx-vue3/room';
import { VideoSettingPanel } from '../VideoSettingPanel';
import { conference } from '../../adapter/conference';
import { InterceptorAction } from '../../adapter/type';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';

const props = defineProps<{
  cameraTestContainer?: HTMLDivElement | string;
}>();

const { t } = useUIKit();
const { handleErrorWithModal } = useRoomModal();
const { cameraStatus, cameraLastError, isCameraTesting, startCameraTest, stopCameraTest, openLocalCamera, closeLocalCamera } = useDeviceState();
const { currentRoom } = useRoomState();
const { localParticipant, participantList } = useRoomParticipantState();

const showVideoSettingTab: Ref<boolean> = ref(false);
const isCameraDisabled = computed(() => {
  if (localParticipant.value?.role === RoomParticipantRole.Owner || localParticipant.value?.role === RoomParticipantRole.Admin) {
    return false;
  }
  if (cameraStatus.value === DeviceStatus.On) {
    return false;
  }
  return currentRoom.value?.isAllCameraDisabled;
});

function isRoleEqualOrHigher(participantRole: RoomParticipantRole): boolean {
  const localRole = localParticipant.value?.role ?? RoomParticipantRole.GeneralUser;
  if (localRole === RoomParticipantRole.GeneralUser) {
    return true;
  }
  if (localRole === RoomParticipantRole.Admin) {
    return participantRole === RoomParticipantRole.Owner || participantRole === RoomParticipantRole.Admin;
  }
  return participantRole === RoomParticipantRole.Owner;
}

const isHigherRoleParticipantPublishingInWebinar = computed(() => {
  const isWebinar = currentRoom.value?.roomType === RoomType.Webinar;
  const lowerRoleParticipantPublishedVideo = participantList.value.some(
    participant => participant.userId !== localParticipant.value?.userId
      && participant.cameraStatus === DeviceStatus.On
      && isRoleEqualOrHigher(participant.role),
  );
  return isWebinar && lowerRoleParticipantPublishedVideo;
});

const isLowerRoleParticipantPublishingInWebinar = computed(() => {
  const isWebinar = currentRoom.value?.roomType === RoomType.Webinar;
  const lowerRoleParticipantPublishedVideo = participantList.value.some(
    participant => participant.userId !== localParticipant.value?.userId
      && participant.cameraStatus === DeviceStatus.On
      && !isRoleEqualOrHigher(participant.role),
  );
  return isWebinar && lowerRoleParticipantPublishedVideo;
});

const hasNotSupportError = computed(() => cameraLastError.value !== DeviceError.NoError);

const title = computed(() => {
  if (!currentRoom.value) {
    return isCameraTesting.value ? t('Camera.Stop') : t('Camera.Start');
  }
  return cameraStatus.value === DeviceStatus.On ? t('Camera.Stop') : t('Camera.Start');
});

// TODO：处理多次连续点击的情况，需要优化
async function handleClickIcon() {
  try {
    if (isCameraDisabled.value) {
      TUIToast.warning({
        message: t('Camera.Disabled'),
      });
      return;
    }
    if (isHigherRoleParticipantPublishingInWebinar.value) {
      TUIToast.warning({
        message: t('Camera.HigherRoleParticipantPublishingInWebinar'),
      });
      return;
    }
    if (!currentRoom.value && props.cameraTestContainer) {
      if (isCameraTesting.value) {
        await stopCameraTest();
      } else {
        await startCameraTest({ view: props.cameraTestContainer });
      }
      return;
    }
    if (cameraStatus.value === DeviceStatus.On) {
      await conference.executeInterceptor(InterceptorAction.CloseCamera, async () => {
        await closeLocalCamera();
      });
    } else if (isLowerRoleParticipantPublishingInWebinar.value) {
      TUIMessageBox.confirm({
        title: t('Camera.SomeonePresentingTitle'),
        content: t('Camera.SomeonePresentingConfirm'),
        callback: async (action) => {
          if (action === 'confirm') {
            try {
              await conference.executeInterceptor(InterceptorAction.OpenCamera, async () => {
                await openLocalCamera();
              });
            } catch (error: any) {
              handleErrorWithModal(error);
              handleErrorWithToast(error);
            }
          }
        },
      });
    } else {
      await conference.executeInterceptor(InterceptorAction.OpenCamera, async () => {
        await openLocalCamera();
      });
    }
  } catch (error: any) {
    handleErrorWithModal(error);
    handleErrorWithToast(error);
  }
}

function handleErrorWithToast(error: { code?: number } | unknown) {
  let message = t('Camera.UnknownError');
  switch (cameraLastError.value) {
    case DeviceError.NotSupportCapture:
      message = t('Camera.NotSupportCapture');
      break;
    case DeviceError.NoSystemPermission:
      message = t('Camera.NoSystemPermission');
      break;
    case DeviceError.OccupiedError:
      message = t('Camera.OccupiedError');
      break;
    case DeviceError.NoDeviceDetected:
      message = t('Camera.NoDeviceDetected');
      break;
    default:
      break;
  }
  const err = error as { code?: number } | undefined;
  const ERROR_SPEAKER_LIMIT_EXCEEDED = 100253;
  switch (err?.code) {
    case ERROR_SPEAKER_LIMIT_EXCEEDED:
      message = t('Camera.HigherRoleParticipantPublishingInWebinar');
      break;
    case TUIErrorCode.ERR_FREQ_LIMIT:
      message = t('RoomCommon.FrequencyLimit');
      break;
    default:
      break;
  }
  TUIToast.warning({
    message,
  });
}

function handleMore() {
  showVideoSettingTab.value = !showVideoSettingTab.value;
}

function handleHideVideoSettingTab() {
  if (showVideoSettingTab.value) {
    showVideoSettingTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
$videoTabWidth: 305px;

.video-icon-container {
  position: relative;
}

.un-support-icon {
  position: absolute;
  bottom: 1px;
  right: 1px;
}

.video-control-container {
  position: relative;
  display: flex;

  .video-tab {
    position: absolute;
    bottom: calc(100% + 12px);
    left: -5px;
    width: $videoTabWidth;
    box-sizing: border-box;
    padding: 20px 20px 24px;
    box-shadow:
      0 2px 4px -3px var(--uikit-color-black-8),
      0 6px 10px 1px var(--uikit-color-black-8),
      0 3px 14px 2px var(--uikit-color-black-8);
    border-radius: 8px;
    background-color: var(--bg-color-dialog);

    &::before {
      position: absolute;
      bottom: -10px;
      left: 30px;
      content: '';
      border-right: 5px solid transparent;
      border-bottom: 5px solid transparent;
      border-left: 5px solid transparent;
      border-top: 5px solid var(--bg-color-dialog);
    }
  }
}
</style>
