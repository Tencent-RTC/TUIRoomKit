<template>
  <div
    v-click-outside="closeMenu"
    class="screen-share-button-wrapper"
  >
    <icon-button
      :title="screenShareTitle"
      :disabled="isScreenShareDisabled"
      :is-active="showMenu"
      @click-icon="handleScreenShare"
      @click-more="toggleMenu"
    >
      <IconStopScreenShare v-if="isBusy" size="24" />
      <IconScreenShare
        v-else
        size="24"
      />
      <IconUnSupport
        v-if="screenLastError !== DeviceError.NoError"
        class="un-support-icon"
        size="14"
      />
    </icon-button>
    <transition name="menu-fade">
      <div
        v-show="showMenu && canShowMenu"
        class="dropdown-menu"
        @click.stop
      >
        <div class="dropdown-item" @click="handleSelectScreenShare">
          <IconScreenShare size="20" />
          <span class="dropdown-item-text">{{ t('ScreenShare.StartSharing') }}</span>
        </div>
        <div
          v-if="showWhiteboardEntry"
          class="dropdown-item"
          @click="handleSelectWhiteboard"
        >
          <component :is="IconWhiteboard" :size="20" />
          <span class="dropdown-item-text">{{ t('Whiteboard.Open') }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IconScreenShare, IconStopScreenShare, TUIMessageBox, TUIToast, useUIKit, IconUnSupport } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState, DeviceStatus, useRoomState, useRoomParticipantState, RoomParticipantRole, DeviceError, TUIErrorCode, RoomType, useWhiteboardState } from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import { clearLocalScreenSharePreviewConfirmation } from '../../adapter/screenSharePreview';
import { BuiltinWidget, InterceptorAction } from '../../adapter/type';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';
import { IconWhiteboard, STANDALONE_WHITEBOARD_CANVAS_COLOR } from '../Whiteboard/constants';
import { useWhiteboardToolbar } from '../Whiteboard/useWhiteboardToolbar';

const { currentRoom } = useRoomState();
const { localParticipant, participantWithScreen, participantList } = useRoomParticipantState();
const { screenStatus, screenLastError, startScreenShare, stopScreenShare } = useDeviceState();
const { startWhiteboard, stopWhiteboard } = useWhiteboardState();
const { isStandaloneWhiteboard } = useWhiteboardToolbar();
const { t } = useUIKit();

const showMenu = ref(false);

const notWebinar = computed(() => currentRoom.value?.roomType !== RoomType.Webinar);
const showWhiteboardEntry = computed(() => notWebinar.value && conference.getWidgetVisible(BuiltinWidget.WhiteboardWidget));
const isLocalScreenShareUser = computed(() => participantWithScreen.value && participantWithScreen.value.userId === localParticipant.value?.userId);
const isWhiteboardOn = computed(() => isStandaloneWhiteboard.value);
const isBusy = computed(() => screenStatus.value === DeviceStatus.On || isWhiteboardOn.value);
const isRemoteSharing = computed(() => !!participantWithScreen.value && !isLocalScreenShareUser.value);

const isScreenShareDisabled = computed(() => currentRoom.value?.isAllScreenShareDisabled && localParticipant.value?.role === RoomParticipantRole.GeneralUser && !isLocalScreenShareUser.value);
const canShowMenu = computed(() => showWhiteboardEntry.value && !isBusy.value && !isScreenShareDisabled.value);
const screenShareTitle = computed(() => {
  if (screenStatus.value === DeviceStatus.On) {
    return t('ScreenShare.EndSharing');
  }
  if (isWhiteboardOn.value) {
    return t('Whiteboard.Close');
  }
  return t('ScreenShare.Title');
});

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}

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
  const otherParticipantPublishedVideo = participantList.value.some(
    participant => participant.userId !== localParticipant.value?.userId
      && participant.cameraStatus === DeviceStatus.On
      && isRoleEqualOrHigher(participant.role),
  );
  return isWebinar && otherParticipantPublishedVideo;
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

async function handleStartScreenShare() {
  try {
    clearLocalScreenSharePreviewConfirmation();
    await startScreenShare({ screenAudio: true });
  } catch (error: unknown) {
    const err = error as { code?: number; name?: string; message?: string };
    let message = t('ScreenShare.UnknownErrorOccurredWhileSharing');
    switch (err.name) {
      case 'NotReadableError':
        message = t('ScreenShare.SystemProhibitsAccessScreenContent');
        break;
      case 'NotAllowedError':
        if (err.message?.includes('Permission denied by system')) {
          message = t('ScreenShare.SystemProhibitsAccessScreenContent');
        } else {
          message = t('ScreenShare.UserCanceledScreenSharing');
        }
        break;
      default:
        break;
    }
    if (err.code === TUIErrorCode.ERR_OPEN_SCREEN_SHARE_NEED_PERMISSION_FROM_ADMIN) {
      message = t('ScreenShare.NotAllowedToShareScreen');
    }
    const ERROR_SPEAKER_LIMIT_EXCEEDED = 100253;
    if (err?.code === ERROR_SPEAKER_LIMIT_EXCEEDED) {
      message = t('ScreenShare.HigherRoleParticipantPublishingInWebinar');
    }
    if (err.code === TUIErrorCode.ERR_FREQ_LIMIT) {
      message = t('RoomCommon.FrequencyLimit');
    }
    TUIToast.warning({
      message,
    });
  }
}

