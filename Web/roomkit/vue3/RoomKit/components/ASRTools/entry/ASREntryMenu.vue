<template>
  <div class="asr-menu" :class="`asr-menu--${layout}`">
    <button
      v-if="canManageASR"
      class="asr-menu__item"
      type="button"
      :class="{ 'is-on': asrOn }"
      @click="handleToggleRowClick"
    >
      <IconAIIcon :size="16" />
      <span class="asr-menu__label">{{ transcriptionLabel }}</span>
    </button>

    <div v-if="canManageASR" class="asr-menu__divider" />

    <button
      class="asr-menu__item"
      type="button"
      :class="{ 'is-disabled': isCaptionLocked }"
      @click="handleCaptionToggle"
    >
      <IconAISubtitles :size="16" />
      <span class="asr-menu__label">{{ captionLabel }}</span>
    </button>

    <div
      v-if="!isPc"
      class="asr-menu__divider"
    />

    <button
      class="asr-menu__item"
      type="button"
      @click="handleRecordToggle"
    >
      <IconAITranscription :size="16" />
      <span class="asr-menu__label">{{ recordLabel }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import {
  IconAIIcon,
  IconAISubtitles,
  IconAITranscription,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { BuiltinWidget } from '../../../adapter/type';
import { useRoomSidePanel } from '../../../hooks/useRoomSidePanel';
import { useASRToolsState } from '../useASRToolsState';
import { useSubtitleViewState } from '../useSubtitleViewState';

const props = withDefaults(defineProps<{
  layout?: 'pc' | 'h5';
}>(), {
  layout: 'pc',
});

const emit = defineEmits<{
  close: [];
}>();

const { t } = useUIKit();
const { activeWidgetId, toggleWidgetPanel } = useRoomSidePanel();
const {
  capViewOpen,
  recViewOpen,
  presentCaptionHint,
  hideCaptionOverlay,
} = useSubtitleViewState();
const { asrOn, canManageASR, confirmStartASR, confirmStopASR } = useASRToolsState();

const isPc = computed(() => props.layout === 'pc');
const isCaptionLocked = computed(() => !asrOn.value && !canManageASR.value);
const isCaptionChecked = computed(() => asrOn.value && capViewOpen.value);
const isRecordChecked = computed(() => (
  isPc.value
    ? activeWidgetId.value === BuiltinWidget.AIToolsWidget
    : recViewOpen.value
));

const transcriptionLabel = computed(() => (
  asrOn.value ? t('AITools.TranscriptionStop') : t('AITools.TranscriptionStart')
));
const captionLabel = computed(() => (
  isCaptionChecked.value ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen')
));
const recordLabel = computed(() => (
  isRecordChecked.value ? t('AITools.RealtimeMessageListClose') : t('AITools.RealtimeMessageListOpen')
));

function handleToggleRowClick() {
  if (asrOn.value) {
    confirmStopASR();
  } else {
    confirmStartASR();
  }
  emit('close');
}

function handleCaptionToggle() {
  if (isCaptionLocked.value) {
    TUIToast.info({
      message: t('AITools.CaptionsUnavailable'),
    });
    emit('close');
    return;
  }

  if (!asrOn.value) {
    confirmStartASR('subtitle');
    emit('close');
    return;
  }

  if (isCaptionChecked.value) {
    hideCaptionOverlay();
  } else {
    presentCaptionHint();
  }
  emit('close');
}

function handleRecordToggle() {
  if (isPc.value) {
    toggleWidgetPanel(BuiltinWidget.AIToolsWidget);
  } else {
    recViewOpen.value = !recViewOpen.value;
  }
  emit('close');
}
</script>

<style lang="scss" scoped>
.asr-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: max-content;
  color: var(--text-color-primary);

  &--h5 {
    width: 100%;
    min-width: 0;
    padding: 4px 8px 12px;
  }
}

.asr-menu__item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;

  &:hover:not(:disabled) {
    background: var(--button-color-secondary-hover);
  }

  &.is-on {
    color: var(--text-color-link);
  }

  &.is-disabled,
  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

.asr-menu__label {
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  white-space: nowrap;
}

.asr-menu__divider {
  height: 1px;
  margin: 4px 12px;
  background: var(--stroke-color-primary);
}
</style>
