<template>
  <div :class="[styles['input-wrapper'], props.disabled && styles.disabled]">
    <div :class="styles['input-prefix']">
      <slot name="prefix" />
    </div>
    <textarea
      ref="textareaRef"
      :class="styles['editor']"
      :value="props.disabled ? '' : inputRawValue"
      :placeholder="placeholderText"
      :disabled="props.disabled"
      :maxlength="props.maxLength"
      :autofocus="props.autoFocus"
      rows="1"
      @input="handleInput"
      @keydown="handleKeydown"
      @keyup="handleSelectionChange"
      @click="handleSelectionChange"
      @select="handleSelectionChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <span :class="styles['input-suffix']">
      <slot name="suffix" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { ERROR_MESSAGE } from '../constants';
import { useMessageInputState } from '../MessageInputState';
import styles from './TextEditor.module.scss';

interface ITextEditorProps {
  autoFocus?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  roomId?: string;
}

const props = withDefaults(defineProps<ITextEditorProps>(), {
  autoFocus: true,
  disabled: false,
  placeholder: '',
});

const emit = defineEmits<{
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

const { t } = useUIKit();
const {
  inputRawValue,
  updateRawValue,
  sendMessage,
  setTextareaElement,
  saveSelection,
  setContent,
} = useMessageInputState(props.roomId);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const placeholderText = computed(() => props.placeholder || t('BarrageInput.saySomething'));

const syncTextareaRef = () => {
  setTextareaElement(props.disabled ? null : textareaRef.value);
};

const handleSelectionChange = () => {
  const el = textareaRef.value;
  if (!el) {
    return;
  }
  saveSelection(el.selectionStart ?? 0, el.selectionEnd ?? 0);
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  updateRawValue(target.value);
  saveSelection(target.selectionStart ?? target.value.length, target.selectionEnd ?? target.value.length);
  autoResize();
};

const autoResize = () => {
  const el = textareaRef.value;
  if (!el) {
    return;
  }
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
};

const handleKeydown = async (event: KeyboardEvent) => {
  if (event.key !== 'Enter') {
    return;
  }
  if (event.shiftKey || event.ctrlKey || event.metaKey) {
    return;
  }
  event.preventDefault();
  const inputValue = inputRawValue.value;
  setContent('');
  try {
    await sendMessage(inputValue);
  } catch (err: any) {
    // Restore draft when send fails so the user does not lose typed content.
    setContent(inputValue);
    TUIToast.error({
      message: t(ERROR_MESSAGE[err.code as keyof typeof ERROR_MESSAGE] || 'BarrageInput.sendFailed'),
    });
  }
};

const handleFocus = () => {
  handleSelectionChange();
  emit('focus');
};

const handleBlur = () => {
  handleSelectionChange();
  emit('blur');
};

watch(
  () => props.disabled,
  async () => {
    await nextTick();
    syncTextareaRef();
  },
);

watch(inputRawValue, () => {
  nextTick(autoResize);
});

onMounted(async () => {
  await nextTick();
  syncTextareaRef();
  if (props.autoFocus && !props.disabled) {
    textareaRef.value?.focus();
  }
  autoResize();
});

onUnmounted(() => {
  setTextareaElement(null);
});
</script>
