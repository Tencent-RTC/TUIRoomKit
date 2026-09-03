<template>
  <TUIDialog
    v-model:visible="startConfirmVisible"
    :title="startConfirmTitle"
    :confirm-text="t('AITools.ConfirmStartOk')"
    :cancel-text="t('AITools.Cancel')"
    append-to="#roomPage"
    @close="cancelStartASR"
    @confirm="submitStartASR"
    @cancel="cancelStartASR"
  >
    <div class="asr-confirm">
      <p class="asr-confirm__desc">
        {{ startConfirmDesc }}
      </p>
      <label
        v-if="startConfirmSource !== 'subtitle'"
        class="asr-confirm__check"
      >
        <input v-model="showCaptionsOnStart" type="checkbox">
        <span>{{ t('AITools.ConfirmStartShowCaptions') }}</span>
      </label>
    </div>
    <template v-if="isPc" #footer>
      <div class="asr-confirm__footer">
        <TUIButton style="min-width: 88px" @click="cancelStartASR">
          {{ t('AITools.Cancel') }}
        </TUIButton>
        <TUIButton type="primary" style="min-width: 88px" @click="submitStartASR">
          {{ t('AITools.ConfirmStartOk') }}
        </TUIButton>
      </div>
    </template>
  </TUIDialog>

  <TUIDialog
    v-model:visible="stopConfirmVisible"
    :title="t('AITools.ConfirmStopTitle')"
    :confirm-text="t('AITools.ConfirmStopOk')"
    :cancel-text="t('AITools.ConfirmStopCancel')"
    append-to="#roomPage"
    @close="cancelStopASR"
    @confirm="submitStopASR"
    @cancel="cancelStopASR"
  >
    <p class="asr-confirm__desc">
      {{ t('AITools.ConfirmStopDesc') }}
    </p>
    <template v-if="isPc" #footer>
      <div class="asr-confirm__footer">
        <TUIButton style="min-width: 88px" @click="cancelStopASR">
          {{ t('AITools.ConfirmStopCancel') }}
        </TUIButton>
        <TUIButton type="primary" style="min-width: 88px" @click="submitStopASR">
          {{ t('AITools.ConfirmStopOk') }}
        </TUIButton>
      </div>
    </template>
  </TUIDialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { TUIButton, TUIDialog, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useASRToolsState } from '../useASRToolsState';

const props = withDefaults(defineProps<{
  layout?: 'pc' | 'h5';
}>(), {
  layout: 'pc',
});

const isPc = computed(() => props.layout === 'pc');
const { t } = useUIKit();
const {
  startConfirmVisible,
  stopConfirmVisible,
  startConfirmSource,
  showCaptionsOnStart,
  submitStartASR,
  cancelStartASR,
  submitStopASR,
  cancelStopASR,
} = useASRToolsState();

const startConfirmTitle = computed(() => {
  if (startConfirmSource.value === 'subtitle') {
    return t('AITools.EmptyHostTitle');
  }
  if (startConfirmSource.value === 'record') {
    return t('AITools.ConfirmStartTitleRecord');
  }
  return t('AITools.ConfirmStartTitle');
});

const startConfirmDesc = computed(() => {
  if (startConfirmSource.value === 'subtitle') {
    return t('AITools.EmptyHostSub');
  }
  if (startConfirmSource.value === 'record') {
    return t('AITools.ConfirmStartDescRecord');
  }
  return t('AITools.ConfirmStartDesc');
});
</script>

<style lang="scss" scoped>
.asr-confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.asr-confirm__desc {
  margin: 0;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-color-secondary);
}

.asr-confirm__check {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  line-height: 22px;
  color: var(--text-color-primary);
  cursor: pointer;

  input {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin: 0;
    cursor: pointer;
    accent-color: var(--text-color-link);
  }
}

.asr-confirm__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  width: 100%;
}
</style>
