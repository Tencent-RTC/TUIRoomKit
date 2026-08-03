<template>
  <div
    class="whiteboard-dock-h5"
    @click.stop
    @pointerdown.stop
    @touchstart.stop
  >
    <WhiteboardButton
      v-show="!expanded"
      :disabled="isStartingAnnotation"
      @click="handleOpenAnnotation"
    />
    <WhiteboardToolbarH5
      v-if="isSessionOwner && whiteboardStatus === WhiteboardStatus.On"
      v-show="expanded"
      @collapse="expanded = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  useRoomParticipantState,
  useWhiteboardState,
  WhiteboardStatus,
} from 'tuikit-atomicx-vue3/room';
import { SCREEN_ANNOTATION_CANVAS_COLOR } from './constants';
import { useWhiteboardSessionContext } from './useWhiteboardSessionContext';
import WhiteboardButton from './WhiteboardButton.vue';
import WhiteboardToolbarH5 from './WhiteboardToolbarH5.vue';

const props = defineProps<{
  viewEl?: HTMLElement;
  participantUserId?: string;
}>();

const { t } = useUIKit();
const {
  whiteboardStatus,
  startWhiteboard,
} = useWhiteboardState();
const { localParticipant } = useRoomParticipantState();
const { sessionOwnerUserId } = useWhiteboardSessionContext();

const expanded = ref(false);
const isStartingAnnotation = ref(false);

const isSessionOwner = computed(() => {
  if (whiteboardStatus.value !== WhiteboardStatus.On) {
    return false;
  }
  const participantUserId = props.participantUserId ?? localParticipant.value?.userId;
  return Boolean(
    participantUserId
    && sessionOwnerUserId.value === participantUserId,
  );
});

async function handleOpenAnnotation() {
  if (isStartingAnnotation.value) {
    return;
  }
  if (isSessionOwner.value) {
    expanded.value = true;
    return;
  }
  if (whiteboardStatus.value === WhiteboardStatus.On) {
    return;
  }

  isStartingAnnotation.value = true;
  try {
    if (!props.viewEl) {
      throw new Error('screen share view is not ready');
    }
    await startWhiteboard({
      view: props.viewEl,
      canvasColor: SCREEN_ANNOTATION_CANVAS_COLOR,
    });
    expanded.value = true;
  } catch (error) {
    console.error('[WhiteboardDockH5] start annotation failed:', error);
    TUIToast.warning({ message: t('Whiteboard.StartFailed') });
  } finally {
    isStartingAnnotation.value = false;
  }
}

watch(
  isSessionOwner,
  (owned) => {
    expanded.value = owned;
  },
  { immediate: true },
);

defineExpose({
  collapse: () => {
    expanded.value = false;
  },
});
</script>

<style lang="scss" scoped>
.whiteboard-dock-h5 {
  position: absolute;
  right: max(12px, env(safe-area-inset-right));
  bottom: calc(104px + env(safe-area-inset-bottom));
  z-index: 11;
  pointer-events: auto;

  :deep(.whiteboard-button) {
    width: 44px;
    height: 44px;
    cursor: pointer;
  }
}
</style>
