<template>
  <div class="tui-badge">
    <slot></slot>
    <sup v-if="!props.hidden" class="tui-badge-count">{{ content }}</sup>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  value: string | number;
  max: number;
  hidden?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  value: '',
  max: 99,
  hidden: false,
});

const content = computed(() => {
  if (typeof props.value === 'number' && typeof props.max === 'number') {
    return props.value > props.max ? `${props.max}+` : props.value;
  }
  return props.value;
});
</script>

<style lang="scss" scoped>
.tui-badge {
  position: relative;
  display: inline-block;

  .tui-badge-count {
    position: absolute;
    top: -10px;
    left: 40px;
    display: inline-block;
    padding: 3px 6px;
    font-size: 12px;
    font-weight: bold;
    color: var(--white-color);
    background-color: var(--active-color-1);
    border-radius: 10px;
  }
}
</style>
