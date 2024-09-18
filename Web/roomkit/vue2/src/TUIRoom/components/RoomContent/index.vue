<template>
  <div class="content-container">
    <stream-container :show-room-tool="showRoomTool" />
  </div>
</template>

<script setup lang="ts">
import StreamContainer from './StreamContainer';

defineProps<{
  showRoomTool: boolean;
}>();
</script>

<style lang="scss" scoped>
.content-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
