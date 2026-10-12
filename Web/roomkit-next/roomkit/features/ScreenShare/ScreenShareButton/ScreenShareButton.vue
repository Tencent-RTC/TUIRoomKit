<template>
  <ToolbarButton
    :label="label"
    :icon="IconShare"
    :active="isLocalSharing"
    :blocked="isShareBlocked"
    :loading="isBusy"
    :notice="hasScreenFault"
    @click="handleClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconShare, TUIMessageBox, TUIToast } from '../../../base';
import { t } from '../../../i18n';
import ToolbarButton from '../../../layouts/ToolbarButton.vue';
import { useScreenShare } from './useScreenShare';
import { confirmStopScreenShare } from './confirmStopScreenShare';
import type { ScreenShareFailure } from './useScreenShare';

const {
  isBusy,
  canShareScreen,
  hasScreenFault,
  isScreenCaptureUnsupported,
  isLocalSharing,
  isRemoteSharing,
  startScreenShare,
  stopScreenShare,
} = useScreenShare();

const label = computed(() => (
  isLocalSharing.value ? t('ScreenShare.Stop') : t('ScreenShare.Share')
));
/** Host and admin keep control; a share already in progress can still be stopped. */
const isShareBlocked = computed(() => !canShareScreen.value && !isLocalSharing.value);

function notifyFailure(reason: ScreenShareFailure) {
  if (reason === 'capture') {
    return;
  }
  const type = reason === 'failed' ? 'error' : 'warning';
  TUIToast[type](t(`ScreenShare.Failure.${reason}`));
}

async function startWithConfirm() {
  if (!canShareScreen.value) {
    notifyFailure('not-allowed');
    return;
  }
  if (isRemoteSharing.value) {
    notifyFailure('remote-sharing');
    return;
  }
  if (!isScreenCaptureUnsupported.value) {
    const confirmed = await TUIMessageBox.confirm({
      title: t('ScreenShare.StartTitle'),
      message: t('ScreenShare.StartMessage'),
      confirmText: t('ScreenShare.StartConfirm'),
      cancelText: t('ScreenShare.Cancel'),
    });
    if (!confirmed) {
      return;
    }
  }
  /**
   * No success toast: when two people start sharing at once the engine keeps
   * only one stream, so a toast here would confirm a share that is about to be
   * dropped. Silence means success; the active button state is the feedback.
   */
  const failure = await startScreenShare();
  if (failure) {
    notifyFailure(failure);
  }
}

function handleClick() {
  void (isLocalSharing.value ? confirmStopScreenShare(stopScreenShare) : startWithConfirm());
}
</script>
