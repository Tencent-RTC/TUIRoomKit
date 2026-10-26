<template>
  <Teleport v-if="host && faultView && open" :to="host">
    <div class="device-fault-dialog-mask" @click.self="close()">
      <div class="device-fault-dialog" role="dialog" aria-modal="true">
        <div
          class="device-fault-dialog-icon"
          :class="{
            'is-lock': faultView.kind === 'browser-blocked' || faultView.kind === 'system-blocked',
          }"
        >
          <IconLock v-if="faultView.kind === 'browser-blocked' || faultView.kind === 'system-blocked'" :size="22" />
          <IconCam v-else-if="faultView.kind === 'no-device' && faultView.target === 'camera'" :size="22" />
          <IconMic v-else-if="faultView.kind === 'no-device' && faultView.target === 'microphone'" :size="22" />
          <IconWarning v-else :size="22" />
        </div>
        <h3 class="device-fault-dialog-title">
          {{ title }}
        </h3>
        <p class="device-fault-dialog-body">
          {{ description }}
        </p>
        <div class="device-fault-dialog-actions">
          <button
            v-for="(action, index) in faultView.actions"
            :key="action.labelKey"
            class="device-fault-dialog-button"
            :class="{ 'is-primary': index === 0 }"
            type="button"
            @click="action.run()"
          >
            {{ t(action.labelKey) }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { IconCam, IconLock, IconMic, IconWarning, t } from '../../base';
import type { DeviceFaultView } from './useDeviceFault';

defineProps<{
  open: boolean;
  faultView: DeviceFaultView | null;
  host: HTMLElement | null;
  title: string;
  description: string;
  close: () => void;
}>();

</script>

<style scoped lang="scss">
.device-fault-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 24px;
  pointer-events: auto;
  background: rgb(0 0 0 / 55%);
  backdrop-filter: blur(6px);
}

.device-fault-dialog {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: min(400px, 100%);
  padding: 28px 28px 22px;
  text-align: center;
  background: var(--rk-bg-surface);
  border-radius: 22px;
  box-shadow: var(--rk-shadow-dialog);
}

.device-fault-dialog-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: var(--rk-danger);
  background: color-mix(in srgb, var(--rk-danger) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--rk-danger) 28%, transparent);
  border-radius: 14px;
}

/* A blocked permission is a condition to act on, not a failure, so the lock borrows the
   toolbar's active chip instead of the danger tint the other faults carry. */
.device-fault-dialog-icon.is-lock {
  color: var(--rk-info);
  background: color-mix(in srgb, var(--rk-info) 14%, transparent);
  border-color: color-mix(in srgb, var(--rk-info) 28%, transparent);
}

.device-fault-dialog-title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--rk-text-primary);
}

.device-fault-dialog-body {
  margin: 0 0 20px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--rk-text-secondary);
  text-align: left;
  white-space: pre-line;
}

.device-fault-dialog-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.device-fault-dialog-button {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 20px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-dialog-cancel-bg, var(--rk-bg-muted));
  border: 0;
  border-radius: 12px;
}

.device-fault-dialog-button.is-primary {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}
</style>
