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
      <span class="select-text">
        {{ selectedLabel || selectedValue }}
      </span>
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
import { ref, provide, computed, reactive, watch, Ref } from 'vue';
import SvgIcon from './SvgIcon.vue';
import ArrowStrokeSelectDownIcon from '../icons/ArrowStrokeSelectDownIcon.vue';
import useZIndex from '../../../hooks/useZIndex';
import '../../../directives/vClickOutside';

const { nextZIndex } = useZIndex();

interface Props {
  value: string | number | boolean | object;
  disabled?: boolean;
  theme?: 'white' | 'black';
}

interface OptionData {
  label: string;
  value: string | number | boolean | object;
  ref: HTMLElement;
}

const props = defineProps<Props>();

const emits = defineEmits(['input', 'change']);

const showSelectDropdown = ref(false);
const optionArray: Ref<OptionData[]> = ref([]);
const selectedLabel = ref('');
const selectedValue = ref(props.value);
const selectContainerRef = ref();
const selectDropDownRef = ref();
const dropDirection = ref('down');
const themeClass = computed(() =>
  props.theme ? `tui-theme-${props.theme}` : ''
);

watch(
  () => props.value,
  val => {
    selectedValue.value = val;
    const option = optionArray.value.find(item => item.value === val);
    if (option) {
      selectedLabel.value = option.label;
    }
  }
);

watch(
  () => optionArray,
  () => {
    const option = optionArray.value.find(item => item.value === props.value);
    if (option) {
      selectedLabel.value = option.label;
    }
  },
  { deep: true }
);

const dropDownStyle = ref({});

function onOptionCreated(option: OptionData) {
  optionArray.value.push(option);
}

function onOptionDestroyed(value: string | number | boolean | object) {
  const index = optionArray.value.findIndex(item => item.value === value);
  optionArray.value.splice(index, 1);
}

function onOptionSelected(option: OptionData) {
  selectedValue.value = option.value;
  showSelectDropdown.value = false;
  emits('input', option.value);
}

watch(selectedValue, val => {
  emits('change', val);
});

provide(
  'select',
  reactive({
    selectedValue,
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
    const option = optionArray.value.find(item => item.value === props.value);
    option?.ref.scrollIntoView({ block: 'center' });
  }
}

// Determine the positioning of the drop-down box based on the page position
function handleDropDownPosition() {
  const { top, bottom } = selectContainerRef.value?.getBoundingClientRect();
  const bottomSize = document.body.offsetHeight - bottom;
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
