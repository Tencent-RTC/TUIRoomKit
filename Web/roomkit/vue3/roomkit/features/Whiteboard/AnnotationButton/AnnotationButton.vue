<template>
  <TUIButton
    v-if="isShareTile"
    class="annotation-button"
    variant="primary"
    size="sm"
    @click.stop="toggle"
  >
    <template #icon>
      <IconMark :size="10" />
    </template>
    {{ isAnnotationOn ? t('Whiteboard.EndAnnotation') : t('Whiteboard.Annotation') }}
  </TUIButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  DeviceStatus,
  VideoStreamType,
  useDeviceState,
  useLoginState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';
import { IconMark, TUIButton, t } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
}>();

const { loginUserInfo } = useLoginState();
const { screenStatus } = useDeviceState();
const { isAnnotationOn, startAnnotation, stopAnnotation } = useWhiteboardState();

const isLocal = computed(() => props.participant.userId === loginUserInfo.value?.userId);
/** A local share tile without a real screen share is the local board, whose toolbar stays open. */
const isLocalBoard = computed(() => isLocal.value && screenStatus.value === DeviceStatus.Off);
const isShareTile = computed(() => props.streamType === VideoStreamType.Screen && !isLocalBoard.value);

function toggle() {
  const run = isAnnotationOn.value ? stopAnnotation() : startAnnotation();
  run.catch((error: unknown) => {
    console.warn('[AnnotationButton] toggle annotation failed:', error);
  });
}
</script>

<style scoped lang="scss">
/* Same chip as the "sharing screen" badge on the opposite corner of the share tile. */
.rk-btn.annotation-button {
  gap: 4px;
  height: auto;
  padding: 4px 9px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  line-height: inherit;
  color: #fff;
  white-space: nowrap;
  pointer-events: auto;
  background: rgba(77, 124, 255, 0.92);
  backdrop-filter: blur(4px);
  border: none;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(77, 124, 255, 0.35);

  &:hover:not(:disabled) {
    background: rgba(77, 124, 255, 1);
  }
}
</style>
