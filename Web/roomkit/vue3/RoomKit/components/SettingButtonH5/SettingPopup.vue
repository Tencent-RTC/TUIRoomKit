<template>
  <TUIPopup
    v-model:visible="isSettingPopupVisible"
    placement="bottom"
    @close="handleSettingPopupClose"
  >
    <div class="setting-popup-container">
      <div class="popup-header" @click="handleSettingPopupClose">
        <IconArrowDown />
      </div>

      <div class="setting-popup-content">
        <div class="section-title">
          {{ t('Setting.VideoSetting') }}
        </div>
        <div class="setting-section">
          <div class="setting-item" @click="isResolutionPopupVisible = true">
            <span class="setting-label">{{ t('Setting.Resolution') }}</span>
            <div class="setting-value">
              <span class="setting-value-text">{{
                currentResolutionLabel
              }}</span>
              <IconArrowStrokeSelectDown size="12" />
            </div>
          </div>

          <div class="setting-item">
            <span class="setting-label" :class="{ disabled: !isFrontCamera }">{{
              t('Setting.LocalMirror')
            }}</span>
            <TUISwitch
              v-model="isLocalMirror"
              :disabled="!isFrontCamera"
              @change="handleLocalMirrorChange($event as boolean)"
            />
          </div>
        </div>

        <div class="section-title">
          {{ t('Setting.OtherSetting') }}
        </div>
        <div class="setting-section">
          <div class="setting-item" @click="isQualityCheckPopupVisible = true">
            <span class="setting-label">{{ t('Setting.QualityCheck') }}</span>
            <IconArrowStrokeSelectDown size="12" class="quality-check-arrow" />
          </div>
        </div>
      </div>
    </div>
  </TUIPopup>

  <TUIPopup
    v-model:visible="isResolutionPopupVisible"
    placement="bottom"
    @close="isResolutionPopupVisible = false"
  >
    <div class="resolution-popup-container">
      <div class="popup-header" @click="isResolutionPopupVisible = false">
        <IconArrowDown />
      </div>
      <div class="resolution-popup-content">
        <div
          v-for="option in resolutionOptions"
          :key="option.value"
          class="resolution-item"
          :class="{ selected: localVideoQuality === option.value }"
          @click="handleResolutionClick(option.value)"
        >
          <span class="resolution-item-text">{{ option.label }}</span>
        </div>
      </div>
    </div>
  </TUIPopup>

  <TUIPopup
    v-model:visible="isQualityCheckPopupVisible"
    placement="bottom"
    @close="isQualityCheckPopupVisible = false"
  >
    <div class="quality-popup-container">
      <div class="popup-header" @click="isQualityCheckPopupVisible = false">
        <IconArrowDown />
      </div>
      <div class="quality-popup-content">
        <div class="section-title">
          {{ t('Setting.NetworkQuality') }}
        </div>
        <div class="quality-section">
          <div class="quality-item" @click="isQualityCheckPopupVisible = true">
            <span class="setting-label">{{ t('Network.Latency') }}</span>
            <span class="setting-value">{{ networkInfo?.delay }} ms</span>
          </div>
          <div class="quality-item" @click="isQualityCheckPopupVisible = true">
            <span class="setting-label">{{ t('Network.PacketLoss') }}</span>
            <div class="packet-loss-container">
              <div class="packet-loss-item">
                <span class="item-value">{{ networkInfo?.upLoss }}%</span>
                <IconArrowStrokeUp class="arrow-icon arrow-up" />
              </div>
              <div class="packet-loss-item">
                <span class="item-value">{{ networkInfo?.downLoss }}%</span>
                <IconArrowStrokeUp class="arrow-icon arrow-down" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import type { ComputedRef } from 'vue';
import { ref, computed, watch} from 'vue';
import {
  useUIKit,
  IconArrowStrokeSelectDown,
  IconArrowDown,
  TUISwitch,
  IconArrowStrokeUp,
  TUIToast,
  TUIPopup,
} from '@tencentcloud/uikit-base-component-vue3';
import {
  useDeviceState,
  VideoQuality,
  MirrorType,
} from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const {
  isFrontCamera,
  localMirrorType,
  switchMirror,
  localVideoQuality,
  updateVideoQuality,
  networkInfo,
} = useDeviceState();

