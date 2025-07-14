<template>
  <div class="advanced-beauty">
    <icon-button :title="t('Beauty')" @click-icon="openBeautySettingPanel">
      <IconBasicBeauty size="24" />
    </icon-button>
    <TUIDialog
      :customClasses="['advanced-beauty-dialog']"
      :visible="isBeautyDialogVisible"
      :title="t('Beauty')"
      :center="true"
      @close="closeBeautySettingPanel"
    >
      <div class="advanced-beauty-container">
        <div class="video-container">
          <div id="test-preview" class="test-preview"></div>
          <div class="reset" @click="handleResetBeautyClick">
            <ResetIcon />
            <span class="text">{{ t('Reset') }}</span>
          </div>
          <div v-if="isShowDegree" class="degree">
            <span class="text">{{ t('Degree') }}</span>
            <Slider
              v-model="sliderValue"
              class="slider"
              :min="sliderMinValue"
              :max="sliderMaxValue"
            />
            <span class="text-value">{{ sliderValue }}</span>
          </div>
          <div v-if="isLoading" class="mask"></div>
          <div v-if="isLoading" class="spinner"></div>
        </div>
        <div class="beauty-tabs">
          <div class="beauty-tabs-header">
            <div
              v-for="[key] in beautyPanels"
              :key="key"
              class="beauty-tabs-header-item"
              :class="{ 'is-active': activePanel === key }"
              @click="handleBeautyPanelClick(key)"
            >
              {{
                lang === 'zh-CN'
                  ? beautyPanels.get(key)?.name
                  : beautyPanels.get(key)?.nameEn
              }}
            </div>
          </div>
          <div class="beauty-tabs-panels">
            <!-- Basic Beauty-->
            <MultiBeauty
              v-show="activePanel === AdvancedBeautyType.basicBeauty"
              :beautyType="AdvancedBeautyType.basicBeauty"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--Advanced Beauty-->
            <MultiBeauty
              v-show="activePanel === AdvancedBeautyType.advancedBeauty"
              :beautyType="AdvancedBeautyType.advancedBeauty"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--Image Quality-->
            <Beauty
              v-show="activePanel === AdvancedBeautyType.imageQuality"
              :beautyType="AdvancedBeautyType.imageQuality"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--Makeup-->
            <MultiBeauty
              v-show="activePanel === AdvancedBeautyType.makeup"
              :beautyType="AdvancedBeautyType.makeup"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--BodyBeauty-->
            <Beauty
              v-show="activePanel === AdvancedBeautyType.bodyBeauty"
              :beautyType="AdvancedBeautyType.bodyBeauty"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--AdvancedMakeup-->
            <Beauty
              v-show="activePanel === AdvancedBeautyType.advancedMakeup"
              :beautyType="AdvancedBeautyType.advancedMakeup"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--Lut-->
            <Beauty
              v-show="activePanel === AdvancedBeautyType.filters"
              :beautyType="AdvancedBeautyType.filters"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--Motion-->
            <Beauty
              v-show="activePanel === AdvancedBeautyType.motion"
              :beautyType="AdvancedBeautyType.motion"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
            <!--VirtualBackground-->
            <VirtualBackground
              v-show="activePanel === AdvancedBeautyType.virtualBackground"
              :beautyItems="beautyPanels"
              @beauty-property-click="handleBeautyPropertyClick"
            />
          </div>
        </div>
      </div>
      <template v-slot:footer><div></div></template>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, nextTick, watch } from 'vue';
import { storeToRefs } from 'pinia';
import {
  IconBasicBeauty,
  TUIDialog,
} from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../../components/common/base/IconButton.vue';
import ResetIcon from '../../../components/common/icons/ResetIcon.vue';
import Slider from '../../../components/common/base/Slider.vue';
import { useI18n } from '../../../locales';
import {
  generateBeautyPanel,
  BeautyPanelInfo,
  BeautyItem,
} from './GenerateBeautyConfig';
import { AdvancedBeautyType } from '../../type';
import { Beauty, MultiBeauty, VirtualBackground } from './BeautyPanel';
import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import { useAdvancedBeautyState } from '../../hooks';
import { useBasicStore } from '../../../stores/basic';

const { t } = useI18n();
const basicStore = useBasicStore();
const { lang } = storeToRefs(basicStore);
const {
  setAdvancedBeauty,
  clearBeautySetting,
  beautyConfigs,
  beautyLicenseInfo,
} = useAdvancedBeautyState();
const roomEngine = useGetRoomEngine();
const isBeautyDialogVisible = ref(false);

const isLoading = ref(false);
const isShowDegree = ref(false);
const sliderMinValue = ref(0);
const sliderMaxValue = ref(100);
const sliderValue = ref(0);
const activePanel = ref(AdvancedBeautyType.basicBeauty);

const activeBeautyItem = ref<{ key: string; item: BeautyItem }>({
  key: '',
  item: {
    key: '',
    icon: '',
    name: '',
    nameEn: '',
    effectName: '',
    resourcePath: '',
    backgroundPath: '',
  },
});

let beautyPanels: Map<AdvancedBeautyType, BeautyPanelInfo> = new Map();

