<template>
  <div class="asr-menu">
    <div
      v-if="showWaitHint"
      class="asr-menu-hint"
      role="note"
    >
      <IconInfo :size="14" />
      <span>{{ t('AITools.WaitHost') }}</span>
    </div>
    <TUIDropdownSeparator v-if="showWaitHint" />

    <TUIDropdownItem
      v-if="canManageASR"
      command="transcription"
      :class="{ 'is-on': asrOn }"
    >
      <IconAI :size="14" />
      <span>{{ transcriptionLabel }}</span>
    </TUIDropdownItem>

    <TUIDropdownSeparator v-if="canManageASR" />

    <TUIDropdownItem
      command="caption"
      :disabled="captionDisabled"
    >
      <IconAISubtitleCC :size="14" />
      <span>{{ captionLabel }}</span>
    </TUIDropdownItem>

    <TUIDropdownItem
      command="transcript"
      :disabled="transcriptDisabled"
    >
      <IconAITranscription :size="14" />
      <span>{{ recordLabel }}</span>
    </TUIDropdownItem>
  </div>
</template>

<script lang="ts" setup>
import { IconAI, IconAISubtitleCC, IconAITranscription, IconInfo, TUIDropdownItem, TUIDropdownSeparator, t } from '../../../base';
import { useCaptionEntryMenu } from './useCaptionEntryMenu';

const props = defineProps<{
  transcriptOpen: boolean;
}>();

const {
  asrOn,
  canManageASR,
  showWaitHint,
  captionDisabled,
  transcriptDisabled,
  transcriptionLabel,
  captionLabel,
  recordLabel,
} = useCaptionEntryMenu(
  () => props.transcriptOpen,
  () => {},
);
</script>

<style scoped lang="scss">
.asr-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: max-content;
  color: var(--rk-text-primary);
}

.asr-menu-hint {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  color: var(--rk-text-secondary);
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  white-space: nowrap;
}

.asr-menu-hint :deep(svg) {
  flex: none;
  color: var(--rk-brand);
}

.asr-menu :deep(.rk-dropdown-item) {
  gap: 8px;
}

.asr-menu :deep(.rk-dropdown-item span) {
  white-space: nowrap;
}

.asr-menu :deep(.rk-dropdown-item.is-on),
.asr-menu :deep(.rk-dropdown-item.is-on svg) {
  color: var(--rk-brand);
}
</style>

<style lang="scss">
/* Teleported dropdown sizes to the viewport unless width is explicit. */
.rk-dropdown:has(.asr-menu) {
  box-sizing: border-box;
  width: max-content;
  min-width: 0;
}
</style>
