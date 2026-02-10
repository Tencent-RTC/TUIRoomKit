<template>
  <div class="custom-message-container">
    <Message
      v-bind="$attrs"
      :nick="userName"
      :message="message"
      :is-hidden-message-avatar="true"
      :is-hidden-message-meta="props.message.flow !== 'out'"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { Message } from 'tuikit-atomicx-vue3/chat';
import type { MessageModel } from 'tuikit-atomicx-vue3/chat';

interface Props {
  message: MessageModel;
}
const props = defineProps<Props>();

const { participantList } = useRoomParticipantState();
const userName = computed(() => {
  const participant = participantList.value.find(
    p => p.userId === props.message.from
  );
  return (
    participant?.nameCard ||
    participant?.userName ||
    participant?.userId ||
    props.message.nick ||
    props.message.from
  );
});
</script>

<style lang="scss" scoped>
.custom-message-container {
  width: 100%;

  .custom-message-nick {
    color: var(--text-color-secondary);
    font-weight: 400;
    font-size: 14px;
    line-height: 22px;
    margin-bottom: 4px;
  }

  .self {
    text-align: right;
  }
}
</style>

<style lang="scss">
.message-layout__wrapper--left {
  padding-left: 0 !important;
}
</style>
