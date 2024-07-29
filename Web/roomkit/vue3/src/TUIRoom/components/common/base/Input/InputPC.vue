<template>
  <div ref="tuiInputRef" :class="['tui-input', themeClass]">
    <input
      ref="inputRef" :value="modelValue" :placeholder="placeholder" :disabled="disabled" :maxlength="props.maxlength"
      :type="type" :enterkeyhint="enterkeyhint" :readonly="readonly" :style="{ paddingRight: hasSuffixIcon ? '40px' : '16px' }" @focus="focus"
      @blur="blur" @keyup.enter="done" @input="handleInput" @change="handleInput"
    />
    <div v-if="hasSuffixIcon" class="suffix-icon" @mousedown.prevent @click="handleSuffixIconClick">
      <slot name="suffixIcon"></slot>
    </div>
    <div v-if="showResults" class="results tui-theme-white">
      <div
        v-for="(item, index) in searchResult" :key="index" class="results-item" @mousedown.prevent
        @click="handleResultItemClick(item)"
      >
        {{ item.label || item.value }}
        <slot name="searchResultItem" :data="item"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted, onUnmounted } from 'vue';

const slots = useSlots();

interface Props {
  theme?: 'white' | 'black';
  modelValue: string;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  readonly?: boolean;
  enterkeyhint?: string
  search?: (data: string) => any;
  select?: (data: any) => any;
  maxlength?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(defineProps<Props>(), {
  theme: 'white',
  modelValue: '',
  placeholder: '',
  disabled: false,
  type: 'text',
  enterkeyhint: '',
  maxlength: '80',
});

const themeClass = computed(() => (props.theme ? `tui-theme-${props.theme}` : ''));


const emit = defineEmits(['update:modelValue', 'input', 'focus', 'blur', 'done']);

const tuiInputRef = ref<HTMLInputElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const show = ref(false);

const blur = (event: any) => {
  const { value } = event.target;
  show.value = false;
  const trimmedValue = value.trimStart().trimEnd();
  if (value !== trimmedValue) {
    event.target.value = trimmedValue;
  }
  emit('blur', tuiInputRef.value);
};

const done = () => {
  emit('done', tuiInputRef.value);
};

const focus = () => {
  show.value = true;
  emit('focus', tuiInputRef.value);
};
const handleSuffixIconClick = () => {
  inputRef.value?.blur();
};

const closeOnOutsideClick = (event: any) => {
  if (!tuiInputRef.value?.contains(event.target)) {
    show.value = false;
  }
};

function handleResultItemClick(item: any) {
  inputRef.value?.blur();
  if (props.select) {
    props.select(item);
  }
}

onMounted(() => {
  window.addEventListener('click', closeOnOutsideClick);
});

onUnmounted(() => {
  window.removeEventListener('click', closeOnOutsideClick);
});

const searchResult = ref<any>([]);
function handleInput(event: any) {
  const { value } = event.target;
  const trimmedValue = value.trimStart();

  if (value !== trimmedValue) {
    event.target.value = trimmedValue;
  }

  emit('update:modelValue', trimmedValue);
  emit('input', trimmedValue);

  if (props.search) {
    searchResult.value = props.search(event.target.value);
  }
}
const showResults = computed(() => searchResult.value && searchResult.value?.length !== 0 && show.value);

const hasSuffixIcon = computed(() => !!slots.suffixIcon);
</script>

<style lang="scss" scoped>
.tui-input {
  position: relative;
  display: inline-block;
  height: 100%;
  width: 100%;
}

input {
  width: 100%;
  height: 100%;
  padding: 10px 0px 10px 16px;
  font-size: 14px;
  border-radius: 8px;
  box-sizing: border-box;
  border: 1px solid var(--border-color);
  background-color: var(--background-color-7);
  color: var(--font-color-3);
}

input:focus {
  border-color: var(--active-color-1);
  outline: 0;
}

input:disabled {
  background-color: var(--background-color-9);
}

.suffix-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
}

.results {
  position: absolute;
  width: 100%;
  max-height: 254px;
  padding: 7px 0px;
  background-color: var(--background-color-7);
  border: 1px solid var(--border-color);
  z-index: 2;
  border-radius: 4px;
  overflow: auto;

  &-item {
    padding: 6px 15px;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
  }

  &-item:hover {
    background-color: var(--hover-background-color-1);
    color: var(--active-color-2);
  }
}
</style>
