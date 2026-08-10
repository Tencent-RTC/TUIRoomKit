<template>
  <div class="text-message">
    <div class="text-message__content">
      <component
        :is="context.slots['user-badge']"
        :message="message"
      />
      <span class="text-message__content__nick">
        {{
          `${message.sender.nameCard || message.sender.userName || message.sender.userId}: `
        }}
      </span>
      <span class="text-message__content__text">{{ message.textContent }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VueElement } from 'vue';
import { useMessageListContext } from '../../MessageListContext';
import type { Barrage } from '../../../types';

const context: {
  slots: Record<string, () => VueElement>;
} = useMessageListContext('TextMessage');

defineProps<{
  message: Barrage;
  isLastInChunk?: boolean;
}>();
</script>

<style lang="scss" scoped>
.text-message {
  font-size: 14px;
  display: flex;
  flex-direction: column;
  word-break: break-all;
  white-space: pre-wrap;
  position: relative;
  line-height: 1.3125;
  font-weight: 500;
  color: var(--text-color-primary);

  &__content {
    display: inline-block;
    word-break: break-word;
    white-space: pre-wrap;
    position: relative;
    min-width: auto;
    font-size: 12px;
    font-weight: 400;
    word-spacing: 0.2em;
    letter-spacing: 0.1em;

    &__nick {
      color: var(--text-color-secondary);
    }

    &__text {
      display: inline;
      word-break: break-all;
      white-space: pre-wrap;
      line-height: 1.8;
    }
  }
}
</style>
