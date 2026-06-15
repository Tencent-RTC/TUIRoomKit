<template>
  <div class="free-beauty">
    <div class="free-beauty-container">
      <div id="test-preview" class="test-preview">
        <div class="test-preview-control">
          <div class="reset" @click="handleShowResetDialog">
            <IconReset />
            <span class="text">{{ t('FreeBeauty.Reset') }}</span>
          </div>
          <div v-if="isShowDegree" class="degree">
            <span class="text">{{ t('FreeBeauty.Degree') }}</span>
            <TUISlider v-model="sliderValue" class="slider" />
            <span class="text-value">{{ sliderValue }}</span>
          </div>
          <div
            class="compare"
            @mousedown="handleMouseDown"
            @mouseup="handleMouseUp"
          >
            <IconCompare size="20" />
            <span class="text">{{ t('FreeBeauty.Compare') }}</span>
          </div>
        </div>
        <div v-if="isLoading" class="mask" />
        <div v-if="isLoading" class="spinner" />
      </div>
      <div class="setting">
        <div class="setting-header">
          {{ t('FreeBeauty.Beauty Effects') }}
        </div>
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
            <span class="setting-item-text">{{ t(item.text) }}</span>
          </div>
        </div>
      </div>
      <div class="footer">
        <TUIButton
          type="primary"
          @click="saveFreeBeautySetting"
        >
          {{ t('FreeBeauty.Save') }}
        </TUIButton>
        <TUIButton @click="cancelFreeBeautySetting">
          {{
            t('FreeBeauty.Cancel')
          }}
        </TUIButton>
      </div>
    </div>
    <TUIDialog
      :visible="isResetDialogVisible"
      :title="t('FreeBeauty.Sure you want to reset the beauty effect?')"
      :cancel-text="t('FreeBeauty.Cancel')"
      :confirm-text="t('FreeBeauty.Confirm')"
      @confirm="resetBeautyProperties"
      @cancel="handleHideResetDialog"
      @close="handleHideResetDialog"
    >
      <span>
        {{ t('FreeBeauty.All beauty parameters will revert to default after reset') }}
      </span>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import {
  TUIIcon,
  IconReset,
  IconCompare,
  IconCloseBeauty,
  IconSmootherBeauty,
  IconWhiteningBeauty,
  IconRuddyBeauty,
  TUIDialog,
  useUIKit,
  TUISlider,
  TUIButton,
  TUIToast,
} from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { useFreeBeautyState } from 'tuikit-atomicx-vue3/room';
import type { FreeBeautyConfig } from 'tuikit-atomicx-vue3';

// Utility function for throttling
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Hooks and composables
const {
  isCameraTesting,
  isCameraTestLoading,
  startCameraTest,
  stopCameraTest,
} = useDeviceState();

const { beautyConfig, setFreeBeauty, saveBeautySetting } = useFreeBeautyState();
const { t } = useUIKit();
const emit = defineEmits(['close']);

// State references
const isResetDialogVisible = ref(false);
const isShowDegree = ref(false);
const isLoading = ref(false);
const isBeautyStarted = ref(false);
const sliderValue = ref(0);

// Beauty configuration
const freeBeautyConfig = ref<FreeBeautyConfig>({
  beautyLevel: 0,
  whitenessLevel: 0,
  ruddinessLevel: 0,
});

// Beauty option types
enum BeautyOptionType {
  Close = 'close',
  Smoother = 'smoother',
  Whitening = 'whitening',
  Ruddy = 'ruddy',
}

// UI state for selected beauty options
const selectBasicBeautyItem = ref<BeautyOptionType>(BeautyOptionType.Close);
const appliedBasicBeautyItem = ref<BeautyOptionType>(BeautyOptionType.Close);

