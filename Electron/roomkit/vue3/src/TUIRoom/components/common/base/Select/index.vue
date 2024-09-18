<template>
  <div
    ref="selectContainerRef"
    v-click-outside="handleClickOutside"
    :class="['select-container', themeClass]"
  >
    <div
      :class="['select-content', { disabled: disabled }]"
      @click="handleClickSelect"
    >
      <template v-if="$slots.customSelectContent">
        <slot name="customSelectContent"></slot>
      </template>
      <template v-else>
        <span class="select-text" :style="props.customSelectContentStyle">
          {{ selectedLabel || selectedValue }}
        </span>
      </template>
      <svg-icon
        :class="['arrow-icon', { reverse: showSelectDropdown }]"
        :icon="ArrowStrokeSelectDownIcon"
      />
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
import {
  ref,
  provide,
  computed,
  reactive,
  watch,
  StyleValue,
  defineProps,
  defineEmits,
} from 'vue';
import SvgIcon from '../SvgIcon.vue';
import ArrowStrokeSelectDownIcon from '../../icons/ArrowStrokeSelectDownIcon.vue';
import useZIndex from '../../../../hooks/useZIndex';
import vClickOutside from '../../../../directives/vClickOutside';
import { roomService } from '../../../../services';

const { nextZIndex } = useZIndex();

interface Props {
  modelValue: string | number | boolean | object;
  disabled?: boolean;
  theme?: 'white' | 'black';
  customSelectContentStyle?: StyleValue;
}

const props = defineProps<Props>();

const emits = defineEmits(['update:modelValue', 'change']);

const showSelectDropdown = ref(false);
const optionObj = ref(new Map());
const optionDataList = computed(() => Array.from(optionObj.value.values()));
const selectedLabel = ref('');
const selectContainerRef = ref();
const selectDropDownRef = ref();
const dropDirection = ref('down');
const themeClass = computed(() =>
  props.theme ? `tui-theme-${props.theme}` : ''
);

watch(
  () => props.modelValue,
  val => {
    if (optionObj.value.get(val)) {
      selectedLabel.value = optionObj.value.get(props.modelValue).label;
    }
  },
  { immediate: true }
);

watch(optionDataList, () => {
  if (optionObj.value.get(props.modelValue)) {
    selectedLabel.value = optionObj.value.get(props.modelValue).label;
  }
});

const dropDownStyle = ref({});

interface OptionData {
  label: string;
  value: string | number | boolean | object;
}

function onOptionCreated(option: OptionData) {
  optionObj.value.set(option.value, option);
}

function onOptionDestroyed(value: string | number | boolean | object) {
  optionObj.value.delete(value);
}

function onOptionSelected(option: OptionData) {
  showSelectDropdown.value = false;
  emits('update:modelValue', option.value);
  emits('change', option.value);
}

const selectedValue = computed(() => props.modelValue);

provide(
  'select',
  reactive({
    selectedValue,
    optionObj,
    optionDataList,
    onOptionCreated,
    onOptionDestroyed,
    onOptionSelected,
  })
);

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
    optionObj.value
      .get(props.modelValue)
      .ref.scrollIntoView({ block: 'center' });
  }
}

// Determine the positioning of the drop-down box based on the page position
function handleDropDownPosition() {
  const { top, bottom } =
    selectContainerRef.value.getBoundingClientRect() || {};
  const container = roomService.getRoomContainer();
  const bottomSize =
    container instanceof HTMLElement ? container.offsetHeight - bottom : -1;
  let dropDownContainerHeight = 0;
  if (!showSelectDropdown.value) {
    selectDropDownRef.value.style =
      'display:block;position:absolute;z-index:-1000';
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
  height: 100%;

  .select-content {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    height: 42px;
    padding: 0 16px;
    color: var(--font-color-3);
    cursor: pointer;
    background-color: var(--background-color-7);
    border: 1px solid var(--border-color);
    border-radius: 8px;

    &.disabled {
      color: #8f9ab2;
      cursor: not-allowed;
      background-color: rgba(255, 255, 255, 0.5);
    }

    .select-text {
      flex: 1;
      width: 0;
      overflow: hidden;
      font-size: 14px;
      font-style: normal;
      font-weight: 500;
      line-height: 22px;
      white-space: nowrap;
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
    position: absolute;
    min-width: 100%;
    max-height: 254px;
    padding: 7px 0;
    overflow: auto;
    background-color: var(--background-color-7);
    border: 1px solid var(--border-color);
    border-radius: 8px;

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
  opacity: 0;
  transition: all 0.2s ease;
  transform: scaleY(0);
}

.select-fade-enter-to,
.select-fade-leave-from {
  opacity: 1;
  transition: all 0.2s ease;
  transform: scaleY(1);
}
</style>
