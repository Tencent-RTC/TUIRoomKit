<template>
  <div class="content-container">
    <stream-container :show-room-tool="showRoomTool"></stream-container>
  </div>
</template>

<script setup lang="ts">
import StreamContainer from './StreamContainer.vue';

defineProps<{
  showRoomTool: boolean,
}>();
</script>

<style lang="scss" scoped>
.content-container {
  width: 100%;
  height: 100%;
  display: flex;
  .left-container {
    height: 100%;
    display: flex;
    align-items: center;
    > :not(:first-child) {
      margin-left: 1rem;
    }
  }
}

</style>
