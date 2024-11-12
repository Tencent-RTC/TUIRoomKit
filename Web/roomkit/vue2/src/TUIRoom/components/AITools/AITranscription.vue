<template>
  <div
    class="conversation"
    ref="conversationContainerRef"
    @scroll="handleScroll"
  >
    <div
      v-for="group in transcribedMessageList"
      :key="group.startMsTs"
      class="conversation-group"
    >
      <div class="title">
        <span class="speaker">{{
          roomService.roomStore.getDisplayName(group.sender)
        }}</span>
        <span class="timestamp">
          {{ formatTimestampToTime(group.startMsTs) }}
        </span>
      </div>
      <div
        v-for="(message, messageIndex) in group.messages"
        :key="messageIndex"
        class="content"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, watch, onUnmounted } from 'vue';
import {
  roomService,
  AI_TASK,
  SubtitleMessage,
  MetricsKey,
} from '../../services';
import { formatTimestampToTime } from '../../utils/utils.ts';

const conversationContainerRef = ref<HTMLElement>();
const isUserScrolling = ref(false);
const timeInterval = 60 * 1000;
const rawTranscribedMessageList = ref<SubtitleMessage[]>(
  roomService.aiTask.transcribedMessageList
);

onMounted(() => {
  scrollToBottom();
});

const scrollToBottom = async () => {
  if (conversationContainerRef.value && !isUserScrolling.value) {
    await nextTick();
    conversationContainerRef.value.scrollTop =
      conversationContainerRef.value.scrollHeight;
  }
};

const handleScroll = () => {
  if (conversationContainerRef.value) {
    const isAtBottom =
      conversationContainerRef.value.scrollTop +
        conversationContainerRef.value.clientHeight >=
      conversationContainerRef.value.scrollHeight - 5;
    if (isAtBottom) {
      isUserScrolling.value = false;
      scrollToBottom();
    } else {
      isUserScrolling.value = true;
    }
  }
};

const transcribedMessageList = computed(() => {
  const aggregatedMessageList: {
    sender: string;
    startMsTs: number;
    messages: SubtitleMessage[];
  }[] = [];
  let currentAggregatedMessage: {
    sender: string;
    startMsTs: number;
    messages: SubtitleMessage[];
  } | null = null;

  for (const message of rawTranscribedMessageList.value) {
    if (
      !currentAggregatedMessage ||
      message.sender !== currentAggregatedMessage.sender ||
      message.startMsTs - currentAggregatedMessage.startMsTs > timeInterval
    ) {
      currentAggregatedMessage = {
        messages: [message],
        sender: message.sender,
        startMsTs: message.startMsTs,
      };
      aggregatedMessageList.push(currentAggregatedMessage);
    } else {
      currentAggregatedMessage.messages.push(message);
    }
  }

  return aggregatedMessageList;
});

watch(rawTranscribedMessageList, () => {
  scrollToBottom();
});

const handleAITranscriptionTask = async (data?: {
  subtitleMessages: { [key: string]: SubtitleMessage };
  transcribedMessageList: SubtitleMessage[];
}) => {
  if (!data) return;
  rawTranscribedMessageList.value = [...data.transcribedMessageList];
};
onMounted(() => {
  roomService.dataReportManager.reportCount(MetricsKey.AITask);
  roomService.aiTask.on(AI_TASK.TRANSCRIPTION_TASK, handleAITranscriptionTask);
});
onUnmounted(() => {
  roomService.aiTask.off(AI_TASK.TRANSCRIPTION_TASK, handleAITranscriptionTask);
});
</script>

<style scoped lang="scss">
.conversation {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.conversation-group {
  margin-bottom: 20px;
}

.title {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--font-color-4);
  text-align: left;

  .speaker {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.content {
  padding: 8px;
  margin-top: 5px;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  background-color: var(--background-color-7);
  border-radius: 8px;
}
</style>
