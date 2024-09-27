<template>
  <div v-if="componentConfig.visible" class="basicBeauty-control-container">
    <icon-button :title="t('Beauty')" @click-icon="openBeautySettingPanel">
      <basic-beauty-icon />
    </icon-button>
    <Dialog
      v-model="isDialogVisible"
      :title="t('Beauty')"
      width="600px"
      :modal="true"
      :append-to-room-container="true"
      :close-on-click-modal="false"
      @close="closeBeautySettingPanel"
    >
      <div id="test-preview" class="test-preview">
        <div class="reset" @click="handleShowResetDialog">
          <svg-icon :icon="ResetIcon" />
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
          <svg-icon :icon="CompareIcon" />
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
              <svg-icon :icon="item.icon" />
            </i>
            <span>{{ t(item.text) }}</span>
          </div>
        </div>
      </div>
      <div class="footer">
        <div class="mirror-container">
          <input type="checkbox" v-model="isLocalStreamMirror" />
          <span class="mirror-text">{{ t('Mirror') }}</span>
        </div>
        <TuiButton
          class="button"
          :disabled="!isAllowed"
          @click="confirmBeautySetting"
        >
          {{ t('Save') }}
        </TuiButton>
        <TuiButton
          class="button"
          type="primary"
          @click="closeBeautySettingPanel"
        >
          {{ t('Cancel') }}
        </TuiButton>
      </div>
    </Dialog>
    <Dialog
      v-model="isShowResetDialog"
      :title="t('Sure you want to reset the beauty effect?')"
      width="480px"
      :modal="true"
      :append-to-room-container="true"
      :close-on-click-modal="true"
    >
      <span>{{
        t('All beauty parameters will revert to default after reset')
      }}</span>
      <template #footer>
        <tui-button size="default" @click="resetBeautyProperties">
          {{ t('Reset') }}
        </tui-button>
        <tui-button
          class="cancel"
          size="default"
          type="primary"
          @click="isShowResetDialog = false"
        >
          {{ t('Cancel') }}
        </tui-button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, reactive } from 'vue';
import { storeToRefs } from 'pinia';
import IconButton from '../common/base/IconButton.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import BasicBeautyIcon from '../common/icons/BasicBeautyIcon.vue';
import { useI18n } from '../../locales';
import { roomService } from '../../services';
import Dialog from '../common/base/Dialog';
import TuiButton from '../common/base/Button.vue';
import Slider from '../common/base/Slider.vue';
import CloseBeautyIcon from '../common/icons/CloseBeautyIcon.vue';
import SmootherBeautyIcon from '../common/icons/SmootherBeautyIcon.vue';
import WhiteningBeautyIcon from '../common/icons/WhiteningBeautyIcon.vue';
import RuddyBeautyIcon from '../common/icons/RuddyBeautyIcon.vue';
import ResetIcon from '../common/icons/ResetIcon.vue';
import CompareIcon from '../common/icons/CompareIcon.vue';
import useGetRoomEngine from '../../hooks/useRoomEngine';
import { useBasicStore } from '../../stores/basic';
import { isMobile } from '../../utils/environment';
import { TRTCBeautyStyle } from '../../constants/room';
import {
  TRTCVideoMirrorType,
  TRTCVideoRotation,
  TRTCVideoFillMode,
} from '@tencentcloud/tuiroom-engine-js';

const roomEngine = useGetRoomEngine();
const basicStore = useBasicStore();
const { isLocalStreamMirror } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowDegree = ref(false);
const isBeautyStarted = ref(false);

const componentConfig =
  roomService.componentManager.getComponentConfig('BasicBeauty');
const isAllowed = computed(
  () => roomService.roomStore.localStream.hasVideoStream
);

watch(isLocalStreamMirror, async (val: boolean) => {
  const trtcCloud = roomEngine.instance?.getTRTCCloud();
  if (!isMobile) {
    await trtcCloud?.setLocalRenderParams({
      mirrorType: val
        ? TRTCVideoMirrorType.TRTCVideoMirrorType_Enable
        : TRTCVideoMirrorType.TRTCVideoMirrorType_Disable,
      rotation: TRTCVideoRotation.TRTCVideoRotation0,
      fillMode: TRTCVideoFillMode.TRTCVideoFillMode_Fill,
    });
  }
});

const appliedBasicBeautyItem = ref<
  'close' | 'smoother' | 'whitening' | 'ruddy'
>('close');
const selectBasicBeautyItem = ref<'close' | 'smoother' | 'whitening' | 'ruddy'>(
  'close'
);
const isDialogVisible = ref(false);
const isShowResetDialog = ref(false);
const isLoading = ref(false);
const sliderValue = ref(0);
const beautyLevels = reactive({
  close: 0,
  smoother: 0,
  whitening: 0,
  ruddy: 0,
});

const beautyOptionList: {
  value: 'close' | 'smoother' | 'whitening' | 'ruddy';
  text: string;
  icon: any;
}[] = [
  { value: 'close', text: 'Close', icon: CloseBeautyIcon },
  { value: 'smoother', text: 'Smoother', icon: SmootherBeautyIcon },
  { value: 'whitening', text: 'Whitening', icon: WhiteningBeautyIcon },
  { value: 'ruddy', text: 'Ruddy', icon: RuddyBeautyIcon },
];

