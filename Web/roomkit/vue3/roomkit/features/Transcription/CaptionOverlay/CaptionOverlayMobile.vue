<template>
  <div
    class="caption-overlay-mobile"
    role="button"
    tabindex="0"
    @click="emit('open-transcript')"
    @keydown.enter.prevent="emit('open-transcript')"
  >
    <button
      class="caption-overlay-mobile-close"
      type="button"
      :aria-label="t('AITools.SubtitlesClose')"
      @click.stop="hideCaptionOverlay"
    >
      <IconCapCloseMobile :size="14" />
    </button>
    <Subtitle
      :target-language="targetLanguage"
      :caption-mode="captionDisplayMode"
      :pinned="false"
      :avatar-size="16"
      :placeholder-key="asrOn ? 'ASRTools.SubtitlePlaceholder' : 'ASRTools.SubtitleStoppedPlaceholder'"
      :force-placeholder="!asrOn"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconCapCloseMobile, t } from '../../../base';
import { useASRState } from '../useASRState';
import { useSubtitleViewState } from '../useSubtitleViewState';
import Subtitle from './Subtitle.vue';
import { useSubtitleIdle } from './useSubtitleIdle';

const emit = defineEmits<{
  'open-transcript': [];
}>();

const {
  hideCaptionOverlay,
  capViewOpen,
  enableHintVisible,
  hasCaptionMessages,
} = useSubtitleViewState();
const { targetLanguage, asrOn, captionDisplayMode } = useASRState();

useSubtitleIdle(
  computed(() => asrOn.value && capViewOpen.value),
  computed(() => enableHintVisible.value || hasCaptionMessages.value),
);
</script>

<style scoped lang="scss">
.caption-overlay-mobile {
  position: absolute;
  right: 10px;
  bottom: 12px;
  left: 10px;
  z-index: 30;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease;
}

.caption-overlay-mobile:active:not(:has(.caption-overlay-mobile-close:active)) {
  transform: scale(0.98);
}

.caption-overlay-mobile:has(.cap-panel[style*='display: none']) {
  display: none;
}

.caption-overlay-mobile-close {
  position: absolute;
  top: 2px;
  right: 2px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.caption-overlay-mobile-close:active {
  background: var(--rk-bg-press, var(--rk-bg-hover));
  transform: scale(0.94);
}

.caption-overlay-mobile-close::before {
  position: absolute;
  inset: -6px;
  content: '';
}

.caption-overlay-mobile :deep(.cap-panel.cap-panel) {
  --cap-action-reserve: 28px;
  --cap-primary-line: calc(var(--cap-primary-size) * 1.45) !important;
  --cap-secondary-line: calc(var(--cap-secondary-size) * 1.4) !important;

  padding: 10px 12px 11px;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-bg-surface) 88%, transparent);
  border: 1px solid var(--rk-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 22%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.caption-overlay-mobile :deep(.cap-panel.cap-panel-empty) {
  min-height: 0;
}

.caption-overlay-mobile :deep(.cap-placeholder) {
  box-sizing: border-box;
  padding-right: var(--cap-action-reserve);
  padding-left: var(--cap-action-reserve);
}

.caption-overlay-mobile :deep(.cap-placeholder-text) {
  min-width: 0;
  max-width: 100%;
}

.caption-overlay-mobile :deep(.cap-panel .cap-row-group) {
  gap: 7px;
}

.caption-overlay-mobile :deep(.cap-panel .cap-row) {
  gap: 6px;
}

.caption-overlay-mobile :deep(.cap-panel .cap-row-shell:nth-last-child(n + 3)) {
  display: none;
}

.caption-overlay-mobile :deep(.cap-panel .cap-speaker) {
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 16px;
}

.caption-overlay-mobile :deep(.cap-panel .cap-line-secondary) {
  color: var(--rk-text-tertiary);
}

.caption-overlay-mobile :deep(.cap-panel .cap-live i) {
  background: var(--rk-text-tertiary);
}
</style>
