<template>
  <div class="timing">{{ formattedTime }}</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const meetingTime = ref(0);
let intervalId: any = null;

const formattedTime = computed(() => {
  const minutes = Math.floor(meetingTime.value / 60);
  const seconds = meetingTime.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

function startTimer() {
  intervalId = setInterval(() => {
    meetingTime.value += 1;
  }, 1000);
}

onMounted(() => {
  startTimer();
});

onUnmounted(() => {
  intervalId && clearInterval(intervalId);
});
</script>

<style lang="scss" scoped>
.timing {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: center;
}
</style>