onMounted(async () => {
  beautyPanels = generateBeautyPanel(beautyLicenseInfo.panelLevel);
});

onUnmounted(async () => {
  await handleResetBeautyClick();
});

watch(activeBeautyItem, value => {
  console.log('activeBeautyItem, ', activeBeautyItem.value);
  if (value) {
    if (
      value.item.minValue !== undefined &&
      value.item.maxValue !== undefined
    ) {
      sliderMaxValue.value = value.item.maxValue;
      sliderMinValue.value = value.item.minValue;
      isShowDegree.value = true;
      getCachedBeautySettingValue();
    } else {
      sliderValue.value = 0;
      isShowDegree.value = false;
    }

    setBeautyItem();
  }
});

watch(sliderValue, async () => {
  setBeautyItem();
});

async function openBeautySettingPanel() {
  isBeautyDialogVisible.value = true;
  isLoading.value = true;
  await nextTick();
  await startCameraTest();
  isLoading.value = false;
}

async function closeBeautySettingPanel() {
  await stopCameraTest();
  isBeautyDialogVisible.value = false;
  isShowDegree.value = false;
}

async function startCameraTest() {
  try {
    await roomEngine.instance?.startCameraDeviceTest({ view: 'test-preview' });
  } catch (error) {
    logger.log('startCameraDeviceTest error:', error);
  }
}

async function stopCameraTest() {
  try {
    await roomEngine.instance?.stopCameraDeviceTest();
  } catch (error) {
    logger.log('startCameraDeviceTest error:', error);
  }
}

function handleBeautyPropertyClick(
  panelType: AdvancedBeautyType,
  beautyKey: string,
  beautyItem: BeautyItem
) {
  if (panelType !== activePanel.value) {
    return;
  }
  activeBeautyItem.value = { key: beautyKey, item: beautyItem };
}

function handleBeautyPanelClick(key: AdvancedBeautyType) {
  activePanel.value = key;
}

async function handleResetBeautyClick() {
  sliderValue.value = 0;
  await nextTick();
  clearBeautySetting();
}

function setBeautyItem() {
  const beautyType = activePanel.value;
  const beautyConfig = {
    beautyType,
    beautyPanelKey: activeBeautyItem.value.key,
    resourcePath: activeBeautyItem.value.item.resourcePath,
    backgroundPath: activeBeautyItem.value.item.backgroundPath,
    effectKey: activeBeautyItem.value.item.effectName,
    effectValue: sliderValue.value,
  };
  setAdvancedBeauty(beautyType, beautyConfig);
}

function getCachedBeautySettingValue() {
  const beautyItems = beautyConfigs
    .get(activePanel.value)
    ?.get(activeBeautyItem.value.key);
  if (!beautyItems) {
    sliderValue.value = 0;
    return;
  }

  const beautyConfig = beautyItems.find(item => {
    const key = `${activeBeautyItem.value.key}_${item.effectKey}_${item.resourcePath}`;
    return key === activeBeautyItem.value.item.key;
  });
  if (!beautyConfig) {
    sliderValue.value = 0;
    return;
  }
  sliderValue.value = beautyConfig.effectValue;
}
</script>

<style lang="scss">
.advanced-beauty {
  .advanced-beauty-dialog {
    width: 950px;
  }
}
</style>

<style lang="scss" scoped>
.advanced-beauty-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.video-container {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 600px;
  height: 350px;
}

.test-preview {
  width: 100%;
  height: 100%;
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

.reset {
  position: absolute;
  left: 10px;
  bottom: 8px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  border-radius: 6px;
  height: 30px;
  width: 60px;
  color: var(--uikit-color-white-1);
  background-color: var(--uikit-color-black-5);
}

.degree {
  position: absolute;
  bottom: 8px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 4px 12px;
  left: 50%;
  width: 65%;
  cursor: default;
  border-radius: 6px;
  color: var(--uikit-color-white-1);
  background-color: var(--uikit-color-black-5);
  transform: translateX(-50%);

  .slider {
    width: 60%;
    margin-left: 12px;
  }

  .text {
    margin-left: 4px;
  }

  .text-value {
    width: 20px;
    margin-left: 10px;
  }
}

.beauty-tabs {
  height: 360px;
  width: 100%;
  margin-top: 10px;
  border: 2px solid var(--stroke-color-primary);
  border-radius: 10px;
  background-color: var(--bg-color-dialog);
}

.beauty-tabs-header {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-gap: 0px;
  align-items: center;
  text-align: center;
  height: 50px;
  background-color: var(--bg-color-default);
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 0 10px;
  border-bottom: 1px solid var(--stroke-color-primary);
}

.beauty-tabs-header-item {
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  font-size: 12px;
  height: 100%;
  border-radius: 10px;
  color: var(--text-color-secondary);
  margin: 1px;

  &.is-active {
    color: var(--uikit-color-theme-5);
  }
}

.beauty-tabs-panels {
  height: 300px;
  overflow: auto;
  margin-top: 5px;
  margin-bottom: 5px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  border-radius: 3px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  border-radius: 3px;
  background-color: var(--bg-color-default);
}
</style>
