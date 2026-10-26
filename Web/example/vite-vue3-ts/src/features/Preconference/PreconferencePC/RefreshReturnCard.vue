<template>
  <section
    class="refresh-return-card"
    :aria-label="t('RefreshReturn.Title')"
  >
    <div class="refresh-return-head">
      <div class="refresh-return-icon" aria-hidden="true">
        <IconRefresh :size="20" />
      </div>
      <div class="refresh-return-body">
        <div class="refresh-return-title">
          {{ t('RefreshReturn.Title') }}
        </div>
        <div class="refresh-return-sub">
          {{ t('RefreshReturn.Subtitle') }}
        </div>
      </div>
    </div>
    <div class="refresh-return-actions">
      <button
        type="button"
        class="refresh-return-btn"
        @click="emit('cancel')"
      >
        {{ t('RefreshReturn.Cancel') }}
      </button>
      <button
        type="button"
        class="refresh-return-btn is-primary"
        @click="emit('confirm')"
      >
        {{ t('RefreshReturn.Confirm') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { IconRefresh, t } from '@tencentcloud/roomkit-web-vue3';

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<style scoped lang="scss">
.refresh-return-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  width: 100%;
  min-height: 0;
  padding: 20px 22px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-xl);
}

.refresh-return-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.refresh-return-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 14%, transparent);
  border-radius: 10px;
}

.refresh-return-body {
  min-width: 0;
  text-align: center;
}

.refresh-return-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--rk-text-primary);
}

.refresh-return-sub {
  margin-top: 2px;
  font-size: 11px;
  color: var(--rk-text-tertiary);
}

.refresh-return-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.refresh-return-btn {
  flex: 1;
  height: 44px;
  font-size: 13px;
  font-weight: 600;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-muted);
  border: none;
  border-radius: 10px;
  transition:
    background-color var(--rk-duration) var(--rk-ease),
    filter var(--rk-duration) var(--rk-ease);
}

.refresh-return-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rk-text-primary) 10%, transparent);
}

.refresh-return-btn.is-primary {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}

.refresh-return-btn.is-primary:hover:not(:disabled) {
  background: var(--rk-brand);
  filter: brightness(1.06);
}

.refresh-return-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
