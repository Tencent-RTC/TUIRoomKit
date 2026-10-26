<template>
  <span
    class="rk-icon"
    :class="{ 'rk-icon-spin': spin }"
    :style="iconStyle"
    @click="onClick"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';

defineOptions({ name: 'TUIIcon' });

const props = defineProps<{
  size?: number | string;
  color?: string;
  spin?: boolean;
}>();

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const iconStyle = computed<CSSProperties>(() => {
  let size: string | undefined;
  if (props.size != null) {
    size = typeof props.size === 'number' ? `${props.size}px` : props.size;
  }
  return {
    width: size,
    height: size,
    color: props.color,
  };
});

function onClick(e: MouseEvent) {
  emit('click', e);
}
</script>
