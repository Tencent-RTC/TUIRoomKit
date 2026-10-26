<template>
  <!-- Single root: TUITooltip renders two, which would drop the position this anchor takes. -->
  <div v-if="visible" class="annotation-button-anchor" :class="{ 'is-active': active }">
    <TUITooltip :content="label" placement="top">
      <div
        class="annotation-button"
        :class="{ 'is-active': active }"
        role="button"
        :aria-label="label"
        :aria-pressed="active"
        @click.stop="toggle"
        @dblclick.stop
      >
        <IconMark :size="18" />
      </div>
    </TUITooltip>
  </div>
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
import { IconMark, TUITooltip, t } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';

const props = defineProps<{
  participant: RoomParticipant;
  streamType: VideoStreamType;
}>();

const { loginUserInfo } = useLoginState();
const { screenStatus } = useDeviceState();
const { isAnnotationOn, startAnnotation, stopAnnotation } = useWhiteboardState();

const isLocal = computed(() => props.participant.userId === loginUserInfo.value?.userId);
/** A local share tile without a real screen share is the local board, which is always drawable. */
const isLocalBoard = computed(() => isLocal.value && screenStatus.value === DeviceStatus.Off);
const visible = computed(() => props.streamType === VideoStreamType.Screen && !isLocalBoard.value);
/** The state picks host or guest from who shares, so only this tile's sharer can own the session. */
const active = computed(() => isAnnotationOn.value && !isLocalBoard.value);
const label = computed(() => (active.value ? t('Whiteboard.Collapse') : t('Whiteboard.Annotation')));

async function toggle() {
  await (active.value ? stopAnnotation() : startAnnotation());
}
</script>

<style scoped lang="scss">
/* Clears the name pill along the tile's bottom-left edge. */
.annotation-button-anchor {
  position: absolute;
  bottom: 48px;
  left: 12px;
  z-index: 5;
  display: flex;
}

/* The plugin draws from pointer events on its own root, so while annotating the tile
   overlay above it lets them through and keeps only its more chip clickable. */
:global(:has(> .annotation-button-anchor.is-active) > .participant-view-overlay) {
  pointer-events: none;
}

:global(:has(> .annotation-button-anchor.is-active) > .participant-view-overlay .participant-view-overlay-more) {
  pointer-events: auto;
}

/* Media chrome: it sits on the shared picture, so it does not follow the theme. */
.annotation-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #34c759;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.62);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--rk-radius-pill);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transition: background 0.15s ease;
}

.annotation-button:hover,
.annotation-button.is-active {
  background: rgba(0, 0, 0, 0.45);
}
</style>
