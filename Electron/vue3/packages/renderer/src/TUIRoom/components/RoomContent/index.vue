<template>
  <div class="content-container">
    <stream-container :show-room-tool="showRoomTool"></stream-container>
  </div>
</template>

<script setup lang="ts">
import StreamContainer from './StreamContainer/index.vue';

defineProps<{
  showRoomTool: boolean,
}>();
</script>

<style lang="scss" scoped>
.content-container {
  width: 100%;
  height: 100%;
}

</style>
