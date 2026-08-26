<template>
  <div class="asr-empty-card">
    <IconAIIcon class="empty-icon" :size="34" />
    <div class="empty-title">
      {{ t(copy.title) }}
    </div>
    <div class="empty-sub">
      {{ t(copy.sub) }}
    </div>

    <TUIButton
      v-if="!isWaiting"
      class="empty-action"
      type="primary"
      @click="emit('start')"
    >
      {{ t('AITools.StartSubtitleAction') }}
    </TUIButton>
    <span v-else class="empty-dots">
      <i /><i /><i />
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { IconAIIcon, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import type { ASREmptyVariant } from './constants';

const props = defineProps<{
  variant: ASREmptyVariant;
}>();

const emit = defineEmits<{
  start: [];
}>();

const { t } = useUIKit();

const COPY: Record<ASREmptyVariant, { title: string; sub: string }> = {
  'host-idle': { title: 'AITools.RecordEmptyHostTitle', sub: 'AITools.RecordEmptyHostSub' },
  'member-waiting': { title: 'AITools.RecordEmptyWaitingTitle', sub: 'AITools.RecordEmptyWaitingSub' },
  'member-stopped': { title: 'AITools.RecordEmptyStoppedTitle', sub: 'AITools.RecordEmptyStoppedSub' },
};

// Members cannot start transcription, so their card shows a breathing indicator
// instead of a call to action.
const isWaiting = computed(() => props.variant !== 'host-idle');
const copy = computed(() => COPY[props.variant]);
</script>

<style lang="scss" scoped>
.asr-empty-card {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--text-color-tertiary);
}

.empty-title {
  font-size: 14px;
  font-weight: 600;
  line-height: 22px;
  color: var(--text-color-secondary);
}

.empty-sub {
  font-size: 12px;
  line-height: 18px;
  color: var(--text-color-tertiary);
}

.empty-dots {
  display: inline-flex;
  gap: 5px;
  margin-top: 6px;

  i {
    width: 7px;
    height: 7px;
    background: var(--text-color-tertiary);
    border-radius: 50%;
    animation: asr-empty-blink 1.2s infinite;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }

    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes asr-empty-blink {
  0%,
  100% {
    opacity: 0.25;
  }

  50% {
    opacity: 1;
  }
}

.empty-action {
  margin-top: 10px;
}
</style>
