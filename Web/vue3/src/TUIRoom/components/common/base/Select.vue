<template>
  <div
    ref="selectContainerRef"
    v-click-outside="handleClickOutside"
    :class="['select-container', themeClass]"
  >
    <div
      :class="['select-content', { 'disabled': disabled }]"
      @click="handleClickSelect"
    >
      <span class="select-text">
        {{ selectedLabel || selectedValue }}
      </span>
      <svg-icon
        :class="['arrow-icon', { 'reverse': showSelectDropdown }]"
        :icon="ArrowStrokeSelectDownIcon"
      ></svg-icon>
    </div>
    <Transition name="select-fade">
      <div
        v-show="showSelectDropdown"
        ref="selectDropDownRef"
        :style="dropDownStyle"
        :class="['select-dropdown-container', dropDirection]"
      >
        <slot></slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, provide, computed, reactive, watch } from 'vue';
import SvgIcon from './SvgIcon.vue';
import ArrowStrokeSelectDownIcon from '../icons/ArrowStrokeSelectDownIcon.vue';
import useZIndex from '../../../hooks/useZIndex';
import vClickOutside from '../../../directives/vClickOutside';

const { nextZIndex } = useZIndex();

interface Props {
  modelValue: string | number | boolean | object,
  disabled?: boolean,
  theme?: 'white' | 'black',
}

const props = defineProps<Props>();

const emits = defineEmits(['update:modelValue', 'change']);

const showSelectDropdown = ref(false);
const optionObj = ref(new Map());
const optionDataList = computed(() => Array.from(optionObj.value.values()));
const selectedLabel = ref('');
const selectedValue = ref(props.modelValue);
const selectContainerRef = ref();
const selectDropDownRef = ref();
const dropDirection = ref('down');
const themeClass = computed(() => (props.theme ? `tui-theme-${props.theme}` : ''));

watch(() => props.modelValue, (val) => {
  selectedValue.value = val;
  if (optionObj.value.get(val)) {
    selectedLabel.value = optionObj.value.get(props.modelValue).label;
  }
});

watch(optionDataList, () => {
  if (optionObj.value.get(props.modelValue)) {
    selectedLabel.value = optionObj.value.get(props.modelValue).label;
  }
});

const dropDownStyle = ref({});

interface OptionData {
  label: string,
  value: string | number | boolean | object,
}

function onOptionCreated(option: OptionData) {
  optionObj.value.set(option.value, option);
}

function onOptionDestroyed(value: string | number | boolean | object) {
  optionObj.value.delete(value);
}

function onOptionSelected(option: OptionData) {
  selectedValue.value = option.value;
  showSelectDropdown.value = false;
  emits('update:modelValue', option.value);
}

watch(selectedValue, (val) => {
  emits('change', val);
});

provide('select', reactive({
  selectedValue,
  optionObj,
  optionDataList,
  onOptionCreated,
  onOptionDestroyed,
  onOptionSelected,
}));

function handleClickSelect() {
  if (props.disabled) {
    return;
  }
  if (showSelectDropdown.value) {
    showSelectDropdown.value = false;
  } else {
    handleDropDownPosition();
    dropDownStyle.value = { zIndex: nextZIndex() };
    showSelectDropdown.value = true;
  }
}

// 根据页面位置确定下拉框的定位
function handleDropDownPosition() {
  const { top, bottom } = selectContainerRef.value?.getBoundingClientRect();
  const bottomSize = document.body.offsetHeight - bottom;
  let dropDownContainerHeight = 0;
  if (!showSelectDropdown.value) {
    selectDropDownRef.value.style = 'display:block;position:absolute;z-index:-1000';
    dropDownContainerHeight = selectDropDownRef.value.offsetHeight;
    selectDropDownRef.value.style = '';
  } else {
    dropDownContainerHeight = selectDropDownRef.value?.offsetHeight;
  }
  if (bottomSize < top && bottomSize < dropDownContainerHeight) {
    dropDirection.value = 'up';
  }
}

function handleClickOutside() {
  if (showSelectDropdown.value) {
    showSelectDropdown.value = false;
  }
}

</script>

<style lang="scss" scoped>

.select-container {
  position: relative;
  .select-content {
    box-sizing: border-box;
    position: relative;
    border: 1px solid var(--border-color);
    background-color: var(--background-color-7);
    color: var(--font-color-3);
    border-radius: 8px;
    height: 42px;
    padding: 10px 16px;
    cursor: pointer;
    display: flex;
    &.disabled {
      background-color: rgba(255, 255, 255, 0.50);
      color: #8F9AB2;
      cursor: not-allowed;
    }
    .select-text {
      width: 0;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
    }
    .arrow-icon {
      margin-left: 10px;
      transition: transform 0.2s;
      transform: rotate(0deg);
      &.reverse {
        transform: rotate(-180deg);
      }
    }
  }

  .select-dropdown-container {
    min-width: 100%;
    max-height: 254px;
    padding: 7px 0px;
    position: absolute;
    background-color: var(--background-color-7);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: auto;
    &.down {
      top: calc(100% + 6px);
      left: 0;
      transform-origin: 50% 0;
    }
    &.up {
      bottom: calc(100% + 6px);
      left: 0;
      transform-origin: 50% 100%;
    }
  }
}

.select-fade-enter-active,
.select-fade-leave-to {
  transform: scaleY(0);
  opacity: 0;
  transition: all 0.2s ease;
}

.select-fade-enter-to,
.select-fade-leave-from {
  transform: scaleY(1);
  opacity: 1;
  transition: all 0.2s ease;
}
</style>
