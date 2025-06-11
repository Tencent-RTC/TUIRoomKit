<template>
  <div class="free-beauty">
    <icon-button :title="t('Beauty')" @click-icon="openBeautySettingPanel">
      <IconBasicBeauty size="24" />
    </icon-button>
    <TUIDialog
      :customClasses="['beauty-dialog']"
      :visible="isBeautyDialogVisible"
      :title="t('Beauty')"
      :center="true"
      :confirmText="t('Save')"
      :cancelText="t('Cancel')"
      @confirm="saveFreeBeautySetting"
      @cancel="cancelFreeBeautySetting"
      @close="closeBeautySettingPanel"
    >
      <div class="free-beauty-container">
        <div id="test-preview" class="test-preview">
          <div class="reset" @click="handleShowResetDialog">
            <IconReset />
            <span class="text">{{ t('Reset') }}</span>
          </div>
          <div v-if="isShowDegree" class="degree">
            <span class="text">{{ t('Degree') }}</span>
            <Slider v-model="sliderValue" class="slider" />
            <span class="text-value">{{ sliderValue }}</span>
          </div>
          <div
            class="compare"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp"
          >
            <IconCompare size="20" />
            <span class="text">{{ t('Compare') }}</span>
          </div>
          <div v-if="isLoading" class="mask"></div>
          <div v-if="isLoading" class="spinner"></div>
        </div>
        <div class="setting">
          <div class="setting-header">{{ t('Beauty Effects') }}</div>
          <div class="setting-container">
            <div
              v-for="item in beautyOptionList"
              :key="item.value"
              :class="[
                'setting-item',
                selectBasicBeautyItem === item.value ? 'active' : '',
              ]"
              @click="onBeautyPropertyClick(item.value)"
            >
              <i class="setting-item-icon">
                <TUIIcon :icon="item.icon" size="32" />
              </i>
              <span>{{ t(item.text) }}</span>
            </div>
          </div>
        </div>
        <div class="footer">
          <div class="mirror-container">
            <input type="checkbox" v-model="isLocalMirror" />
            <span class="mirror-text">{{ t('Mirror') }}</span>
          </div>
        </div>
      </div>
    </TUIDialog>
    <TUIDialog
      :visible="isResetDialogVisible"
      :title="t('Sure you want to reset the beauty effect?')"
      :center="true"
      @confirm="resetBeautyProperties"
      @cancel="handleHideResetDialog"
      @close="handleHideResetDialog"
    >
      <span>
        {{ t('All beauty parameters will revert to default after reset') }}
      </span>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import {
  IconBasicBeauty,
  TUIIcon,
  IconReset,
  IconCompare,
  IconCloseBeauty,
  IconSmootherBeauty,
  IconWhiteningBeauty,
  IconRuddyBeauty,
  TUIDialog,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../../locales';
import { useVideoDeviceState, useFreeBeautyState } from '../../hooks';
import IconButton from '../../../components/common/base/IconButton.vue';
import Slider from '../../../components/common/base/Slider.vue';
import { throttle } from '../../../utils/utils';
import { FreeBeautyConfig } from '../../type';

const { isCameraTesting, isCameraTestLoading, camera, isLocalMirror } =
  useVideoDeviceState();
const { beautyConfig, setFreeBeauty, saveBeautySetting } = useFreeBeautyState();
const { t } = useI18n();

const isBeautyDialogVisible = ref(false);
const isResetDialogVisible = ref(false);
const isShowDegree = ref(false);
const isLoading = ref(false);
const isBeautyStarted = ref(false);
const sliderValue = ref(0);

const freeBeautyConfig = ref<FreeBeautyConfig>({
  beautyLevel: 0,
  whitenessLevel: 0,
  ruddinessLevel: 0,
});

enum BeautyOptionType {
  Close = 'close',
  Smoother = 'smoother',
  Whitening = 'whitening',
  Ruddy = 'ruddy',
}

const selectBasicBeautyItem = ref<BeautyOptionType>(BeautyOptionType.Close);
const appliedBasicBeautyItem = ref<BeautyOptionType>(BeautyOptionType.Close);

const beautyOptionList: {
  value: BeautyOptionType;
  text: string;
  icon: any;
}[] = [
  { value: BeautyOptionType.Close, text: 'Close', icon: IconCloseBeauty },
  {
    value: BeautyOptionType.Smoother,
    text: 'Smoother',
    icon: IconSmootherBeauty,
  },
  {
    value: BeautyOptionType.Whitening,
    text: 'Whitening',
    icon: IconWhiteningBeauty,
  },
  { value: BeautyOptionType.Ruddy, text: 'Ruddy', icon: IconRuddyBeauty },
];

const throttleStartBeautyTest = throttle(startBeautyTest, 300);
watch(sliderValue, async newValue => {
  if (selectBasicBeautyItem.value === BeautyOptionType.Smoother) {
    freeBeautyConfig.value.beautyLevel = newValue;
  }
  if (selectBasicBeautyItem.value === BeautyOptionType.Whitening) {
    freeBeautyConfig.value.whitenessLevel = newValue;
  }
  if (selectBasicBeautyItem.value === BeautyOptionType.Ruddy) {
    freeBeautyConfig.value.ruddinessLevel = newValue;
  }

  throttleStartBeautyTest();
});

watch(isLocalMirror, async (mirror: boolean) => {
  camera.switchMirror({ mirror });
});

function onBeautyPropertyClick(option: BeautyOptionType) {
  switch (option) {
    case BeautyOptionType.Close:
      {
        if (isBeautyStarted.value) {
          stopBeautyTest();
        }
        freeBeautyConfig.value.beautyLevel = 0;
        freeBeautyConfig.value.whitenessLevel = 0;
        freeBeautyConfig.value.ruddinessLevel = 0;
        sliderValue.value = 0;
      }
      break;
    case BeautyOptionType.Smoother:
      sliderValue.value = freeBeautyConfig.value.beautyLevel;
      break;
    case BeautyOptionType.Whitening:
      sliderValue.value = freeBeautyConfig.value.whitenessLevel;
      break;
    case BeautyOptionType.Ruddy:
      sliderValue.value = freeBeautyConfig.value.ruddinessLevel;
      break;
    default:
      break;
  }
  selectBasicBeautyItem.value = option;
  isShowDegree.value = option !== BeautyOptionType.Close;
  isLoading.value = false;
}

// functions
async function openBeautySettingPanel() {
  isBeautyDialogVisible.value = true;
  isLoading.value = true;
  await nextTick();
  await startCameraTest();
  isLoading.value = false;
}

async function closeBeautySettingPanel() {
  isBeautyDialogVisible.value = false;
  await stopCameraTest();
  onBeautyPropertyClick(appliedBasicBeautyItem.value);
  selectBasicBeautyItem.value = appliedBasicBeautyItem.value;
}

async function startCameraTest() {
  await camera.startCameraDeviceTest({ view: 'test-preview' });
}

async function stopCameraTest() {
  if (isCameraTesting.value || isCameraTestLoading.value) {
    await camera.stopCameraDeviceTest();
  }
}

async function startBeautyTest() {
  setFreeBeauty(freeBeautyConfig.value);
  isBeautyStarted.value = !(
    freeBeautyConfig.value.beautyLevel === 0 &&
    freeBeautyConfig.value.whitenessLevel === 0 &&
    freeBeautyConfig.value.ruddinessLevel === 0
  );
}

function stopBeautyTest() {
  const config = { beautyLevel: 0, whitenessLevel: 0, ruddinessLevel: 0 };
  setFreeBeauty(config);
}

function saveFreeBeautySetting() {
  appliedBasicBeautyItem.value = selectBasicBeautyItem.value;
  saveBeautySetting();
  closeBeautySettingPanel();
}

function cancelFreeBeautySetting() {
  freeBeautyConfig.value = { ...beautyConfig.value };
  closeBeautySettingPanel();
}

function handleShowResetDialog() {
  isResetDialogVisible.value = true;
}

function handleHideResetDialog() {
  isResetDialogVisible.value = false;
}

function resetBeautyProperties() {
  stopBeautyTest();
  freeBeautyConfig.value.beautyLevel = 0;
  freeBeautyConfig.value.whitenessLevel = 0;
  freeBeautyConfig.value.ruddinessLevel = 0;
  sliderValue.value = 0;
  isResetDialogVisible.value = false;
}

function handleMouseDown() {
  stopBeautyTest();
}

function handleMouseUp() {
  startBeautyTest();
}
</script>

<style lang="scss">
.free-beauty {
  .beauty-dialog {
    width: 600px;
  }
}
</style>

<style lang="scss" scoped>
.free-beauty {
  .free-beauty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 600px;
  }

  .test-preview {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 310px;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
    background-color: var(--uikit-color-black-1);
  }

  .reset,
  .compare,
  .degree {
    position: absolute;
    bottom: 8px;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    padding: 4px 12px;
    cursor: pointer;
    border-radius: 6px;
    color: var(--uikit-color-white-1);
    background-color: var(--uikit-color-black-5);

    .text {
      margin-left: 4px;
    }
  }

  .degree {
    left: 50%;
    cursor: default;
    transform: translateX(-50%);

    .slider {
      margin-left: 12px;
    }

    .text-value {
      width: 20px;
      margin-left: 10px;
    }
  }

  .reset {
    left: 8px;
  }

  .compare {
    right: 8px;
  }

  .setting {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 10px;
    border-radius: 8px;
    width: 100%;
    border: 1px solid var(--stroke-color-primary);

    &-header {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 44px;
      color: var(--text-color-link);
      background-color: var(--bg-color-dialog-module);
      border-bottom: 1px solid var(--stroke-color-primary);
    }

    &-container {
      display: flex;
      width: 100%;
      padding: 20px;
    }

    &-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 20px;
      font-size: 12px;
      text-align: center;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--text-color-secondary);

      &-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 54px;
        height: 54px;
        overflow: hidden;
        border-radius: 8px;
        background-color: var(--bg-color-dialog);
        border: 1px solid var(--stroke-color-primary);
      }
    }

    &-item.active {
      background-color: var(--button-color-primary-default);
      border: 1px solid var(--button-color-primary-default);
    }
  }

  .spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 3;
    width: 40px;
    height: 40px;
    border: 4px solid var(--uikit-color-white-2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: spin 1s linear infinite;
    border-top: 4px solid var(--text-color-link);
  }

  .mask {
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 100%;
    background-color: var(--uikit-color-black-1);
  }

  @keyframes spin {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }

    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  .footer {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    margin-top: 10px;
    width: 100%;
    border-radius: 8px;

    .mirror-container {
      position: absolute;
      left: 24px;
      display: flex;

      .mirror-text {
        margin-left: 4px;
      }
    }
  }
}
</style>
