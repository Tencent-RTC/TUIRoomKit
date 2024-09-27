<template>
  <div v-if="subtitleLines.length" class="ai-subtitles">
    <div v-for="(line, index) in subtitleLines" :key="index">{{ line }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { roomService, AI_TASK, AITaskEvent } from '../../services';

const rawSubtitleText = ref('');
const subtitleLines = computed(() =>
  rawSubtitleText.value.split('\n').filter(item => item)
);

let subtitleTimeout: ReturnType<typeof setTimeout> | null = null;

const resetSubtitleTimeout = () => {
  if (subtitleTimeout) {
    clearTimeout(subtitleTimeout);
  }

  subtitleTimeout = setTimeout(() => {
    rawSubtitleText.value = '';
  }, 3000);
};

const handleAISubtitles = (data?: AITaskEvent[AI_TASK.TRANSCRIPTION_TASK]) => {
  if (!data) return;
  rawSubtitleText.value = data.subtitleText.value;
  resetSubtitleTimeout();
};

roomService.aiTask.on(AI_TASK.TRANSCRIPTION_TASK, handleAISubtitles);

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
