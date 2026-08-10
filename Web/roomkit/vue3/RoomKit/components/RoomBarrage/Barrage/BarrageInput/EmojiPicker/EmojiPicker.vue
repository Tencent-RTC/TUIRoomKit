<template>
  <div
    ref="rootRef"
    :class="['emoji-picker', { disabled: props.disabled }]"
  >
    <span
      :style="triggerStyle"
      class="emoji-picker__button"
      @mousedown.prevent
      @click="togglePanel"
    >
      <IconEmoji class="emoji-picker__icon" :size="20" />
    </span>
    <div
      v-if="isOpen"
      class="emoji-picker__list"
      @mousedown.prevent
    >
      <button
        v-for="emoji in UNICODE_EMOJIS"
        :key="emoji"
        type="button"
        tabindex="-1"
        class="emoji-picker__list-item"
        :title="emoji"
        @click="insertEmojiToInput(emoji)"
      >
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { IconEmoji } from '@tencentcloud/uikit-base-component-vue3';
import { UNICODE_EMOJIS } from '../../constants';
import { useMessageInputState } from '../MessageInputState';

const props = defineProps<{
  triggerStyle?: Record<string, any>;
  disabled?: boolean;
  roomId?: string;
}>();

const { insertContent, focusEditor } = useMessageInputState(props.roomId);

const rootRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

function closePanel() {
  isOpen.value = false;
}

function togglePanel() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    // Keep caret visible while the picker is open.
    focusEditor();
  }
}

function handleDocumentMouseDown(event: MouseEvent) {
  if (!rootRef.value?.contains(event.target as Node)) {
    closePanel();
  }
}

function handleDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closePanel();
  }
}

function unbindDismissListeners() {
  document.removeEventListener('mousedown', handleDocumentMouseDown);
  document.removeEventListener('keydown', handleDocumentKeyDown);
}

watch(isOpen, (open) => {
  if (open) {
    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('keydown', handleDocumentKeyDown);
  } else {
    unbindDismissListeners();
  }
});

watch(() => props.disabled, (disabled) => {
  if (disabled) {
    closePanel();
  }
});

onBeforeUnmount(unbindDismissListeners);

function insertEmojiToInput(emoji: string) {
  if (!emoji) {
    return;
  }
  insertContent(emoji, true);
}
</script>

<style lang="scss" scoped>
.emoji-picker {
  display: flex;
  align-items: center;

  &.disabled {
    cursor: not-allowed;
    user-select: none;
    pointer-events: none;
    opacity: 0.5;
  }
}

.emoji-picker__button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.5s ease;

  &:hover {
    background-color: var(--button-color-secondary-hover);
  }

  &:active {
    background-color: var(--button-color-secondary-active);
  }
}

.emoji-picker__icon {
  color: var(--icon-color-primary);
}

// Anchored to .barrage-message-input, so the panel spans exactly the input width.
.emoji-picker__list {
  position: absolute;
  right: 0;
  bottom: calc(100% + 8px);
  left: 0;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20px, 1fr));
  justify-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  background-color: var(--dropdown-color-default);
  box-shadow: 0 0 10px 0 var(--shadow-color);
  box-sizing: border-box;
  user-select: none;
}

.emoji-picker__list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif;
}
</style>
