<template>
  <TUIPopup
    v-model:visible="isSheetVisible"
    placement="bottom"
    @close="emit('close')"
  >
    <div class="cap-settings-h5">
      <PopUpArrowDown @click="close" />
      <div class="cap-settings-h5__header">
        {{ t('AITools.SettingsTitle') }}
      </div>

      <div class="cap-settings-h5__body">
        <template v-if="canManageASR">
          <div class="cap-settings-h5__title">
            {{ t('AITools.GroupTranscription') }}
          </div>
          <div class="cap-settings-h5__card">
            <div
              class="cap-settings-h5__row is-navigable"
              @click="openPicker('source')"
            >
              <span class="cap-settings-h5__label">{{ t('AITools.SourceLanguage') }}</span>
              <span class="cap-settings-h5__value">
                {{ sourceLanguageLabel }}
                <IconRightArrow :size="14" />
              </span>
            </div>
          </div>
        </template>

        <div class="cap-settings-h5__title">
          {{ t('AITools.GroupTranslation') }}
        </div>
        <div class="cap-settings-h5__card">
          <div class="cap-settings-h5__row">
            <span class="cap-settings-h5__label">{{ t('AITools.SubtitleModeSwitchLabel') }}</span>
            <!-- Without a translation language there is no second line to toggle. -->
            <span v-if="isTransNone" class="cap-settings-h5__hint">{{ transNoneHint }}</span>
            <TUISwitch v-else v-model="showTrans" />
          </div>
          <div
            v-if="canManageASR"
            class="cap-settings-h5__row is-navigable"
            @click="openPicker('target')"
          >
            <span class="cap-settings-h5__label">{{ t('AITools.TargetLanguage') }}</span>
            <span class="cap-settings-h5__value">
              {{ targetLanguageLabel }}
              <IconRightArrow :size="14" />
            </span>
          </div>
        </div>

        <template v-if="showCaptionGroup">
          <div class="cap-settings-h5__title">
            {{ t('AITools.GroupSubtitle') }}
          </div>
          <div class="cap-settings-h5__card">
            <div class="cap-settings-h5__row">
              <span class="cap-settings-h5__label">{{ t('AITools.FontSize') }}</span>
              <div class="cap-settings-h5__sizes">
                <button
                  v-for="option in fontSizeOptions"
                  :key="option.value"
                  class="cap-settings-h5__size"
                  type="button"
                  :class="{ 'is-active': fontSize === option.value }"
                  @click="fontSize = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </TUIPopup>

  <LanguagePickerSheetH5
    v-if="pickerType"
    :title="pickerTitle"
    :model-value="pickerValue"
    :options="pickerOptions"
    @select="applyPickedLanguage"
    @close="pickerType = undefined"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import {
  IconRightArrow,
  TUIPopup,
  TUISwitch,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import PopUpArrowDown from '../../base/PopUpArrowDown.vue';
import LanguagePickerSheetH5 from './LanguagePickerSheetH5.vue';
import { useSubtitleSettings } from './useSubtitleSettings';

withDefaults(defineProps<{
  /** Caption dock includes font size; the record panel omits that group. */
  showCaptionGroup?: boolean;
}>(), {
  showCaptionGroup: true,
});

const emit = defineEmits<{
  close: [];
}>();

const { t } = useUIKit();
const {
  isTransNone,
  canManageASR,
  showTrans,
  fontSize,
  pickerType,
  sourceLanguageLabel,
  targetLanguageLabel,
  fontSizeOptions,
  transNoneHint,
  pickerValue,
  pickerOptions,
  applyPickedLanguage,
  openPicker,
} = useSubtitleSettings();

const isSheetVisible = ref(true);

const pickerTitle = computed(() => (
  pickerType.value === 'source'
    ? t('AITools.SelectSourceLanguage')
    : t('AITools.SelectTargetLanguage')
));

function close() {
  isSheetVisible.value = false;
  emit('close');
}
</script>

<style lang="scss" scoped>
.cap-settings-h5 {
  display: flex;
  flex-direction: column;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
}

.cap-settings-h5__header {
  padding: 4px 20px 12px;
  color: var(--text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.cap-settings-h5__body {
  padding: 0 20px calc(20px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.cap-settings-h5__title {
  padding: 12px 0 8px;
  color: var(--text-color-secondary);
  font-size: 13px;
}

.cap-settings-h5__card {
  padding: 0 12px;
  background: var(--bg-color-entrycard);
  border-radius: 12px;
}

.cap-settings-h5__row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 52px;
  padding: 0;
  color: var(--text-color-primary);
  text-align: left;
  background: transparent;
  border: none;

  &:not(:last-child) {
    border-bottom: 1px solid var(--stroke-color-primary);
  }

  &.is-navigable {
    cursor: pointer;
  }
}

.cap-settings-h5__label {
  flex: none;
  font-size: 15px;
  font-weight: 500;
  white-space: nowrap;
}

.cap-settings-h5__value {
  display: flex;
  gap: 4px;
  align-items: center;
  min-width: 0;
  color: var(--text-color-secondary);
  font-size: 15px;
}

.cap-settings-h5__hint {
  color: var(--text-color-secondary);
  font-size: 13px;
}

.cap-settings-h5__sizes {
  display: flex;
  gap: 8px;
}

.cap-settings-h5__size {
  height: 32px;
  padding: 0 14px;
  color: var(--text-color-secondary);
  font-size: 14px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;

  &.is-active {
    color: var(--text-color-button);
    background: var(--button-color-primary-default);
    border-color: var(--button-color-primary-default);
  }
}
</style>
