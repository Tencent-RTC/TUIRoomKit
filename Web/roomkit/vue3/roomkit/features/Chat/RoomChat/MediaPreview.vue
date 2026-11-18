<template>
  <button
    type="button"
    class="chat-media-preview"
    :class="{
      'is-video': kind === 'video',
      'is-mobile': mobile,
    }"
    :aria-label="kind === 'video' ? t('RoomChat.play_video') : undefined"
    @click.stop="openPreview"
  >
    <img
      v-if="kind === 'image'"
      class="chat-media-preview-image"
      :src="thumbSrc"
      :alt="t('RoomChat.image_alt')"
    >
    <template v-else>
      <img
        v-if="poster"
        class="chat-media-preview-poster"
        :src="poster"
        alt=""
      >
      <span class="chat-media-preview-play" aria-hidden="true">
        <IconChatVideo :size="18" />
      </span>
      <span v-if="duration" class="chat-media-preview-duration">{{ duration }}</span>
    </template>
  </button>
  <TUIDialog
    v-if="open"
    :open="open"
    :title="dialogTitle"
    confirm-text=""
    cancel-text=""
    width="min(720px, calc(100% - 48px))"
    @update:open="onDialogOpen"
  >
    <div
      class="chat-media-preview-stage"
      @wheel.prevent="onWheel"
    >
      <img
        v-if="kind === 'image'"
        class="chat-media-preview-full"
        :src="src"
        alt=""
        draggable="false"
        :style="{ transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)` }"
        @mousedown.prevent="onDragStart"
      >
      <video
        v-else
        class="chat-media-preview-player"
        :src="src"
        :poster="poster || undefined"
        controls
        playsinline
        autoplay
      />
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { IconChatVideo, TUIDialog, TUIToast, t } from '../../../base';

defineOptions({ name: 'MediaPreview' });

const props = withDefaults(defineProps<{
  /** Address opened in the preview. */
  src: string;
  kind?: 'image' | 'video';
  /** Thumbnail. Images fall back to `src`. */
  poster?: string;
  duration?: string;
  mobile?: boolean;
}>(), {
  kind: 'image',
  poster: '',
  duration: '',
  mobile: false,
});

const open = ref(false);
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
let dragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOriginX = 0;
let dragOriginY = 0;

const thumbSrc = computed(() => props.poster || props.src);
const dialogTitle = computed(() => (
  props.kind === 'video' ? t('RoomChat.video_preview') : t('RoomChat.image_preview')
));

function resetView() {
  scale.value = 1;
  offsetX.value = 0;
  offsetY.value = 0;
}

function openPreview() {
  if (!props.src) {
    TUIToast.error(t('RoomChat.media_unavailable'));
    return;
  }
  resetView();
  open.value = true;
}

function onDialogOpen(next: boolean) {
  open.value = next;
  if (!next) resetView();
}

function onWheel(event: WheelEvent) {
  if (props.kind !== 'image') return;
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  scale.value = Math.min(5, Math.max(1, scale.value + delta));
  if (scale.value === 1) {
    offsetX.value = 0;
    offsetY.value = 0;
  }
}

function onDragStart(event: MouseEvent) {
  if (scale.value === 1) return;
  dragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOriginX = offsetX.value;
  dragOriginY = offsetY.value;
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragEnd);
}

function onDragMove(event: MouseEvent) {
  if (!dragging) return;
  offsetX.value = dragOriginX + (event.clientX - dragStartX) / scale.value;
  offsetY.value = dragOriginY + (event.clientY - dragStartY) / scale.value;
}

function onDragEnd() {
  dragging = false;
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragEnd);
}

onBeforeUnmount(onDragEnd);
</script>

<style scoped lang="scss">
.chat-media-preview {
  position: relative;
  display: block;
  max-width: 200px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: 8px;
}

.chat-media-preview-image {
  display: block;
  width: auto;
  max-width: 200px;
  height: auto;
  max-height: 200px;
  object-fit: contain;
}

.chat-media-preview.is-video {
  width: 200px;
  height: 112px;
}

.chat-media-preview-poster {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-media-preview-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rk-white);
  pointer-events: none;

  &::before {
    position: absolute;
    width: 36px;
    height: 36px;
    content: '';
    background: color-mix(in srgb, black 45%, transparent);
    border-radius: 50%;
  }

  :deep(svg) {
    position: relative;
    z-index: 1;
  }
}

.chat-media-preview-duration {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 1px 5px;
  font-size: var(--rk-fs-sm);
  line-height: 14px;
  color: var(--rk-white);
  background: color-mix(in srgb, black 45%, transparent);
  border-radius: 4px;
}

.chat-media-preview.is-mobile {
  max-width: 190px;
}

.chat-media-preview.is-mobile .chat-media-preview-image {
  max-width: 190px;
  max-height: 150px;
  object-fit: cover;
}

.chat-media-preview.is-mobile.is-video {
  width: auto;
  height: auto;
  max-height: 150px;
}

.chat-media-preview.is-mobile .chat-media-preview-poster {
  width: auto;
  max-width: 190px;
  height: auto;
  max-height: 150px;
  object-fit: contain;
}

.chat-media-preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  height: min(70vh, 560px);
  overflow: hidden;
  touch-action: none;
  background: var(--rk-bg-muted);
  border-radius: var(--rk-radius-md);
}

.chat-media-preview-full {
  max-width: 100%;
  max-height: 100%;
  cursor: grab;
  user-select: none;
  object-fit: contain;
  -webkit-user-drag: none;
  transition: transform 0.05s linear;
}

.chat-media-preview-full:active {
  cursor: grabbing;
}

.chat-media-preview-player {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
