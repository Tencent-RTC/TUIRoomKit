<template>
  <Teleport to="body">
    <div v-if="props.modelValue" class="dialog-container">
      <span v-if="hasTitle" class="dialog-title">{{ props.title }}</span>
      <div :class="[hasTitle ? 'dialog-content' : 'dialog-content-notitle']">
        <slot></slot>
      </div>
      <div class="dialog-footer">
        <slot name="cancel"></slot>
        <div class="divide-line"></div>
        <slot name="agree"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
}

const props = defineProps<Props>();

const hasTitle = computed(() => props.title !== '');
</script>

<style lang="scss" scoped>
.dialog-container {
  min-width: 80vw;
  position: fixed;
  background-color: #ffffff;
  border-radius: 8px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  z-index: 2000;
  font-family: 'PingFang SC';
  font-style: normal;
  color: var(--black-color);

  .dialog-title {
    display: inline-block;
    font-size: 16px;
    text-align: center;
    font-weight: 500;
    padding-top: 14px;
    padding: 24px 24px 12px 24px;
    box-sizing: border-box;
  }
  .dialog-content {
    font-weight: 400;
    font-size: 14px;
    text-align: center;
    font-weight: 400;
    color: var(--font-color-4);
    padding: 0 24px 20px 24px;
  }
  .dialog-content-notitle {
    font-size: 14px;
    text-align: center;
    padding: 24px;
  }
  .dialog-footer {
    border-top: 1px solid #d5e0f2;
    display: flex;
    justify-content: center;
    .divide-line {
      width: 1px;
      background-color: #D5E0F2;
    }
  }
}
</style>
