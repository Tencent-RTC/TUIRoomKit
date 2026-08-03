<template>
  <button
    class="whiteboard-entry-button-h5"
    :disabled="isProcessing"
    @click="handleClick"
  >
    <IconButtonH5 :title="title" :disabled="isProcessing">
      <component :is="IconWhiteboard" :size="24" />
    </IconButtonH5>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useRoomParticipantState,
  useWhiteboardState,
  WhiteboardStatus,
} from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import {
  IconWhiteboard,
  STANDALONE_WHITEBOARD_CANVAS_COLOR,
} from './constants';
import { useWhiteboardToolbar } from './useWhiteboardToolbar';

const { t } = useUIKit();
const { participantWithScreen } = useRoomParticipantState();
const {
  whiteboardStatus,
  startWhiteboard,
  stopWhiteboard,
} = useWhiteboardState();
const { isStandaloneWhiteboard } = useWhiteboardToolbar();

const isProcessing = ref(false);
const title = computed(() =>
  isStandaloneWhiteboard.value
    ? t('Whiteboard.Close')
    : t('Whiteboard.Open'),
);

async function stopStandaloneWhiteboard() {
  TUIMessageBox.confirm({
    title: t('Whiteboard.CloseConfirmTitle'),
    content: t('Whiteboard.CloseConfirmContent'),
    callback: async (action) => {
      if (action !== 'confirm') {
        return;
      }
      isProcessing.value = true;
      try {
        await stopWhiteboard();
      } finally {
        isProcessing.value = false;
      }
    },
  });
}

async function handleClick() {
  if (isProcessing.value) {
    return;
  }
  if (isStandaloneWhiteboard.value) {
    await stopStandaloneWhiteboard();
    return;
  }
  if (whiteboardStatus.value === WhiteboardStatus.On) {
    TUIToast.warning({ message: t('Whiteboard.CloseWhiteboardFirst') });
    return;
  }
  if (participantWithScreen.value) {
    TUIToast.warning({ message: t('ScreenShare.AnotherIsSharingTheScreen') });
    return;
  }

  isProcessing.value = true;
  try {
    await startWhiteboard({
      canvasColor: STANDALONE_WHITEBOARD_CANVAS_COLOR,
    });
  } catch (error) {
    console.error('[WhiteboardEntryButtonH5] start whiteboard failed:', error);
    TUIToast.warning({ message: t('Whiteboard.StartFailed') });
  } finally {
    isProcessing.value = false;
  }
}
</script>

<style lang="scss" scoped>
.whiteboard-entry-button-h5 {
  display: block;
  width: 52px;
  height: 52px;
  padding: 0;
  border: none;
  color: inherit;
  background: transparent;

  &:disabled {
    cursor: wait;
  }
}
</style>
