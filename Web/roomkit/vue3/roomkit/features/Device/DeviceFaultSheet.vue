<template>
  <Teleport v-if="host && faultView && open" :to="host">
    <div class="device-fault-sheet-root" :class="{ 'is-open': shown }">
      <div class="device-fault-sheet-mask" @click="close()" />
      <div
        class="device-fault-sheet"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="device-fault-sheet-handle" aria-hidden="true">
          <i />
        </div>
        <div class="device-fault-sheet-icon">
          <IconMic v-if="faultView.target === 'microphone'" :size="24" />
          <IconCam v-else :size="24" />
        </div>
        <h3 class="device-fault-sheet-title">
          {{ title }}
        </h3>
        <p class="device-fault-sheet-body">
          {{ description }}
        </p>
        <div class="device-fault-sheet-actions">
          <button
            v-for="(action, index) in faultView.actions"
            :key="action.labelKey"
            class="device-fault-sheet-button"
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
import { onMounted, ref } from 'vue';
import { IconCam, IconMic, t } from '../../base';
import type { DeviceFaultView } from './useDeviceFault';

defineProps<{
  open: boolean;
  faultView: DeviceFaultView | null;
  host: HTMLElement | null;
  title: string;
  description: string;
  close: () => void;
}>();

const shown = ref(false);

onMounted(() => {
  requestAnimationFrame(() => {
    shown.value = true;
  });
});
</script>

<style scoped lang="scss">
.device-fault-sheet-root {
  position: fixed;
  inset: 0;
  z-index: 80;
  overflow: hidden;
  pointer-events: none;
}

.device-fault-sheet-root.is-open {
  pointer-events: auto;
}

.device-fault-sheet-mask {
  position: absolute;
  inset: 0;
  background: rgb(0 0 0 / 40%);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.device-fault-sheet-root.is-open .device-fault-sheet-mask {
  opacity: 1;
}

.device-fault-sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  box-sizing: border-box;
  padding: 0 20px calc(20px + env(safe-area-inset-bottom, 0px));
  color: var(--rk-text-primary);
  text-align: center;
  background: var(--rk-bg-surface);
  border-radius: 16px 16px 0 0;
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.device-fault-sheet-root.is-open .device-fault-sheet {
  transform: translateY(0);
}

.device-fault-sheet-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 6px;
}

.device-fault-sheet-handle i {
  display: block;
  width: 36px;
  height: 4px;
  background: var(--rk-border-strong);
  border-radius: 2px;
}

.device-fault-sheet-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 10px auto 12px;
  color: var(--rk-warning);
  background: color-mix(in srgb, var(--rk-warning) 14%, transparent);
  border-radius: 50%;
}

.device-fault-sheet-title {
  margin: 0 0 6px;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  line-height: 20px;
  color: var(--rk-text-primary);
}

.device-fault-sheet-body {
  margin: 0;
  font-size: var(--rk-fs-md);
  font-weight: 400;
  line-height: 1.55;
  color: var(--rk-text-secondary);
}

.device-fault-sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.device-fault-sheet-button {
  box-sizing: border-box;
  width: 100%;
  height: 44px;
  padding: 0 16px;
  font: inherit;
  font-size: var(--rk-fs-lg);
  font-weight: 500;
  line-height: 1;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-page);
  border: 0;
  border-radius: 10px;
}

.device-fault-sheet-button.is-primary {
  font-weight: 600;
  color: var(--rk-on-accent);
  background: var(--rk-brand);
}
</style>
