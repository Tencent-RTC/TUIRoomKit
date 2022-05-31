<!--
  * 名称: NetworkInfo
  * 使用方式：
  * 在 template 中使用 <network-info />
-->
<template>
  <div class="network-info-container">
    <div :class="['network-info-icon', `${showNetworkInfo ? 'active' : ''}`]" @click.stop="handleClickNetworkIcon">
      <div
        v-for="(item, index) in new Array(4)"
        :key="index"
        :class="[`network-quality-${index + 1}`, `${showGreen(index) ? 'green' : ''}`]"
      >
      </div>
    </div>
    <div v-if="showNetworkInfo" ref="networkBoard" class="network-info-board">
      <div class="network-state">{{ `网络${networkDes[localQuality]}` }}</div>
      <div class="network-detail-item">
        <span>网络延迟：</span>
        <span>{{ `${statistics.rtt} ms` }}</span>
      </div>
      <div class="network-detail-item">
        <span>帧率：</span>
        <span>{{ `${localFrameRate} fps` }}</span>
      </div>
      <div class="network-detail-item">
        <span>码率：</span>
        <span>{{ `${localVideoBitrate} Kbps` }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';

const networkDes = ['状态未知', '状态极佳', '状态较好', '状态一般', '状态差', '状态极差', '断开连接'];

const basicStore = useBasicStore();
const { localQuality, statistics, localVideoBitrate, localFrameRate } = storeToRefs(basicStore);

const networkBoard = ref();
const showNetworkInfo: Ref<boolean> = ref(false);

function showGreen(index: number) {
  if (localQuality.value === 0) {
    return false;
  }
  return 5 - localQuality.value > index;
}

function handleClickNetworkIcon() {
  if (!showNetworkInfo.value) {
    showNetworkInfo.value = true;
    document.addEventListener('click', handleDocumentClick, false);
  } else {
    document.removeEventListener('click', handleDocumentClick, false);
    showNetworkInfo.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (showNetworkInfo.value && networkBoard.value && !networkBoard.value.contains(event.target as Node)) {
    document.removeEventListener('click', handleDocumentClick);
    showNetworkInfo.value = false;
  }
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.network-info-container {
  position: relative;
  width: 20px;
  height: 20px;
  .network-info-icon {
    width: 20px;
    height: 20px;
    display: flex;
    justify-content: space-around;
    align-items: flex-end;
    padding: 4px 2px;
    &.active {
      background: rgba(46,50,61,0.60);
      border-radius: 2px;
    }
    cursor: pointer;
    div {
      width: 3px;
      background-color: #CFD4E6;
      border-radius: 4px;
      &.green {
        background-color: $levelHighLightColor;
      }
    }
    .network-quality-1 {
      height: 5px;
    }
    .network-quality-2 {
      height: 7px;
    }
    .network-quality-3 {
      height: 9.5px;
    }
    .network-quality-4 {
      height: 12px;
    }
  }
  .network-info-board {
    position: absolute;
    top: 47px;
    right: 0;
    background-color: $toolBarBackgroundColor;
    box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
    border-radius: 4px;
    padding: 20px;
    width: 263px;
    height: 186px;
    padding: 32px;
    .network-state {
      margin-bottom: 18px;
    }
    .network-detail-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
  }
}
</style>
