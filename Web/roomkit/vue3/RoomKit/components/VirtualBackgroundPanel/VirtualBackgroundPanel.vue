<template>
  <div class="virtual-background">
    <div id="stream-preview" class="stream-preview">
      <div v-if="isLoading" class="mask" />
      <div v-if="isLoading" class="spinner" />
    </div>
    <div class="setting">
      <div
        :class="[
          'setting-item',
          selectedBackground === 'close' ? 'active' : '',
          !isInitialized ? 'disabled' : '',
        ]"
        @click="applyVirtualBackground('close')"
      >
        <i class="setting-item-icon">
          <img
            :src="CloseVirtualBackground"
            alt="close"
            style="width: 32px; height: 32px;"
          >
        </i>
        <span class="setting-item-text">{{ t('VirtualBackground.Close') }}</span>
      </div>
      <div
        :class="[
          'setting-item',
          selectedBackground === 'blur' ? 'active' : '',
          !isInitialized ? 'disabled' : '',
        ]"
        @click="applyVirtualBackground('blur')"
      >
        <i class="setting-item-icon">
          <img :src="BlurredBackground" alt="blurred">
        </i>
        <span class="setting-item-text">{{ t('VirtualBackground.Blurred') }}</span>
      </div>
      <div
        v-for="(img, index) in customImages"
        :key="img.url"
        :class="[
          'setting-item',
          selectedBackground === `image-${index}` ? 'active' : '',
          !isInitialized ? 'disabled' : '',
        ]"
        @click="applyVirtualBackground(`image-${index}`)"
      >
        <i class="setting-item-icon">
          <img
            :src="img.url"
            :alt="resolveLabel(img.label) || `${t('VirtualBackground.Custom')} ${index + 1}`"
          >
        </i>
        <span class="setting-item-text">{{ resolveLabel(img.label) || `${t('VirtualBackground.Custom')} ${index + 1}` }}</span>
      </div>
    </div>
    <div class="footer">
      <TUIButton
        :disabled="!isInitialized"
        type="primary"
        @click="confirmVirtualBackground"
      >
        {{ t('VirtualBackground.Save') }}
      </TUIButton>
      <TUIButton @click="cancelVirtualBackground">
        {{
          t('VirtualBackground.Cancel')
        }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { TOAST_TYPE, TUIButton, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useDeviceState } from 'tuikit-atomicx-vue3/room';
import { useVirtualBackgroundState } from 'tuikit-atomicx-vue3/room';
import { VirtualBackgroundEvent, VirtualBackgroundType } from 'tuikit-atomicx-vue3';
// Asset imports
import BlurredBackground from './assets/blurred-background.png';
import CloseVirtualBackground from './assets/close-virtual-background.png';
import type { CustomBackgroundImage } from 'tuikit-atomicx-vue3';

// Hooks and composables
const { t } = useUIKit();

function resolveLabel(label?: string | (() => string)): string | undefined {
  if (typeof label === 'function') {
    return label();
  }
  return label;
}

const emit = defineEmits(['close']);
const props = withDefaults(defineProps<{
  assetsPath: string;
  customImages?: CustomBackgroundImage[];
}>(), {
  assetsPath: 'https://web.sdk.qcloud.com/hybrid/trtc-sdk-v5/assets',
  customImages: () => [],
});

const {
  startCameraTest,
  stopCameraTest,
} = useDeviceState();

const {
  virtualBackgroundConfig,
  initVirtualBackground,
  setVirtualBackground,
  saveVirtualBackground,
  subscribeEvent,
  unsubscribeEvent,
} = useVirtualBackgroundState();

// Types
type BackgroundType = 'close' | 'blur' | `image-${number}`;

/**
 * Resolve initial selection from saved config
 */
function resolveInitialSelection(): BackgroundType {
  const config = virtualBackgroundConfig.value;
  if (!config?.enable) {
    return 'close';
  }
  if (config.type === VirtualBackgroundType.blur) {
    return 'blur';
  }
  if (config.type === VirtualBackgroundType.image && config.imagePath) {
    const idx = props.customImages.findIndex(img => img.url === config.imagePath);
    if (idx >= 0) {
      return `image-${idx}`;
    }
  }
  return 'close';
}

// State references
const selectedBackground = ref<BackgroundType>(resolveInitialSelection());
const isLoading = ref(false);
const isInitialized = ref(false);

// Helper functions
/**
 * Get virtual background configuration based on type
 */
function getVirtualBackgroundConfig(type: BackgroundType) {
  if (type === 'close') {
    return { enable: false };
  }
  if (type === 'blur') {
    return { enable: true, type: VirtualBackgroundType.blur };
  }
  // Handle image-N pattern
  const index = Number(type.replace('image-', ''));
  const img = props.customImages[index];
  if (img) {
    return {
      enable: true,
      type: VirtualBackgroundType.image,
      imagePath: img.url,
    };
  }
  return { enable: false };
}

/**
 * Close the virtual background panel
 */
async function closePanel() {
  emit('close');
}

/**
 * Show error toast message
 */
function showErrorToast(message: string) {
  TUIToast({
    type: TOAST_TYPE.ERROR,
    message: t(message),
  });
}

/**
 * Initialize and restore virtual background settings
 */
async function initializeVirtualBackground() {
  isLoading.value = true;
  isInitialized.value = false;
  try {
    await initVirtualBackground({ assetsPath: props.assetsPath });
    await startCameraTest({ view: 'stream-preview' });

    selectedBackground.value = resolveInitialSelection();
    const config = getVirtualBackgroundConfig(selectedBackground.value);
    await setVirtualBackground(config);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise(resolve => setTimeout(resolve, 3000)); // todo sdk 修复加载逻辑后移除此处

    isInitialized.value = true;
  } catch (error) {
    console.error('Failed to initialize virtual background:', error);
    showErrorToast('VirtualBackground.InitializeFailed');
  } finally {
    isLoading.value = false;
  }
}

// Event handlers
/**
 * Apply virtual background based on selected type
 */
async function applyVirtualBackground(type: BackgroundType) {
  if (!isInitialized.value) {
    return;
  }

  isLoading.value = true;
  try {
    selectedBackground.value = type;
    const config = getVirtualBackgroundConfig(type);
    await setVirtualBackground(config);
  } catch (error) {
    console.error('Failed to apply virtual background:', error);
    showErrorToast('VirtualBackground.ApplyFailed');
  } finally {
    isLoading.value = false;
  }
}

/**
 * Save current virtual background settings and close panel
 */
async function confirmVirtualBackground() {
  if (!isInitialized.value) {
    return;
  }

  try {
    await saveVirtualBackground();
    closePanel();
  } catch (error) {
    console.error('Failed to save virtual background:', error);
    showErrorToast('VirtualBackground.SaveFailed');
  }
}

/**
 * Cancel virtual background changes and close panel
 */
async function cancelVirtualBackground() {
  closePanel();
}

/**
 * Handle virtual background error event
 */
function handleVirtualBackgroundAbort() {
  showErrorToast('VirtualBackground.Aborted');
}

// Lifecycle hooks
onMounted(async () => {
  await initializeVirtualBackground();
  subscribeEvent(
    VirtualBackgroundEvent.onAbort,
    handleVirtualBackgroundAbort,
  );
});

onUnmounted(() => {
  setVirtualBackground(virtualBackgroundConfig.value || { enable: false });
  stopCameraTest();
  unsubscribeEvent(
    VirtualBackgroundEvent.onAbort,
    handleVirtualBackgroundAbort,
  );
});
</script>

<style lang="scss" scoped>
.virtual-background {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
.stream-preview {
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

.setting {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  gap: 16px;
  padding: 1rem;
  align-items: flex-start;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid var(--stroke-color-primary);
  flex-wrap: wrap;
  max-height: 200px;
  overflow: auto;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.3);
    border-radius: 2px;

    &:hover {
      background-color: rgba(144, 147, 153, 0.6);
    }
  }

  &-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    text-align: center;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--text-color-secondary);
    max-width: 70px;

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

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
      }
    }

    &-text {
      padding: 3px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
    }
  }

  &-item.active {
    color: var(--text-color-button);
    background-color: var(--button-color-primary-default);
    border: 1px solid var(--button-color-primary-default);
  }

  &-item.disabled {
    cursor: not-allowed;
    opacity: 0.5;
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
  border-top: 4px solid var(--text-color-link);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
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
  border-radius: 8px;
}
</style>
