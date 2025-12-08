<template>
  <div
    v-if="currentNetworkState"
    v-click-outside="closeNetworkPanel"
    class="network-info-wrapper"
  >
    <icon-button
      layout="horizontal"
      :icon="currentNetworkState.icon"
      @click-icon="toggleNetworkPanel"
    >
      <template #title>
        <span :class="['network-title', `status-${currentNetworkState.type}`]">
          {{ currentNetworkState.title }}
        </span>
      </template>
    </icon-button>

    <transition name="fade-slide">
      <div
        v-if="isNetworkPanelVisible"
        class="network-panel"
      >
        <div class="panel-item">
          <span class="item-label">{{ t('Network.Latency') }}</span>
          <span :class="['item-value', 'latency-value', `latency-value-${currentNetworkState.type}`]">
            {{ networkInfo?.delay }} ms
          </span>
        </div>

        <div class="panel-item">
          <span class="item-label">{{ t('Network.PacketLoss') }}</span>
          <div class="packet-loss-container">
            <div class="packet-loss-item">
              <span class="item-value">{{ networkInfo?.upLoss }}%</span>
              <icon-arrow-stroke-up class="arrow-icon arrow-up" />
            </div>
            <div class="packet-loss-item">
              <span class="item-value">{{ networkInfo?.downLoss }}%</span>
              <icon-arrow-stroke-up class="arrow-icon arrow-down" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Component } from 'vue';
import {
  useUIKit,
  IconNetworkStability,
  IconNetworkFluctuation,
  IconNetworkLag,
  IconNetworkDisconnected,
  IconArrowStrokeUp,
} from '@tencentcloud/uikit-base-component-vue3';
import { NetworkQuality, useDeviceState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';

type NetworkStatusType = 'success' | 'warning' | 'danger' | 'disconnected';

interface NetworkState {
  title: string;
  type: NetworkStatusType;
  icon: Component;
}

const { networkInfo } = useDeviceState();
const { t } = useUIKit();

const isNetworkPanelVisible = ref(false);

const networkQualityMap = computed(() => ({
  [NetworkQuality.Excellent]: {
    title: t('Network.Stability'),
    type: 'success',
    icon: IconNetworkStability,
  },
  [NetworkQuality.Good]: {
    title: t('Network.Stability'),
    type: 'success',
    icon: IconNetworkStability,
  },
  [NetworkQuality.Poor]: {
    title: t('Network.Fluctuation'),
    type: 'warning',
    icon: IconNetworkFluctuation,
  },
  [NetworkQuality.Bad]: {
    title: t('Network.Lag'),
    type: 'danger',
    icon: IconNetworkLag,
  },
  [NetworkQuality.VeryBad]: {
    title: t('Network.Lag'),
    type: 'danger',
    icon: IconNetworkLag,
  },
  [NetworkQuality.Down]: {
    title: t('Network.Disconnected'),
    type: 'disconnected',
    icon: IconNetworkDisconnected,
  },
}));

const currentNetworkState = computed<NetworkState | null>(() => {
  const quality = networkInfo.value?.quality as NetworkQuality;
  if (!networkInfo.value || quality === NetworkQuality.Unknown) {
    return null;
  }
  return (
    networkQualityMap.value[quality] || null
  );
});

function toggleNetworkPanel() {
  isNetworkPanelVisible.value = !isNetworkPanelVisible.value;
}

function closeNetworkPanel() {
  isNetworkPanelVisible.value = false;
}
</script>

<style lang="scss" scoped>

$up-arrow-color: #1C66E5;
$down-arrow-color: #E59753;

.network-info-wrapper {
  position: relative;
}

.network-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
}

.network-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  box-sizing: border-box;
  width: 160px;
  height: 130px;
  padding: 20px;
  background: var(--bg-color-dialog);
  border-radius: 8px;
  box-shadow:
    0 2px 6px var(--uikit-color-black-8),
    0 8px 18px var(--uikit-color-black-8);
}

.panel-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }

  .item-label {
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: var(--text-color-secondary);
  }

  .item-value {
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--text-color-primary);
  }

  .latency-value {
    font-size: 14px;
    line-height: 22px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;

    &.latency-value-success {
      color: var(--text-color-success);
    }

    &.latency-value-warning {
      color: var(--text-color-warning);
    }

    &.latency-value-danger {
      color: var(--text-color-error);
    }

    &.latency-value-disconnected {
      color: var(--text-color-tertiary);
    }
  }
}

.packet-loss-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.packet-loss-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;

  .arrow-icon {
    width: 16px;
    height: 16px;
    color: var(--text-color-primary);
  }

  .arrow-up {
    color: $up-arrow-color;
  }

  .arrow-down {
    transform: rotate(180deg);
    color: $down-arrow-color;
  }
}

.status-success {
  color: var(--text-color-success);
}

.status-warning {
  color: var(--text-color-warning);
}

.status-danger {
  color: var(--text-color-error);
}

.status-disconnected {
  color: var(--text-color-tertiary);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
