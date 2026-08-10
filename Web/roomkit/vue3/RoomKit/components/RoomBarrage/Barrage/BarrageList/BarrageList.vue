<script lang="ts" setup>
import { ref, onMounted, onUnmounted, nextTick, watch, provide, useSlots } from 'vue';
import type { Component, CSSProperties } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { BarrageEvent } from '../types';
import { useBarrageState } from '../useBarrageState';
import { useScroll } from '../useScroll';
import { useBarrageListState } from './BarrageListState';
import { Message as DefaultMessage } from './Message';
import { MessageListContextSymbol } from './MessageListContext';
import type { Barrage } from '../types';

const { t } = useUIKit();

interface IMessageListProps {
  roomId?: string;
  Message?: Component | undefined;
  containerStyle?: CSSProperties | undefined;
  itemStyle?: CSSProperties | undefined;
  height?: string;
  style?: CSSProperties;
}

const props = withDefaults(defineProps<IMessageListProps>(), {
  Message: undefined,
});

const scrollContainer = ref<HTMLElement | null>(null);
const slots = useSlots();
const { loginUserInfo } = useLoginState();

const autoScrollThreshold = 150;
const isFinishFirstRender = ref(false);
const isDisableAutoScroll = ref(false);
const distanceToBottom = ref(0);
const pendingScroll = ref<ScrollBehavior | false>(false);

// roomId is a snapshot; RoomBarrage remounts this component with :key="roomId".
const { messageList, messageGroupTip } = useBarrageListState(props.roomId);
const {
  subscribeEvent: subscribeBarrageEvent,
  unsubscribeEvent: unsubscribeBarrageEvent,
} = useBarrageState(props.roomId);
const { scrollToBottom } = useScroll();

const scrollListToBottom = (behavior: ScrollBehavior = 'auto') => scrollToBottom(scrollContainer.value, behavior);

defineExpose({
  scrollToBottom: scrollListToBottom,
});

provide(MessageListContextSymbol, { slots });

function throttle<T extends(...args: any[]) => void>(fn: T, wait: number): T {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

const handleScroll = throttle(() => {
  if (!scrollContainer.value) {
    return;
  }
  distanceToBottom.value
    = scrollContainer.value.scrollHeight - scrollContainer.value.scrollTop - scrollContainer.value.clientHeight;
  isDisableAutoScroll.value = distanceToBottom.value > autoScrollThreshold;
}, 100);

const initializeMessageList = () => {
  isFinishFirstRender.value = false;
  isDisableAutoScroll.value = false;
  distanceToBottom.value = 0;
  pendingScroll.value = false;
};

watch(() => props.roomId, () => {
  initializeMessageList();
});

const handleBarrageReceived = (message: Barrage) => {
  if (!isFinishFirstRender.value) {
    pendingScroll.value = 'auto';
    return;
  }
  const shouldAutoScroll
    = message.sender.userId === loginUserInfo.value?.userId
      || (!isDisableAutoScroll.value && distanceToBottom.value < autoScrollThreshold);
  if (shouldAutoScroll) {
    pendingScroll.value = 'smooth';
  }
};

watch(() => messageList.value.length, (newLen) => {
  if (newLen === 0 || pendingScroll.value === false) {
    return;
  }
  const behavior = pendingScroll.value;
  pendingScroll.value = false;
  requestAnimationFrame(() => {
    scrollListToBottom(behavior);
    if (!isFinishFirstRender.value) {
      isFinishFirstRender.value = true;
    }
  });
}, { flush: 'post' });

onMounted(() => {
  scrollContainer.value?.addEventListener('scroll', handleScroll);
  initializeMessageList();
  if (messageList.value.length > 0) {
    nextTick(() => {
      scrollListToBottom('auto');
      isFinishFirstRender.value = true;
    });
  }
  subscribeBarrageEvent(BarrageEvent.onBarrageReceived, handleBarrageReceived);
});

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', handleScroll);
  unsubscribeBarrageEvent(BarrageEvent.onBarrageReceived, handleBarrageReceived);
});
</script>

<template>
  <div class="message-list" :style="{ height: props.height, ...props.style }">
    <div
      id="messageScrollList"
      ref="scrollContainer"
      class="message-list-container"
      :style="props.containerStyle"
    >
      <div class="message-chunk">
        <template v-for="message in messageList" :key="`${message.sequence}-${message.timestampInSecond}-${message.sender?.userId}`">
          <slot
            v-if="$slots['message-item']"
            name="message-item"
            :message="message"
            :sender="message.sender"
          />
          <component
            :is="props.Message || DefaultMessage"
            v-else
            :style="props.itemStyle"
            :message="message"
            :is-last-in-chunk="true"
          />
        </template>
      </div>
      <div v-if="!messageList?.length" class="empty-message">
        {{ t('BarrageList.NoMessageYet') }}
      </div>
    </div>
    <div v-if="messageGroupTip" class="message-group-tip">
      <div class="message-group-tip-name">
        {{ messageGroupTip?.nameCard || messageGroupTip?.userName || messageGroupTip?.userId }}
      </div>
      <div class="message-group-tip-action">
        {{ messageGroupTip?.displayAction === 'enter' ? t('BarrageList.ComeIn') : t('BarrageList.Leave') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.message-list {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-color-operate);
}

.message-list-container {
  flex: 1;
  height: 100%;
  padding: 10px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--uikit-color-gray-3);
    border-radius: 3px;
    border: 2px solid transparent;
    background-clip: padding-box;

    &:hover {
      background: var(--uikit-color-gray-3);
    }
  }
}

.message-chunk {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 0;
}

.empty-message {
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.message-group-tip {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 10px;
  font-size: 12px;
  font-weight: 400;
  word-spacing: 0.2em;
  letter-spacing: 0.1em;

  .message-group-tip-name {
    max-width: 192px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--uikit-color-theme-8);
  }

  .message-group-tip-action {
    white-space: nowrap;
  }
}
</style>
