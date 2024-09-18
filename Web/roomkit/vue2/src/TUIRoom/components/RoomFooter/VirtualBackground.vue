<template>
  <div
    v-if="componentConfig.visible"
    class="virtualBackground-control-container"
  >
    <icon-button :title="t('VirtualBackground')" @click-icon="openSettingPanel">
      <virtual-background-icon />
    </icon-button>

    <Dialog
      v-model="isDialogVisible"
      :title="t('VirtualBackground')"
      width="600px"
      :modal="true"
      :append-to-room-container="true"
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
        <TuiButton
          class="button"
          :disabled="!isAllowed"
          @click="confirmVirtualBackground"
        >
          {{ t('Save') }}
        </TuiButton>
        <TuiButton class="button" type="primary" @click="closeSettingPanel">{{
          t('Cancel')
        }}</TuiButton>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import VirtualBackgroundIcon from '../common/icons/VirtualBackgroundIcon.vue';
import { useI18n } from '../../locales';
import { roomService } from '../../services';
import Dialog from '../common/base/Dialog';
import CloseVirtualBackground from '../../assets/imgs/close-virtual-background.png';
import BlurredBackground from '../../assets/imgs/blurred-background.png';
import TuiButton from '../common/base/Button.vue';

const { t } = useI18n();
const componentConfig =
  roomService.componentManager.getComponentConfig('VirtualBackground');
const isAllowed = computed(
  () => roomService.roomStore.localStream.hasVideoStream
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
  await applyVirtualBackground(appliedBackground.value);
  isLoading.value = false;
};

const closeSettingPanel = async () => {
  isDialogVisible.value = false;
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
  background-color: #000;
  border-radius: 8px;
}

.setting {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 1rem;
  margin-top: 10px;
  border: 1px solid #e4e8ee;
  border-radius: 8px;

  &-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 12px;
    color: #4f586b;
    text-align: center;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;

    &-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 54px;
      height: 54px;
      overflow: hidden;
      background-color: #f0f3fa;
      border-radius: 8px;
    }
  }

  &-item.active {
    color: #fff;
    background-color: #1c66e5;
    border: 1px solid #1c66e5;
  }
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1c66e5;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
}

.mask {
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 100%;
  background-color: #000;
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

  .button {
    width: 84px;
    height: 32px;
  }
}
</style>
