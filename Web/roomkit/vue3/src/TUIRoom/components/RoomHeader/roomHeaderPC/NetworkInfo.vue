<!--
  * Name: NetworkInfo
  * Usage:
  * Use <network-info /> in template
-->
<template>
  <div v-click-outside="handleClickOutSide" class="network-info-container">
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
            <ArrowStrokeUpIcon />
            <span>{{ `${networkInfo.upLoss}%` }}</span>
          </div>
          <div class="network-detail-packet-item">
            <ArrowStrokeUpIcon class="arrow-down" />
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
import NetworkStabilityIcon from '../../common/icons/NetworkStabilityIcon.vue';
import NetworkFluctuationIcon from '../../common/icons/NetworkFluctuationIcon.vue';
import NetworkLagIcon from '../../common/icons/NetworkLagIcon.vue';
import NetworkDisconnectedIcon from '../../common/icons/NetworkDisconnectedIcon.vue';
import ArrowStrokeUpIcon from '../../common/icons/ArrowStrokeUpIcon.vue';
import { IconButtonLayout } from '../../../constants/room';

const roomEngine = useRoomEngine();
const { t } = useI18n();
const basicStore = useBasicStore();
const { networkInfo } = storeToRefs(basicStore);
const networkBoard = ref();
const showNetworkInfo: Ref<boolean> = ref(false);

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
    icon: shallowRef(NetworkStabilityIcon),
  },
  [TUINetworkQuality.kQualityPoor]: {
    title: 'Fluctuation',
    titleType: 'warning',
    icon: shallowRef(NetworkFluctuationIcon),
  },
  [TUINetworkQuality.kQualityVeryBad]: {
    title: 'Lag',
    titleType: 'danger',
    icon: shallowRef(NetworkLagIcon),
  },
  [TUINetworkQuality.kQualityDown]: {
    title: 'Disconnected',
    titleType: 'info',
    icon: shallowRef(NetworkDisconnectedIcon),
  },
};

watchEffect(() => {
  const quality = qualityMap[networkInfo.value.quality];
  if (quality) {
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
.tui-theme-white .network-info-board {
  --title-font-color: var(--font-color-1);
  --item-font-color: var(--font-color-6);
  --filter-color: drop-shadow(0px 0px 4px rgba(32, 77, 141, 0.03))
    drop-shadow(0px 4px 10px rgba(32, 77, 141, 0.06))
    drop-shadow(0px 1px 14px rgba(32, 77, 141, 0.05));
}

.tui-theme-black .network-info-board {
  --title-font-color: #8f9ab2;
  --item-font-color: var(--font-color-1);
  --filter-color: drop-shadow(0px 8px 40px rgba(23, 25, 31, 0.6))
    drop-shadow(0px 4px 12px rgba(23, 25, 31, 0.4));
}

.network-info-container {
  position: relative;

  .network-info-board {
    position: absolute;
    top: 40px;
    width: 161px;
    height: 130px;
    padding: 24px;
    background-color: var(--background-color-2);
    filter: var(--filter-color);
    border-radius: 10px;

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
      color: var(--title-font-color);

      .title-latency {
        font-weight: 500;
        line-height: 22px;
      }

      .network-detail-packet {
        display: flex;
        flex-direction: column;
        font-weight: 500;
        color: var(--item-font-color);

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
    color: #27c39f;
  }

  .title-type-warning {
    color: #f39843;
  }

  .title-type-danger {
    color: #ed414d;
  }

  .title-type-info {
    color: #4f586b;
  }
}
</style>
