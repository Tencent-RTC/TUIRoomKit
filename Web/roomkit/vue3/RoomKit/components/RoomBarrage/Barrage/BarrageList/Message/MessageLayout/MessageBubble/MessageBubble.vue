<template>
  <div
    class="message-bubble"
    :class="{
      [`bubble-${flow}`]: !!flow,
      'all-round-radius': !isLastInChunk,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { toRefs, computed } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import type { Barrage } from '../../../../types';

interface IMessageBubbleProps {
  message: Barrage;
  isLastInChunk: boolean;
}

const { loginUserInfo } = useLoginState();

const props = withDefaults(defineProps<IMessageBubbleProps>(), {
  message: () => ({}) as Barrage,
  isLastInChunk: false,
});

const { message, isLastInChunk } = toRefs(props);
const flow = computed(() => (
  message.value.sender.userId === loginUserInfo.value?.userId ? 'in' : 'out'
));
</script>

<style lang="scss" scoped>
$message-bubble-border-radius: 8px;

.message-bubble {
  border-radius: $message-bubble-border-radius;
  flex: 1;

  &.all-round-radius {
    border-radius: $message-bubble-border-radius;
  }
}

.bubble-in {
  border-top-left-radius: 0;
}

.bubble-out {
  border-top-right-radius: 0;
}
</style>