const openBeautySettingPanel = async () => {
  roomService.basicBeauty.initBasicBeauty();
  isDialogVisible.value = true;
  isLoading.value = true;
  await nextTick();
  await roomService.roomEngine.instance?.startCameraDeviceTest({
    view: 'test-preview',
  });
  await onBeautyPropertyClick(appliedBasicBeautyItem.value);
  isLoading.value = false;
};

const closeBeautySettingPanel = async () => {
  isDialogVisible.value = false;
  roomService.roomEngine.instance?.stopCameraDeviceTest();
  selectBasicBeautyItem.value = appliedBasicBeautyItem.value;
};

const confirmBeautySetting = async () => {
  if (!isAllowed.value) return;
  appliedBasicBeautyItem.value = selectBasicBeautyItem.value;
  if (selectBasicBeautyItem.value === 'close') {
    await roomService.basicBeauty.setBasicBeauty(
      TRTCBeautyStyle.TRTCBeautyStyleNature,
      0,
      0,
      0
    );
  } else {
    await roomService.basicBeauty.setBasicBeauty(
      TRTCBeautyStyle.TRTCBeautyStyleNature,
      Math.floor((beautyLevels.smoother / 100) * 9),
      Math.floor((beautyLevels.whitening / 100) * 9),
      Math.floor((beautyLevels.ruddy / 100) * 9)
    );
  }
  closeBeautySettingPanel();
};

const startBeautyTest = async () => {
  await roomService.basicBeauty.setTestBasicBeauty(
    TRTCBeautyStyle.TRTCBeautyStyleNature,
    Math.floor((beautyLevels.smoother / 100) * 9),
    Math.floor((beautyLevels.whitening / 100) * 9),
    Math.floor((beautyLevels.ruddy / 100) * 9)
  );
  isBeautyStarted.value = !(
    beautyLevels.smoother === 0 &&
    beautyLevels.whitening === 0 &&
    beautyLevels.ruddy === 0
  );
};

const closeBeautyTest = async () => {
  await roomService.basicBeauty.setTestBasicBeauty(
    TRTCBeautyStyle.TRTCBeautyStyleNature,
    0,
    0,
    0
  );
};

watch(sliderValue, async newValue => {
  if (selectBasicBeautyItem.value === 'smoother') {
    beautyLevels.smoother = newValue;
  }
  if (selectBasicBeautyItem.value === 'whitening') {
    beautyLevels.whitening = newValue;
  }
  if (selectBasicBeautyItem.value === 'ruddy') {
    beautyLevels.ruddy = newValue;
  }
  await startBeautyTest();
});

const onBeautyPropertyClick = async (
  type: 'close' | 'smoother' | 'whitening' | 'ruddy'
) => {
  if (type === 'close') {
    if (isBeautyStarted.value) {
      await closeBeautyTest();
    }
    beautyLevels.smoother = 0;
    beautyLevels.whitening = 0;
    beautyLevels.ruddy = 0;
    sliderValue.value = 0;
  } else {
    sliderValue.value = beautyLevels[type];
  }
  isShowDegree.value = type !== 'close';
  selectBasicBeautyItem.value = type;
  isLoading.value = false;
};

const handleShowResetDialog = () => {
  isShowResetDialog.value = true;
};

const resetBeautyProperties = async () => {
  await closeBeautyTest();
  beautyLevels.smoother = 0;
  beautyLevels.whitening = 0;
  beautyLevels.ruddy = 0;
  sliderValue.value = 0;
  isShowResetDialog.value = false;
};

const handleMouseDown = async () => {
  await closeBeautyTest();
};

const handleMouseUp = async () => {
  await startBeautyTest();
};
</script>

<style lang="scss" scoped>
.test-preview {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 310px;
  overflow: hidden;
  background-color: var(--black-color);
  border-radius: 8px;
}

.setting {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  border: 1px solid var(--border-color-2);
  border-radius: 8px;

  &-header {
    width: 100%;
    color: var(--active-color-1);
    background-color: var(--background-color-13);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 44px;
    border-bottom: 1px solid var(--border-color-2);
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
    font-size: 12px;
    color: var(--font-color-4);
    text-align: center;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 8px;
    margin-right: 20px;

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
    background-color: var(--active-color-1);
    border: 1px solid var(--active-color-1);
  }
}

.reset,
.compare,
.degree {
  z-index: 4;
  position: absolute;
  bottom: 8px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.4);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  .text {
    margin-left: 4px;
  }
}

.degree {
  left: 50%;
  transform: translateX(-50%);
  cursor: default;
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
.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 3;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--active-color-1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: spin 1s linear infinite;
}

.mask {
  position: absolute;
  z-index: 2;
  width: 100%;
  height: 100%;
  background-color: var(--black-color);
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

  .mirror-container {
    position: absolute;
    left: 24px;
    display: flex;
    .mirror-text {
      margin-left: 4px;
    }
  }
}
.cancel {
  margin-left: 12px;
}
</style>
