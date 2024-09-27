<template>
  <div class="conversation" ref="conversationContainer">
    <div
      v-for="(item, index) in conversations"
      :key="index"
      class="conversation-item"
    >
      <div class="title">
        <span class="speaker">{{ item.speaker }}</span>
        <span class="timestamp">{{ item.timestamp }}</span>
      </div>
      <div class="content">
        <div v-for="(msg, msgIndex) in item.messages" :key="msgIndex">
          {{ msg }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { roomService, AI_TASK } from '../../services';

const conversationContainer = ref<HTMLElement | null>(null);

onMounted(() => scrollToBottom());

const processedConversations = ref<
  {
    timestamp: string;
    speaker: string;
    content: string;
  }[]
>(processConversation(roomService.aiTask.transcriptionText.value));

const scrollToBottom = async () => {
  if (conversationContainer.value) {
    await nextTick();
    conversationContainer.value.scrollIntoView({ block: 'end' });
  }
};

const conversations = computed(() => {
  const result = [];
  let currentSpeaker: string | null = null;
  let currentTimestamp: string | null = null;
  let currentMessages: string[] = [];

  processedConversations.value.forEach(item => {
    const [start, end] = item.timestamp.split('->');
    const timestampMinute = start.slice(0, 5); // Take the "HH:MM" part

    if (
      item.speaker === currentSpeaker &&
      timestampMinute === currentTimestamp
    ) {
      // Aggregate messages from the same speaker and within the same minute
      currentMessages.push(item.content);
    } else {
      // New speakers or different minutes, save previous aggregation results
      if (currentSpeaker !== null) {
        result.push({
          timestamp: currentTimestamp,
          speaker: currentSpeaker,
          messages: currentMessages,
        });
      }
      // Update active speaker, timestamp, and message
      currentSpeaker = item.speaker;
      currentTimestamp = timestampMinute;
      currentMessages = [item.content];
    }
  });

  // Save the last set of aggregation results
  if (currentSpeaker !== null) {
    result.push({
      timestamp: currentTimestamp,
      speaker: currentSpeaker,
      messages: currentMessages,
    });
  }

  return result;
});

roomService.aiTask.on(AI_TASK.TRANSCRIPTION_TASK, data => {
  if (!data) return;
  processedConversations.value = processConversation(
    data.transcriptionText.value
  );
});

function processConversation(data: string) {
  const pattern =
    /(\d{2}:\d{2}:\d{2}->\d{2}:\d{2}:\d{2})\s+([\u4e00-\u9fa5\w]+):\s*(.*)/;

  const conversations: {
    timestamp: string;
    speaker: string;
    content: string;
  }[] = [];

  const lines = data.split('\n');

  lines.forEach(line => {
    const match = pattern.exec(line);
    if (match) {
      const timestamp = match[1];
      const speaker = match[2];
      const content = match[3];
      conversations.push({
        timestamp,
        speaker,
        content,
      });
    }
  });

  conversations.sort((a, b) => {
    const timeA = a.timestamp.split('->')[0];
    const timeB = b.timestamp.split('->')[0];
    return timeA.localeCompare(timeB);
  });

  return conversations;
}
</script>

<style scoped lang="scss">
.conversation {
  padding: 20px;
  overflow-y: auto;
}

.conversation-item {
  margin-bottom: 10px;
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
}

.content {
  padding: 8px;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  text-align: left;
  background-color: var(--background-color-7);
  border-radius: 8px;
}
</style>
