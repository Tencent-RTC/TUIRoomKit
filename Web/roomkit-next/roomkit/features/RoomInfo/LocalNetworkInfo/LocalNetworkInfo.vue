<template>
  <TopbarButton v-if="state">
    <span class="local-network-info" :class="`local-network-info-${state.level}`">
      <i /><i /><i />
    </span>

    <template #dropdown="{ close }">
      <div class="local-network-panel">
        <header class="local-network-panel-head">
          <span class="local-network-panel-title">{{ t(state.label) }}</span>
          <button
            class="local-network-panel-close"
            type="button"
            :aria-label="t('Network.Close')"
            @click="close"
          >
            <IconClose :size="12" />
          </button>
        </header>

        <div class="local-network-panel-metrics">
          <div v-for="metric in metrics" :key="metric.id" class="local-network-metric">
            <span class="local-network-metric-label">
              {{ t(metric.label) }}
              <IconArrowRight
                v-if="metric.direction"
                :size="14"
                class="local-network-metric-arrow"
                :class="`local-network-metric-arrow-${metric.direction}`"
              />
            </span>
            <span class="local-network-metric-value">
              {{ metric.value }}<span class="local-network-metric-unit">{{ metric.unit }}</span>
            </span>
          </div>
        </div>
      </div>
    </template>
  </TopbarButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NetworkQuality, useDeviceState } from 'tuikit-atomicx-vue3/room';
import { IconArrowRight, IconClose } from '../../../base';
import { t } from '../../../i18n';
import TopbarButton from '../../../layouts/TopbarButton.vue';

const { networkInfo } = useDeviceState();

/**
 * Four steps, as in the previous RoomKit: a dropped connection reads differently from
 * a bad one. Lit bars stand for the level; the rest stay in place at low opacity.
 */
const LEVELS = {
  [NetworkQuality.Excellent]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Good]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Poor]: { level: 'fluctuation', label: 'Network.Fluctuation' },
  [NetworkQuality.Bad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.VeryBad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.Down]: { level: 'disconnected', label: 'Network.Disconnected' },
} as const;

/** Unknown has nothing to report, so the chip stays out of the topbar until stats arrive */
const state = computed(() => {
  const quality = networkInfo.value?.quality ?? NetworkQuality.Unknown;
  return LEVELS[quality as keyof typeof LEVELS] ?? null;
});

/**
 * Both loss figures share the one label the previous RoomKit used; the arrow tells the
 * direction apart, the way it did there.
 */
const metrics = computed(() => [
  { id: 'delay', label: 'Network.Latency', value: networkInfo.value?.delay ?? 0, unit: 'ms', direction: null },
  { id: 'up', label: 'Network.PacketLoss', value: networkInfo.value?.upLoss ?? 0, unit: '%', direction: 'up' },
  { id: 'down', label: 'Network.PacketLoss', value: networkInfo.value?.downLoss ?? 0, unit: '%', direction: 'down' },
]);
</script>

<style scoped lang="scss">
/* Bars bottom-align so they step up; TopbarButton is already the chip and centres this group. */
.local-network-info {
  display: inline-flex;
  gap: 2px;
  align-items: flex-end;
  height: 12px;
}

.local-network-info i {
  display: block;
  width: 3px;
  background: currentcolor;
  border-radius: 1px;
}

.local-network-info-disconnected i {
  opacity: 0.4;
}

.local-network-info i:nth-child(1) {
  height: 4px;
}

.local-network-info i:nth-child(2) {
  height: 8px;
}

.local-network-info i:nth-child(3) {
  height: 12px;
}

.local-network-info-stability {
  color: var(--rk-success);
}

.local-network-info-fluctuation {
  color: var(--rk-warning);
}

.local-network-info-lag {
  color: var(--rk-danger);
}

.local-network-info-disconnected {
  color: var(--rk-text-tertiary);
}

/* Lit bars stand for the signal level; the rest stay visible but dim. */
.local-network-info-fluctuation i:nth-child(3),
.local-network-info-lag i:nth-child(2),
.local-network-info-lag i:nth-child(3) {
  opacity: 0.28;
}

/* Panel chrome matches CurrentRoomInfo: 10px inset, 12px title, 12px close. */
.local-network-panel {
  display: flex;
  flex-direction: column;
  min-width: 224px;
}

.local-network-panel-head {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: flex-start;
  padding: 10px 10px 0;
}

.local-network-panel-title {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--rk-text-primary);
}

.local-network-panel-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin: -1px -6px 0 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
}

.local-network-panel-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-option-hover);
}

.local-network-panel-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px;
}

.local-network-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  background: var(--rk-bg-muted);
  border-radius: 8px;
}

.local-network-metric-label {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  font-size: 10px;
  font-weight: 500;
  line-height: 13px;
  color: var(--rk-text-tertiary);
}

/* One shafted arrow rotated both ways, coloured as the previous RoomKit did: the two
   loss cards carry the same label, so the arrow is the only thing telling them apart. */
.local-network-metric-arrow {
  flex-shrink: 0;
}

.local-network-metric-arrow-up {
  color: var(--rk-blue-500);
  transform: rotate(-90deg);
}

.local-network-metric-arrow-down {
  color: var(--rk-orange-500);
  transform: rotate(90deg);
}

.local-network-metric-value {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 16px;
  color: var(--rk-text-primary);
}

.local-network-metric-unit {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 400;
  color: var(--rk-text-tertiary);
}
</style>

<style lang="scss">
.rk-float.rk-popover:has(> .local-network-panel) {
  overflow: hidden;
  border: 0;
  border-radius: var(--rk-radius-md);
}
</style>
