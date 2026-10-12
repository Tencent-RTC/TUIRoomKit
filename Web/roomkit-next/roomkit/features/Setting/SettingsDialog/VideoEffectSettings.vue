<template>
  <div class="video-effect-settings">
    <CameraPreview v-model:previewing="isPreviewing" />

    <div class="video-effect-tabs-wrap">
      <div class="video-effect-tabs" role="tablist">
        <button
          class="video-effect-tab"
          :class="{ 'is-active': panel === 'background' }"
          type="button"
          role="tab"
          :aria-selected="panel === 'background'"
          @click="panel = 'background'"
        >
          {{ t('VirtualBackground.Title') }}
        </button>
        <button
          class="video-effect-tab"
          :class="{ 'is-active': panel === 'beauty' }"
          type="button"
          role="tab"
          :aria-selected="panel === 'beauty'"
          @click="panel = 'beauty'"
        >
          {{ t('Beauty.Title') }}
        </button>
      </div>
    </div>

    <VirtualBackgroundSettings
      v-show="panel === 'background'"
      :preview-ready="isPreviewing"
    />
    <BeautySettings
      v-show="panel === 'beauty'"
      :preview-ready="isPreviewing"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { t } from '../../../i18n';
import CameraPreview from '../../Device/VideoSettings/CameraPreview.vue';
import BeautySettings from '../../VideoEffect/BeautySettings/BeautySettings.vue';
import VirtualBackgroundSettings from '../../VideoEffect/VirtualBackgroundSettings/VirtualBackgroundSettings.vue';

defineOptions({ name: 'VideoEffectSettings' });

type EffectPanel = 'background' | 'beauty';

const panel = ref<EffectPanel>('background');
const isPreviewing = ref(false);
</script>

<style scoped lang="scss">
.video-effect-tabs-wrap {
  display: flex;
  margin: 0 0 14px;
  border-bottom: 1px solid var(--rk-border);
}

.video-effect-tabs {
  display: flex;
  gap: 22px;
}

.video-effect-tab {
  height: 36px;
  padding: 0 2px 10px;
  margin-bottom: -1px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  transition: color var(--rk-duration) var(--rk-ease), border-color var(--rk-duration) var(--rk-ease);
}

.video-effect-tab:hover {
  color: var(--rk-text-primary);
}

.video-effect-tab.is-active {
  font-weight: 600;
  color: var(--rk-brand);
  border-bottom-color: var(--rk-brand);
}

</style>
