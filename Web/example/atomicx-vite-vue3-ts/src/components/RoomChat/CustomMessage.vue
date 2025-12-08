<template>
  <div class="custom-message-container">
    <div v-if="showNick" :class="['custom-message-nick', isMe && 'self']">
      {{ userName }}
    </div>
    <Message
      v-bind="$attrs"
      :message="message"
      :is-hidden-message-avatar="true"
      :is-hidden-message-meta="!showMeta"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, useAttrs } from 'vue';
import { Message } from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { MessageType } from 'tuikit-atomicx-vue3/types';
import type { MessageModel } from 'tuikit-atomicx-vue3/types';

interface Props {
  message: MessageModel;
}
const attrs = useAttrs();
const props = defineProps<Props>();

const { participantList } = useRoomParticipantState();
const userName = computed(() => {
  const participant = participantList.value.find(p => p.userId === props.message.from);
  return participant?.nameCard || participant?.userName || participant?.userId || props.message.nick || props.message.from;
});

const isMe = computed(() => props.message.flow === 'out');
const isFirstInChunk = computed(() => attrs['is-first-in-chunk']);
const isLastInChunk = computed(() => attrs['is-last-in-chunk']);
const isSpecialMessage = computed(() => props.message.type === MessageType.TEXT
  || props.message.type === MessageType.IMAGE
  || props.message.type === MessageType.VIDEO
  || props.message.type === MessageType.AUDIO
  || props.message.type === MessageType.FILE);
const isRevoked = computed(() => props.message.isRevoked);

const showNick = computed(() => isSpecialMessage.value && isFirstInChunk.value && !isRevoked.value);
const showMeta = computed(() => isLastInChunk.value && isMe.value);
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
