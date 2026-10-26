<template>
  <TUIDialog
    :open="startConfirmVisible"
    :title="t('AITools.ConfirmStartTitle')"
    :width="420"
    :closable="isPC"
    :confirm-text="t('AITools.ConfirmStartOk')"
    :cancel-text="t('AITools.Cancel')"
    @close="cancelStartASR"
    @confirm="submitStartASR"
    @cancel="cancelStartASR"
  >
    <div class="asr-confirm" :class="{ 'is-h5': !isPC }">
      <p class="asr-confirm-desc">
        {{ t('AITools.ConfirmStartDesc') }}
      </p>
      <label class="asr-confirm-check">
        <input v-model="showCaptionsOnStart" type="checkbox">
        <span>{{ t('AITools.ConfirmStartShowCaptions') }}</span>
      </label>
    </div>
  </TUIDialog>

  <TUIDialog
    :open="stopConfirmVisible"
    :width="420"
    :closable="isPC"
    :title="t('AITools.ConfirmStopTitle')"
    :confirm-text="t('AITools.ConfirmStopOk')"
    :cancel-text="t('AITools.ConfirmStopCancel')"
    @close="cancelStopASR"
    @confirm="submitStopASR"
    @cancel="cancelStopASR"
  >
    <p class="asr-confirm-desc">
      {{ t('AITools.ConfirmStopDesc') }}
    </p>
  </TUIDialog>
</template>

<script lang="ts" setup>
import { getPlatform } from '@tencentcloud/universal-api';
import { TUIDialog, t } from '../../../base';
import { useASRState } from '../useASRState';

const isPC = getPlatform() === 'pc';

const {
  startConfirmVisible,
  stopConfirmVisible,
  showCaptionsOnStart,
  submitStartASR,
  cancelStartASR,
  submitStopASR,
  cancelStopASR,
} = useASRState();
</script>

<style scoped lang="scss">
.asr-confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.asr-confirm-desc {
  margin: 0;
  font-size: var(--rk-fs-md);
  line-height: 22px;
  color: var(--rk-text-secondary);
}

.asr-confirm.is-h5 .asr-confirm-check {
  align-self: center;
}

.asr-confirm-check {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: var(--rk-fs-md);
  line-height: 22px;
  color: var(--rk-text-primary);
  cursor: pointer;
}

.asr-confirm-check input {
  position: relative;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin: 0;
  appearance: none;
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1.5px solid var(--rk-border-strong);
  border-radius: 4px;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.asr-confirm-check input:checked {
  background: var(--rk-brand);
  border-color: var(--rk-brand);
}

.asr-confirm-check input:checked::after {
  position: absolute;
  top: 1px;
  left: 4px;
  width: 5px;
  height: 9px;
  content: '';
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.asr-confirm-check input:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 2px;
}
</style>
