<template>
  <div class="barrage-message-input">
    <div
      :class="['message-input-container', containerClass, disabledAndPlaceholder.disabled && 'disabled']"
      :style="containerStyle"
    >
      <TextEditor
        style="width: 100%; height: 100%"
        :placeholder="disabledAndPlaceholder.placeholder"
        :disabled="disabledAndPlaceholder.disabled"
        :autoFocus="autoFocus"
        :maxLength="props.maxLength"
        :roomId="roomId"
        @focus="emit('focus')"
        @blur="emit('blur')"
      >
        <template #prefix>
          <div class="input-actions">
            <EmojiPicker
              :roomId="roomId"
              :disabled="disabledAndPlaceholder.disabled"
              :trigger-style="{ display: 'flex' }"
            />
          </div>
        </template>
      </TextEditor>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watchEffect } from 'vue';
import { EmojiPicker } from './EmojiPicker';
import { useMessageInputState } from './MessageInputState';
import TextEditor from './TextEditor/TextEditor.vue';
import type { OnWillSendBarrage, OnDidSendBarrage } from '../types';

let instanceIdCounter = 0;

const emit = defineEmits<{
  (e: 'focus'): void;
  (e: 'blur'): void;
}>();

interface Props {
  roomId?: string;
  containerClass?: string;
  containerStyle?: Record<string, any>;
  width?: string;
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onWillSendBarrage?: OnWillSendBarrage;
  onDidSendBarrage?: OnDidSendBarrage;
}

const props = withDefaults(defineProps<Props>(), {
  containerClass: '',
  containerStyle: () => ({}),
  height: '',
  minHeight: '40px',
  maxHeight: '140px',
  disabled: false,
  autoFocus: true,
  maxLength: 80,
});

const { setSendHooks, clearSendHooks } = useMessageInputState(props.roomId);

const instanceId = `barrage-input-${++instanceIdCounter}`;
watchEffect(() => {
  setSendHooks(instanceId, {
    onWillSendBarrage: props.onWillSendBarrage,
    onDidSendBarrage: props.onDidSendBarrage,
  });
});

onUnmounted(() => {
  clearSendHooks(instanceId);
});

const containerStyle = computed(() => {
  const defaultStyle: Record<string, any> = {
    minHeight: props.minHeight,
    maxHeight: props.maxHeight,
  };

  if (props.height) {
    defaultStyle.height = props.height;
  }

  if (props.width) {
    defaultStyle.width = props.width;
  }

  return { ...defaultStyle, ...props.containerStyle };
});

const disabledAndPlaceholder = computed(() => ({
  disabled: props.disabled,
  placeholder: props.placeholder,
}));
</script>

<style lang="scss" scoped>
.barrage-message-input {
  position: relative;
  width: 100%;

  .message-input-container {
    display: flex;
    align-items: stretch;
    background-color: var(--bg-color-operate);
    border: 2px solid var(--stroke-color-primary);
    border-radius: 8px;
    padding: 4px;
    overflow: auto;
    box-sizing: border-box;

    .input-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
  }

  .disabled {
    cursor: not-allowed;
    user-select: none;
  }
}
</style>
