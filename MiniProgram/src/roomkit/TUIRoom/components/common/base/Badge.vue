<template>
  <div :class="badgeClass">
    <slot></slot>
    <sup v-if="showBadge" class="tui-badge-count">{{ content }}</sup>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface Props {
  type?: 'primary' | 'danger';
  value?: string | number;
  max?: number;
  hidden?: boolean;
  isDot?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  value: '',
  max: 99,
  hidden: false,
  isDot: false,
});

const showBadge = computed(() => !props.hidden && (props.value || props.isDot));

const content = computed(() => {
  if (props.isDot) return '';
  if (typeof props.value === 'number' && typeof props.max === 'number') {
    return props.value > props.max ? `${props.max}+` : props.value;
  }
  return props.value;
});

const badgeClass = computed(() => [
  'tui-badge',
  `tui-badge-${props.type}`,
  props.isDot ? 'tui-badge-isDot' : '',
]);
</script>

<style lang="scss" scoped>
.tui-badge {
  position: relative;
  display: inline-block;

  .tui-badge-count {
    position: absolute;
    top: 0;
    right: 15px;
    display: inline-block;
    padding: 1px 6px;
    font-size: 12px;
    font-weight: bold;
    color: var(--white-color);
    border-radius: 10px;
    transform: translateY(-50%) translateX(100%);
  }
}

.tui-badge-primary {
  .tui-badge-count {
    background-color: var(--active-color-1);
  }
}

.tui-badge-danger {
  .tui-badge-count {
    background-color: var(--red-color-2);
  }
}

.tui-badge-isDot {
  .tui-badge-count {
    top: 0;
    width: 8px;
    height: 8px;
    padding: 0;
    border-radius: 50%;
  }
}
</style>
