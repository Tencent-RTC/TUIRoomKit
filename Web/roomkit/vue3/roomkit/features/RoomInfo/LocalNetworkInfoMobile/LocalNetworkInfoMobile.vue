<template>
  <div
    class="local-network-info-mobile"
    role="button"
    tabindex="0"
    :aria-label="t(displayState.label)"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    @click="isOpen = !isOpen"
    @keydown.enter.prevent="isOpen = !isOpen"
    @keydown.space.prevent="isOpen = !isOpen"
  >
    <span class="local-network-info-mobile-bars" :class="`local-network-info-mobile-${displayState.level}`">
      <i /><i /><i />
    </span>
  </div>

  <TUIPopup v-model:open="isOpen" height="auto" :title="t(displayState.label)">
    <div class="local-network-sheet-metrics">
      <div v-for="metric in metrics" :key="metric.id" class="local-network-sheet-metric">
        <span class="local-network-sheet-label">
          {{ t(metric.label) }}
          <IconArrowRight
            v-if="metric.direction"
            :size="14"
            class="local-network-sheet-arrow"
            :class="`local-network-sheet-arrow-${metric.direction}`"
          />
        </span>
        <span class="local-network-sheet-value">
          {{ metric.value }}<span class="local-network-sheet-unit">{{ metric.unit }}</span>
        </span>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NetworkQuality, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconArrowRight, TUIPopup, t } from '../../../base';

const LEVELS = {
  [NetworkQuality.Excellent]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Good]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Poor]: { level: 'fluctuation', label: 'Network.Fluctuation' },
  [NetworkQuality.Bad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.VeryBad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.Down]: { level: 'disconnected', label: 'Network.Disconnected' },
} as const;

const { networkInfo } = useDeviceState();

/**
 * The engine reports Unknown while nothing is published, which is the usual H5 entry
 * state with mic and camera off. The mobile topbar keeps the bars in place, so with
 * no report there is no sign of trouble to show.
 */
const displayState = computed(() => {
  const quality = networkInfo.value?.quality ?? NetworkQuality.Unknown;
  return LEVELS[quality as keyof typeof LEVELS] ?? LEVELS[NetworkQuality.Good];
});

const metrics = computed(() => [
  { id: 'delay', label: 'Network.Latency', value: networkInfo.value?.delay ?? 0, unit: 'ms', direction: null },
  { id: 'up', label: 'Network.PacketLoss', value: networkInfo.value?.upLoss ?? 0, unit: '%', direction: 'up' },
  { id: 'down', label: 'Network.PacketLoss', value: networkInfo.value?.downLoss ?? 0, unit: '%', direction: 'down' },
]);

const isOpen = ref(false);
</script>

<style scoped lang="scss">
.local-network-info-mobile {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  cursor: pointer;
  outline: none;
}

/* Bars bottom-align so they step up. */
.local-network-info-mobile-bars {
  display: inline-flex;
  gap: 2px;
  align-items: flex-end;
  height: 12px;
}

.local-network-info-mobile-bars i {
  display: block;
  width: 3px;
  background: currentcolor;
  border-radius: 1px;
}

.local-network-info-mobile-disconnected i {
  opacity: 0.4;
}

.local-network-info-mobile-bars i:nth-child(1) {
  height: 4px;
}

.local-network-info-mobile-bars i:nth-child(2) {
  height: 8px;
}

.local-network-info-mobile-bars i:nth-child(3) {
  height: 12px;
}

.local-network-info-mobile-stability {
  color: var(--rk-success);
}

.local-network-info-mobile-fluctuation {
  color: var(--rk-warning);
}

.local-network-info-mobile-lag {
  color: var(--rk-danger);
}

.local-network-info-mobile-disconnected {
  color: var(--rk-text-tertiary);
}

/* Lit bars stand for the signal level; the rest stay visible but dim. */
.local-network-info-mobile-fluctuation i:nth-child(3),
.local-network-info-mobile-lag i:nth-child(2),
.local-network-info-mobile-lag i:nth-child(3) {
  opacity: 0.28;
}

.local-network-sheet-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-bottom: 20px;
}

.local-network-sheet-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 8px;
  background: var(--rk-bg-hover);
  border-radius: 8px;
}

.local-network-sheet-label {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 14px;
  color: var(--rk-text-tertiary);
}

.local-network-sheet-arrow {
  flex-shrink: 0;
}

.local-network-sheet-arrow-up {
  color: var(--rk-blue-500);
  transform: rotate(-90deg);
}

.local-network-sheet-arrow-down {
  color: var(--rk-orange-500);
  transform: rotate(90deg);
}

.local-network-sheet-value {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 18px;
  color: var(--rk-text-primary);
}

.local-network-sheet-unit {
  margin-left: 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 400;
  color: var(--rk-text-tertiary);
}
</style>
