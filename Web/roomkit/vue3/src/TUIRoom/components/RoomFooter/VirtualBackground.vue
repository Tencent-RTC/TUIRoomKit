<template>
  <div
    v-if="componentConfig.visible"
    class="virtualBackground-control-container"
  >
    <icon-button :title="t('VirtualBackground')" @click-icon="openSettingPanel">
      <IconVirtualBackground size="24" />
    </icon-button>

    <Dialog
      v-model="isDialogVisible"
      :title="t('VirtualBackground')"
      width="600px"
      :modal="true"
      :append-to-room-container="true"
      :close-on-click-modal="false"
      @close="closeSettingPanel"
    >
      <div id="stream-preview" class="stream-preview">
        <div v-if="isLoading" class="mask"></div>
        <div v-if="isLoading" class="spinner"></div>
      </div>
      <div class="setting">
        <div
          :class="[
            'setting-item',
            selectedBackground === 'close' ? 'active' : '',
          ]"
          @click="applyVirtualBackground('close')"
        >
          <i class="setting-item-icon">
            <img
              :src="CloseVirtualBackground"
              alt="close"
              style="width: 32px"
            />
          </i>
          <span>{{ t('Close') }}</span>
        </div>
        <div
          :class="[
            'setting-item',
            selectedBackground === 'blur' ? 'active' : '',
          ]"
          @click="applyVirtualBackground('blur')"
        >
          <i class="setting-item-icon">
            <img :src="BlurredBackground" alt="blurred" />
          </i>
          <span>{{ t('BlurredBackground') }}</span>
        </div>
      </div>
      <div class="footer">
        <TUIButton
          :disabled="!isAllowed"
          @click="confirmVirtualBackground"
          type="primary"
          style="min-width: 88px"
        >
          {{ t('Save') }}
        </TUIButton>
        <TUIButton @click="closeSettingPanel" style="min-width: 88px">{{
          t('Cancel')
        }}</TUIButton>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  TUIButton,
  IconVirtualBackground,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../common/base/IconButton.vue';
import { useI18n } from '../../locales';
import { roomService } from '../../services';
import Dialog from '../common/base/Dialog';
import CloseVirtualBackground from '../../assets/imgs/close-virtual-background.png';
import BlurredBackground from '../../assets/imgs/blurred-background.png';

const { t } = useI18n();
const componentConfig =
  roomService.componentManager.getComponentConfig('VirtualBackground');
const isAllowed = computed(
  () => roomService.roomStore.localStream?.hasVideoStream
);
const appliedBackground = ref<'close' | 'blur'>('close');
const selectedBackground = ref<'close' | 'blur'>('close');
const isDialogVisible = ref(false);
const isLoading = ref(false);
const openSettingPanel = async () => {
  roomService.virtualBackground.initVirtualBackground();
  isDialogVisible.value = true;
  isLoading.value = true;
  await nextTick();
  await roomService.roomEngine.instance?.startCameraDeviceTest({
    view: 'stream-preview',
  });
  isLoading.value = false;
};

const closeSettingPanel = async () => {
  isDialogVisible.value = false;
  await applyVirtualBackground(appliedBackground.value);
  roomService.roomEngine.instance?.stopCameraDeviceTest();
  selectedBackground.value = appliedBackground.value;
};

const confirmVirtualBackground = async () => {
  if (!isAllowed.value) return;
  appliedBackground.value = selectedBackground.value;
  closeSettingPanel();
  if (selectedBackground.value === 'blur') {
    await roomService.virtualBackground.toggleVirtualBackground(true);
  }
  if (selectedBackground.value === 'close') {
    await roomService.virtualBackground.toggleVirtualBackground(false);
  }
};

const applyVirtualBackground = async (type: 'close' | 'blur') => {
  isLoading.value = true;
  try {
    selectedBackground.value = type;
    await roomService.virtualBackground.toggleTestVirtualBackground(
      type === 'blur'
    );
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.stream-preview {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 310px;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--uikit-color-black-1);
}

.setting {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 1rem;
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid var(--stroke-color-primary);

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
    }
  }

  &-item.active {
    color: var(--text-color-button);
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