async function doStartScreenShare() {
  await conference.executeInterceptor(InterceptorAction.StartScreenShare, () => {
    TUIMessageBox.confirm({
      title: t('ScreenShare.StartSharing'),
      content: t('ScreenShare.StartSharingConfirm'),
      callback: async (action) => {
        if (action === 'confirm') {
          await handleStartScreenShare();
        }
      },
    });
  });
}

async function startScreenShareFlow() {
  if (isScreenShareDisabled.value) {
    TUIToast.warning({
      message: t('ScreenShare.NotAllowedToShareScreen'),
    });
    return;
  }
  if (isRemoteSharing.value) {
    TUIToast.warning({
      message: t('ScreenShare.AnotherIsSharingTheScreen'),
    });
    return;
  }
  if (screenLastError.value === DeviceError.NotSupportCapture) {
    TUIToast.warning({
      message: t('ScreenShare.BrowserDoesNotSupportScreenSharing'),
    });
    return;
  }
  if (isHigherRoleParticipantPublishingInWebinar.value) {
    TUIToast.warning({
      message: t('ScreenShare.HigherRoleParticipantPublishingInWebinar'),
    });
    return;
  }
  if (isLowerRoleParticipantPublishingInWebinar.value) {
    TUIMessageBox.confirm({
      title: t('ScreenShare.SomeonePresentingTitle'),
      content: t('ScreenShare.SomeonePresentingConfirm'),
      callback: async (action) => {
        if (action === 'confirm') {
          await doStartScreenShare();
        }
      },
    });
    return;
  }
  await doStartScreenShare();
}

function handleSelectScreenShare() {
  closeMenu();
  void startScreenShareFlow();
}

async function handleSelectWhiteboard() {
  closeMenu();
  if (isRemoteSharing.value) {
    TUIToast.warning({
      message: t('ScreenShare.AnotherIsSharingTheScreen'),
    });
    return;
  }
  try {
    // Standalone whiteboard runs on a white canvas without a real screen share.
    await startWhiteboard({ canvasColor: STANDALONE_WHITEBOARD_CANVAS_COLOR });
  } catch (error) {
    console.error('[ScreenShareButton] start whiteboard failed:', error);
    TUIToast.warning({ message: t('Whiteboard.StartFailed') });
  }
}

function handleStopScreenShare() {
  conference.executeInterceptor(InterceptorAction.StopScreenShare, () => {
    TUIMessageBox.confirm({
      title: t('ScreenShare.EndSharing'),
      content: t('ScreenShare.StopSharingConfirm'),
      callback: async (action) => {
        if (action === 'confirm') {
          await stopScreenShare();
        }
      },
    });
  });
}

function handleStopWhiteboard() {
  TUIMessageBox.confirm({
    title: t('Whiteboard.CloseConfirmTitle'),
    content: t('Whiteboard.CloseConfirmContent'),
    callback: async (action) => {
      if (action === 'confirm') {
        await stopWhiteboard();
      }
    },
  });
}

function handleScreenShare() {
  if (isWhiteboardOn.value) {
    handleStopWhiteboard();
    return;
  }
  if (screenStatus.value === DeviceStatus.On) {
    handleStopScreenShare();
    return;
  }
  if (isScreenShareDisabled.value) {
    TUIToast.warning({
      message: t('ScreenShare.NotAllowedToShareScreen'),
    });
    return;
  }
  if (!showWhiteboardEntry.value) {
    void startScreenShareFlow();
    return;
  }
  toggleMenu();
}
</script>

<style scoped lang="scss">
.screen-share-button-wrapper {
  position: relative;
  flex-shrink: 0;
}

.un-support-icon {
  position: absolute;
  top: 13px;
  left: 26px;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 1000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  white-space: nowrap;
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--uikit-color-black-16);
  transform: translateX(-50%);

  .dropdown-item {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    color: var(--text-color-primary);
    cursor: pointer;
    border-radius: 6px;

    &:hover {
      background: var(--button-color-secondary-hover);
    }

    .dropdown-item-text {
      font-size: 14px;
      line-height: 22px;
    }
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