// Beauty options configuration
const beautyOptionList: {
  value: BeautyOptionType;
  text: string;
  icon: any;
}[] = [
  { value: BeautyOptionType.Close, text: 'FreeBeauty.Close', icon: IconCloseBeauty },
  {
    value: BeautyOptionType.Smoother,
    text: 'FreeBeauty.Smoother',
    icon: IconSmootherBeauty,
  },
  {
    value: BeautyOptionType.Whitening,
    text: 'FreeBeauty.Whitening',
    icon: IconWhiteningBeauty,
  },
  { value: BeautyOptionType.Ruddy, text: 'FreeBeauty.Ruddy', icon: IconRuddyBeauty },
];

// Throttled version of startBeautyTest to prevent excessive calls
const throttleStartBeautyTest = throttle(startBeautyTest, 300);

// Watchers
watch(sliderValue, async (newValue) => {
  updateBeautyConfigByType(selectBasicBeautyItem.value, newValue);
  throttleStartBeautyTest();
});

// Helper functions
/**
 * Update beauty configuration based on beauty type and value
 */
function updateBeautyConfigByType(type: BeautyOptionType, value: number) {
  switch (type) {
    case BeautyOptionType.Smoother:
      freeBeautyConfig.value.beautyLevel = value;
      break;
    case BeautyOptionType.Whitening:
      freeBeautyConfig.value.whitenessLevel = value;
      break;
    case BeautyOptionType.Ruddy:
      freeBeautyConfig.value.ruddinessLevel = value;
      break;
    default:
      break;
  }
}

/**
 * Check if any beauty effect is active
 */
function isBeautyActive(): boolean {
  return !(
    freeBeautyConfig.value.beautyLevel === 0
    && freeBeautyConfig.value.whitenessLevel === 0
    && freeBeautyConfig.value.ruddinessLevel === 0
  );
}

/**
 * Restore beauty settings from saved configuration
 */
function restoreBeautySettings() {
  freeBeautyConfig.value = { ...beautyConfig.value };

  // Determine the active beauty option based on restored values
  if (freeBeautyConfig.value.beautyLevel > 0) {
    selectBasicBeautyItem.value = BeautyOptionType.Smoother;
    sliderValue.value = freeBeautyConfig.value.beautyLevel;
    isShowDegree.value = true;
  } else if (freeBeautyConfig.value.whitenessLevel > 0) {
    selectBasicBeautyItem.value = BeautyOptionType.Whitening;
    sliderValue.value = freeBeautyConfig.value.whitenessLevel;
    isShowDegree.value = true;
  } else if (freeBeautyConfig.value.ruddinessLevel > 0) {
    selectBasicBeautyItem.value = BeautyOptionType.Ruddy;
    sliderValue.value = freeBeautyConfig.value.ruddinessLevel;
    isShowDegree.value = true;
  } else {
    selectBasicBeautyItem.value = BeautyOptionType.Close;
    sliderValue.value = 0;
    isShowDegree.value = false;
  }

  // Save the currently applied beauty option
  appliedBasicBeautyItem.value = selectBasicBeautyItem.value;
}

/**
 * Reset all beauty properties to default values
 */
function resetBeautyProperties() {
  stopBeautyTest();
  freeBeautyConfig.value.beautyLevel = 0;
  freeBeautyConfig.value.whitenessLevel = 0;
  freeBeautyConfig.value.ruddinessLevel = 0;
  sliderValue.value = 0;
  isResetDialogVisible.value = false;
}

/**
 * Reset beauty configuration to default
 */
function resetBeautyConfig() {
  freeBeautyConfig.value.beautyLevel = 0;
  freeBeautyConfig.value.whitenessLevel = 0;
  freeBeautyConfig.value.ruddinessLevel = 0;
  sliderValue.value = 0;
}

/**
 * Get slider value based on selected beauty option
 */
function getSliderValueByType(type: BeautyOptionType): number {
  switch (type) {
    case BeautyOptionType.Smoother:
      return freeBeautyConfig.value.beautyLevel;
    case BeautyOptionType.Whitening:
      return freeBeautyConfig.value.whitenessLevel;
    case BeautyOptionType.Ruddy:
      return freeBeautyConfig.value.ruddinessLevel;
    default:
      return 0;
  }
}

