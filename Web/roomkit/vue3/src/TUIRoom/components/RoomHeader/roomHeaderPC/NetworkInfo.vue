<!--
  * Name: NetworkInfo
  * Usage:
  * Use <network-info /> in template
-->
<template>
  <div
    v-click-outside="handleClickOutSide"
    class="network-info-container"
    v-if="isShowNetworkContainer"
  >
    <icon-button
      :layout="IconButtonLayout.HORIZONTAL"
      :icon="state.networkIcon"
      @click-icon="handleClickNetworkIcon"
    >
      <template #title>
        <span :class="[`title-type-${state.titleType}`]">{{
          t(`${state.title}`)
        }}</span>
      </template>
    </icon-button>
    <div v-if="showNetworkInfo" ref="networkBoard" class="network-info-board">
      <div class="network-detail-item">
        <span>{{ t('Latency') }}</span>
        <span :class="['title-latency', `title-type-${state.titleType}`]">{{
          `${networkInfo.delay} ms`
        }}</span>
      </div>
      <div class="network-detail-item">
        <span>{{ t('Packet loss') }}</span>
        <div class="network-detail-packet">
          <div class="network-detail-packet-item">
            <IconArrowStrokeUp />
            <span>{{ `${networkInfo.upLoss}%` }}</span>
          </div>
          <div class="network-detail-packet-item">
            <IconArrowStrokeUp class="arrow-down" />
            <span>{{ `${networkInfo.downLoss}%` }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onUnmounted, watchEffect, reactive, shallowRef } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import TUIRoomEngine, {
  TUIRoomEvents,
  TUINetwork,
  TUINetworkQuality,
} from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../../hooks/useRoomEngine';
import IconButton from '../../common/base/IconButton.vue';
import vClickOutside from '../../../directives/vClickOutside';
import {
  IconNetworkStability,
  IconNetworkFluctuation,
  IconNetworkLag,
  IconNetworkDisconnected,
  IconArrowStrokeUp,
} from '@tencentcloud/uikit-base-component-vue3';
import { IconButtonLayout } from '../../../constants/room';

const roomEngine = useRoomEngine();
const { t } = useI18n();
const basicStore = useBasicStore();
const { networkInfo } = storeToRefs(basicStore);
const networkBoard = ref();
const showNetworkInfo: Ref<boolean> = ref(false);
const isShowNetworkContainer: Ref<boolean> = ref(false);

type TitleType = 'success' | 'warning' | 'danger' | 'info' | undefined;

interface StateType {
  title: string;
  titleType: TitleType | undefined;
  networkIcon: any;
}

const state = reactive<StateType>({
  title: '',
  titleType: undefined,
  networkIcon: null,
});

const qualityMap: {
  [key in TUINetworkQuality]?: {
    title: string;
    titleType: TitleType;
    icon: any;
  };
} = {
  [TUINetworkQuality.kQualityExcellent]: {
    title: 'Stability',
    titleType: 'success',
    icon: shallowRef(IconNetworkStability),
  },
  [TUINetworkQuality.kQualityPoor]: {
    title: 'Fluctuation',
    titleType: 'warning',
    icon: shallowRef(IconNetworkFluctuation),
  },
  [TUINetworkQuality.kQualityVeryBad]: {
    title: 'Lag',
    titleType: 'danger',
    icon: shallowRef(IconNetworkLag),
  },
  [TUINetworkQuality.kQualityDown]: {
    title: 'Disconnected',
    titleType: 'info',
    icon: shallowRef(IconNetworkDisconnected),
  },
};

watchEffect(() => {
  const quality = qualityMap[networkInfo.value.quality];
  if (quality) {
    isShowNetworkContainer.value = true;
    state.title = quality.title;
    state.titleType = quality.titleType;
    state.networkIcon = quality.icon;
  }
});

function handleClickNetworkIcon() {
  showNetworkInfo.value = !showNetworkInfo.value;
}

function handleClickOutSide() {
  if (showNetworkInfo.value) {
    showNetworkInfo.value = false;
  }
}

async function onUserNetworkQualityChanged({
  userNetworkList,
}: {
  userNetworkList: TUINetwork[];
}) {
  userNetworkList.forEach((userNetwork: TUINetwork) => {
    basicStore.setNetworkInfo(userNetwork);
  });
}

TUIRoomEngine.once('ready', () => {
  roomEngine.instance?.on(
    TUIRoomEvents.onUserNetworkQualityChanged,
    onUserNetworkQualityChanged
  );
});

onUnmounted(() => {
  roomEngine.instance?.off(
    TUIRoomEvents.onUserNetworkQualityChanged,
    onUserNetworkQualityChanged
  );
});
</script>

<style lang="scss" scoped>
.network-info-container {
  position: relative;

  .network-info-board {
    position: absolute;
    top: 40px;
    width: 161px;
    height: 130px;
    padding: 24px;
    border-radius: 10px;
    background-color: var(--bg-color-dialog);
    box-shadow:
      0 2px 6px var(--uikit-color-black-8),
      0 8px 18px var(--uikit-color-black-8);

    .network-state {
      margin-bottom: 18px;
    }

    .network-detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      color: var(--text-color-secondary);

      .title-latency {
        font-weight: 500;
        line-height: 22px;
      }

      .network-detail-packet {
        display: flex;
        flex-direction: column;
        font-weight: 500;
        color: var(--text-color-primary);

        .network-detail-packet-item {
          display: flex;

          .arrow-down {
            transform: rotate(180deg);
          }
        }
      }
    }
  }

  .title-type-success {
    color: var(--text-color-success);
  }

  .title-type-warning {
    color: var(--text-color-warning);
  }

  .title-type-danger {
    color: var(--text-color-error);
  }

  .title-type-info {
    color: var(--text-color-tertiary);
  }
}
</style>
