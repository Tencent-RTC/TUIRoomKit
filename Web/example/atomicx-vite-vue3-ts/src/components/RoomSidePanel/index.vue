<template>
  <div class="room-side-panel">
    <div class="header">
      <span class="title">{{ title }}</span>
      <IconClose
        size="16"
        class="close"
        @click="closeSidePanel"
      />
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconClose } from '@tencentcloud/uikit-base-component-vue3';

defineProps<{
  title: string;
}>();

const emit = defineEmits(['close']);

const closeSidePanel = () => {
  emit('close');
};
</script>

<style lang="scss" scoped>
.room-side-panel {
  background-color: var(--bg-color-operate);
  border-left: 1px solid var(--stroke-color-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--stroke-color-primary);
    height: 56px;
    box-sizing: border-box;
    .title {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color-primary);
    }

    .close {
      position: absolute;
      top: 50%;
      right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translateY(-50%);
      color: var(--text-color-primary);
    }
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