// Event handlers
function onBeautyPropertyClick(option: BeautyOptionType) {
  switch (option) {
    case BeautyOptionType.Close:
      if (isBeautyStarted.value) {
        stopBeautyTest();
      }
      resetBeautyConfig();
      break;
    case BeautyOptionType.Smoother:
    case BeautyOptionType.Whitening:
    case BeautyOptionType.Ruddy:
      sliderValue.value = getSliderValueByType(option);
      break;
    default:
      break;
  }

  selectBasicBeautyItem.value = option;
  isShowDegree.value = option !== BeautyOptionType.Close;
  isLoading.value = false;
}

async function closeBeautySettingPanel() {
  await stopCameraTestFunction();
  onBeautyPropertyClick(appliedBasicBeautyItem.value);
  selectBasicBeautyItem.value = appliedBasicBeautyItem.value;
  emit('close');
}

async function startCameraTestFunction() {
  try {
    await startCameraTest({ view: 'test-preview' });
  } catch (error) {
    console.error('Failed to start camera test:', error);
    TUIToast.error({ message: t('FreeBeauty.CameraTestFailed') });
  }
}

async function stopCameraTestFunction() {
  try {
    if (isCameraTesting.value || isCameraTestLoading.value) {
      await stopCameraTest();
    }
  } catch (error) {
    console.error('Failed to stop camera test:', error);
  }
}

async function startBeautyTest() {
  try {
    setFreeBeauty(freeBeautyConfig.value);
    isBeautyStarted.value = isBeautyActive();
  } catch (error) {
    console.error('Failed to apply beauty:', error);
    TUIToast.error({ message: t('FreeBeauty.ApplyFailed') });
  }
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

function handleMouseDown() {
  stopBeautyTest();
}

function handleMouseUp() {
  startBeautyTest();
}

// Lifecycle hooks
onMounted(async () => {
  isLoading.value = true;
  try {
    await nextTick();

    // Restore beauty settings
    restoreBeautySettings();

    await startCameraTestFunction();

    // Apply beauty effects if any are active
    if (isShowDegree.value) {
      startBeautyTest();
    }
  } catch (error) {
    console.error('Failed to initialize beauty:', error);
    TUIToast.error({ message: t('FreeBeauty.InitializeFailed') });
  } finally {
    isLoading.value = false;
  }
});
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
  width: 100%;
  .free-beauty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .test-preview {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 310px;
    width: 100%;
    overflow: hidden;
    border-radius: 8px;
    background-color: var(--uikit-color-black-1);
  }

  .test-preview-control {
    position: absolute;
    bottom: 8px;
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 30px;
    box-sizing: border-box;
    padding: 0 6px;
  }

  .reset,
  .compare,
  .degree {
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
    box-sizing: border-box;

    .text {
      margin-left: 4px;
    }
  }

  .degree {
    flex: 2;
    cursor: default;
    max-width: 260px;

    .slider {
      margin-left: 12px;
    }

    .text-value {
      width: 20px;
      margin-left: 10px;
    }
  }

  .reset {
    flex: 1;
    max-width: 76px;
  }

  .compare {
    flex: 1;
    max-width: 76px;
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
      gap: 20px;
      box-sizing: border-box;
    }

    &-item {
      display: flex;
      flex-direction: column;
      justify-content: center;
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
        margin: auto;
      }

      &-text {
        padding: 3px 0;
      }
    }

    &-item.active {
      background-color: var(--button-color-primary-default);
      border: 1px solid var(--button-color-primary-default);
      .setting-item-text {
        color: var(--text-color-button);
      }
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
    color: var(--text-color-button);

    .mirror-container {
      position: absolute;
      left: 24px;
      display: flex;
      color: var(--text-color-secondary);

      .mirror-text {
        margin-left: 4px;
      }
    }
  }
}
</style>