const emits = defineEmits(['close']);

const isSettingPopupVisible = ref(true);
const isResolutionPopupVisible = ref(false);
const isQualityCheckPopupVisible = ref(false);

function handleSettingPopupClose() {
  isSettingPopupVisible.value = false;
  emits('close');
}

const isLocalMirror = ref(isFrontCamera.value && localMirrorType.value !== MirrorType.Disable);

watch(localMirrorType, (value) => {
  isLocalMirror.value = isFrontCamera.value && value !== MirrorType.Disable;
});

async function handleLocalMirrorChange(value: boolean) {
  if (!isFrontCamera.value) {
    return;
  }
  if (value) {
    await switchMirror({ mirror: MirrorType.Enable });
    TUIToast.success({ message: t('Setting.SetMirrorSuccess') });
  } else {
    await switchMirror({ mirror: MirrorType.Disable });
    TUIToast.success({ message: t('Setting.CancelMirrorSuccess') });
  }
}

const resolutionOptions: ComputedRef<{ label: string; value: VideoQuality }[]> =
  computed(() => [
    { label: t('Setting.LowDefinition'), value: VideoQuality.Quality360P },
    {
      label: t('Setting.StandardDefinition'),
      value: VideoQuality.Quality540P,
    },
    { label: t('Setting.HighDefinition'), value: VideoQuality.Quality720P },
    {
      label: t('Setting.SuperDefinition'),
      value: VideoQuality.Quality1080P,
    },
  ]);

const currentResolutionLabel = computed(
  () =>
    resolutionOptions.value.find(
      option => option.value === localVideoQuality.value
    )?.label
);

function handleResolutionClick(value: VideoQuality) {
  updateVideoQuality({ quality: value });
  isResolutionPopupVisible.value = false;
}
</script>

<style lang="scss" scoped>
.setting-popup-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 26px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;
  cursor: pointer;
}

.setting-popup-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
  -webkit-overflow-scrolling: touch;
}

.section-title {
  margin-bottom: 8px;
  color: var(--text-color-secondary, rgba(255, 255, 255, 0.55));
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  letter-spacing: -0.24px;
}

.setting-section {
  margin-bottom: 24px;
  border-radius: 12px;
  background-color: var(--bg-color-entrycard);
  padding: 0 12px;
  color: var(--text-color-primary, rgba(255, 255, 255, 0.9));
  font-size: 16px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: -0.24px;
  &:last-child {
    margin-bottom: 0;
  }
}
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  &:not(:last-child) {
    border-bottom: 1px solid var(--stroke-color-primary);
  }
}

.setting-label {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--text-color-primary, #e3e5e8);
  &.disabled {
    color: var(--text-color-disabled, rgba(255, 255, 255, 0.3));
  }
}

.setting-select {
  width: 140px;
  flex-shrink: 0;
}

.setting-slider-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 320px;
  gap: 12px;
}

.setting-slider {
  flex: 1;
}

.quality-check-arrow {
  transform: rotate(270deg);
  margin-left: 4px;
}

.setting-value {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.setting-value-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--text-color-primary);
  margin-right: 4px;
}

.resolution-popup-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;

  .resolution-popup-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    -webkit-overflow-scrolling: touch;
  }

  .resolution-item {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 52px;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--text-color-primary);
    &.selected {
      color: var(--text-color-link);
      font-weight: 600;
    }
  }
}

$up-arrow-color: #1c66e5;
$down-arrow-color: #e59753;
.quality-popup-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  -moz-tap-highlight-color: transparent;

  .quality-popup-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    -webkit-overflow-scrolling: touch;
  }

  .quality-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-color-primary, rgba(255, 255, 255, 0.9));
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
    height: 30px;
  }

  .packet-loss-container {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
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
  }
}
</style>
