<script lang="ts" setup>
import { toRefs, computed } from 'vue';
import type { Component } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { BarrageType } from '../../../types';
import { TextMessage } from '../TextMessage';
import { MessageBubble } from './MessageBubble';
import type { Barrage } from '../../../types';

interface IMessageLayoutProps {
  message: Barrage;
  isLastInChunk?: boolean;
  className?: string;
  style?: Record<string, any>;
}

const props = withDefaults(defineProps<IMessageLayoutProps>(), {
  message: () => ({}) as Barrage,
  isLastInChunk: true,
  className: '',
  style: () => ({}),
});

const { loginUserInfo } = useLoginState();
const {
  message,
  isLastInChunk,
  className,
  style,
} = toRefs(props);

const MessageComponentsFactory: Partial<Record<BarrageType, Component>> = {
  [BarrageType.text]: TextMessage,
};

const MessageComponent = computed(() => MessageComponentsFactory[message.value.messageType]);
const isMessageOwner = computed(() => message.value.sender.userId === loginUserInfo.value?.userId);
</script>

<template>
  <div
    v-if="MessageComponent"
    :data-message-id="message.sequence"
    :class="[
      'message-layout',
      { 'message-layout--self': isMessageOwner },
      { 'message-layout--not-last': !isLastInChunk && !isMessageOwner },
      { 'message-layout--not-last--self': !isLastInChunk && isMessageOwner },
      className,
    ]"
    :style="style"
  >
    <div
      :class="[
        'message-layout__wrapper',
        { 'message-layout__wrapper--self': isMessageOwner },
      ]"
    >
      <div
        :class="[
          'message-layout__wrapper__middle',
          { 'message-layout__wrapper__middle--self': isMessageOwner },
        ]"
      >
        <MessageBubble
          :class="{
            'message-layout__bubble--last': isLastInChunk && !isMessageOwner,
            'message-layout__bubble--last--self': isLastInChunk && isMessageOwner,
          }"
          :message="message"
          :is-last-in-chunk="isLastInChunk"
        >
          <component
            :is="MessageComponent"
            :message="message"
            :is-last-in-chunk="isLastInChunk"
          />
        </MessageBubble>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$message-bubble-border-radius: 8px;

.message-layout {
  display: flex;
  flex-direction: row;
  width: 100%;
  position: relative;

  &--not-last {
    padding-left: 40px;
  }

  &__wrapper {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex: 1 1 auto;

    &__middle {
      flex-direction: row;
      display: flex;
      gap: 4px;
      position: relative;
      align-items: flex-start;
    }
  }

  &__bubble {
    display: flex;
    flex: 1 1 auto;

    &--last {
      border-bottom-left-radius: $message-bubble-border-radius;
    }

    &--last--self {
      border-bottom-right-radius: $message-bubble-border-radius;
    }
  }
}
</style>
