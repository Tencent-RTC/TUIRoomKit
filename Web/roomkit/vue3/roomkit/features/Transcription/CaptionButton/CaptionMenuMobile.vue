<template>
  <div class="caption-menu-mobile">
    <p v-if="showWaitHint" class="caption-menu-hint">
      <IconInfo :size="16" />
      <span>{{ t('AITools.WaitHost') }}</span>
    </p>

    <div
      v-if="canManageASR"
      class="caption-menu-row"
      :class="{ 'is-on': asrOn }"
      role="switch"
      tabindex="0"
      :aria-checked="asrOn"
      @click="onTranscription"
      @keydown.enter.prevent="onTranscription"
      @keydown.space.prevent="onTranscription"
    >
      <span class="caption-menu-icon">
        <IconTranscribeMobile :size="18" />
      </span>
      <span class="caption-menu-main">
        <span class="caption-menu-label">{{ t('AITools.H5RoomTitle') }}</span>
        <span class="caption-menu-desc">{{ t('AITools.H5RoomDesc') }}</span>
      </span>
      <span class="caption-menu-switch" inert>
        <TUISwitch :model-value="asrOn" size="lg" />
      </span>
    </div>

    <div
      class="caption-menu-row"
      :class="{ 'is-on': isCaptionChecked, 'is-disabled': captionDisabled }"
      role="switch"
      :tabindex="captionDisabled ? -1 : 0"
      :aria-checked="isCaptionChecked"
      :aria-disabled="captionDisabled"
      @click="toggleCaptions"
      @keydown.enter.prevent="toggleCaptions"
      @keydown.space.prevent="toggleCaptions"
    >
      <span class="caption-menu-icon">
        <IconCcMobile :size="18" />
      </span>
      <span class="caption-menu-main">
        <span class="caption-menu-label">{{ t('AITools.H5Live') }}</span>
        <span class="caption-menu-desc">{{ t('AITools.H5LiveDesc') }}</span>
      </span>
      <span class="caption-menu-switch" inert>
        <TUISwitch :model-value="isCaptionChecked" size="lg" />
      </span>
    </div>

    <div
      class="caption-menu-row"
      :class="{ 'is-disabled': transcriptDisabled }"
      role="button"
      :tabindex="transcriptDisabled ? -1 : 0"
      :aria-disabled="transcriptDisabled"
      @click="openTranscript"
      @keydown.enter.prevent="openTranscript"
      @keydown.space.prevent="openTranscript"
    >
      <span class="caption-menu-icon">
        <IconCapPanelMobile :size="18" />
      </span>
      <span class="caption-menu-main">
        <span class="caption-menu-label">{{ t('AITools.RealtimeMessageList') }}</span>
        <span class="caption-menu-desc">{{ t('AITools.H5ViewDesc') }}</span>
      </span>
      <IconChevronRightMobile class="caption-menu-arrow" :size="16" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconCapPanelMobile,
  IconCcMobile,
  IconChevronRightMobile,
  IconInfo,
  IconTranscribeMobile,
  TUISwitch,
  t,
} from '../../../base';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';

const props = defineProps<{
  transcriptOpen: boolean;
}>();

const emit = defineEmits<{
  'transcription': [];
  'open-transcript': [];
}>();

const {
  asrOn,
  canManageASR,
  showWaitHint,
  isCaptionChecked,
  captionDisabled,
  transcriptDisabled,
  run,
} = useCaptionEntryMenu(
  () => props.transcriptOpen,
  () => emit('open-transcript'),
);

function onTranscription() {
  if (run('transcription')) {
    emit('transcription');
  }
}

function toggleCaptions() {
  run('caption');
}

function openTranscript() {
  run('transcript');
}
</script>

<style scoped lang="scss">
.caption-menu-mobile {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px 12px;
}

.caption-menu-hint {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 8px 8px;
  padding: 10px 12px;
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  background: var(--rk-brand-soft);
  border-radius: 10px;
}

.caption-menu-hint :deep(svg) {
  flex-shrink: 0;
  color: var(--rk-brand);
}

.caption-menu-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  color: var(--rk-text-primary);
  border-radius: 12px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.caption-menu-row:not(.is-disabled):active {
  background: var(--rk-bg-press, var(--rk-bg-hover));
}

.caption-menu-row.is-disabled {
  cursor: default;
}

.caption-menu-row.is-disabled > * {
  opacity: 0.4;
}

.caption-menu-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--rk-bg-hover);
  border-radius: 10px;
}

.caption-menu-row.is-on .caption-menu-icon {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.caption-menu-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.caption-menu-label {
  font-size: var(--rk-fs-md);
  line-height: 1.3;
}

.caption-menu-desc {
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
  line-height: 1.3;
}

.caption-menu-switch {
  flex-shrink: 0;
  pointer-events: none;
}

.caption-menu-switch :deep(.rk-switch.rk-switch-lg) {
  width: 44px;
  height: 26px;
  padding: 3px;
}

.caption-menu-switch :deep(.rk-switch-lg .rk-switch-thumb) {
  width: 20px;
  height: 20px;
}

.caption-menu-switch :deep(.rk-switch-on.rk-switch-lg .rk-switch-thumb) {
  transform: translateX(18px);
}

.caption-menu-arrow {
  flex-shrink: 0;
  color: var(--rk-text-tertiary);
}
</style>
