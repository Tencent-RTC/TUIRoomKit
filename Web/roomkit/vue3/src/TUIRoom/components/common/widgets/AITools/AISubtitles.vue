<template>
  <div v-if="subtitleLines.length" class="ai-subtitles">
    <div v-for="line in subtitleLines" :key="line.sender">
      {{
        `${roomService.roomStore.getDisplayName(line.sender)}: ${line?.text}`
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  AI_TASK,
  AITaskEvent,
  MetricsKey,
  roomService,
  SubtitleMessage,
} from '../../../../services/index.ts';

const subtitleMessages = ref<Record<string, SubtitleMessage>>({});
const subtitleLines = computed(() => {
  const arr = Object.keys(subtitleMessages.value).map(userId => {
    return subtitleMessages.value[userId];
  });
  return arr.sort((a, b) => a.startMsTs - b.startMsTs);
});

const handleAISubtitles = (data?: AITaskEvent[AI_TASK.TRANSCRIPTION_TASK]) => {
  if (!data) return;
  subtitleMessages.value = Object.assign({}, data.subtitleMessages);
};

onMounted(() => {
  roomService.dataReportManager.reportCount(MetricsKey.aiTask);
  roomService.aiTask.on(AI_TASK.TRANSCRIPTION_TASK, handleAISubtitles);
});

onUnmounted(() => {
  roomService.aiTask.off(AI_TASK.TRANSCRIPTION_TASK, handleAISubtitles);
});
</script>

<style scoped lang="scss">
.ai-subtitles {
  position: absolute;
  bottom: 80px;
  left: 50%;
  padding: 10px 12px;
  color: #fff;
  background-color: rgba(79, 88, 107, 0.7);
  border-radius: 8px;
  transform: translateX(-50%);
}
</style>
