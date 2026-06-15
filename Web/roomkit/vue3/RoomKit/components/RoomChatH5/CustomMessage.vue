<template>
  <div class="custom-message-container">
    <Message
      v-bind="$attrs"
      :nick="userName"
      :message="message"
      :removeAvatar="true"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Message } from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import type { MessageInfo } from 'tuikit-atomicx-vue3/chat';

interface Props {
  message: MessageInfo;
}
const props = defineProps<Props>();

const { participantList } = useRoomParticipantState();
const sender = computed(() => props.message.from);
const senderUserId = computed(() => sender.value?.userID || '');
const userName = computed(() => {
  const participant = participantList.value.find(
    p => p.userId === senderUserId.value,
  );
  return (
    participant?.nameCard
    || participant?.userName
    || participant?.userId
    || sender.value?.nickname
    || sender.value?.userID
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
