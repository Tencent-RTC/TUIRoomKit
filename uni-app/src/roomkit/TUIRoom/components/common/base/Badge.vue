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

const badgeClass = computed(() => ['tui-badge', `tui-badge-${props.type}`, props.isDot ? 'tui-badge-isDot' : '']);
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
    color: #FFFFFF;
    transform: translateY(-50%) translateX(100%);
    font-weight: bold;
    border-radius: 10px;
  }
}

.tui-badge-primary {
  .tui-badge-count {
    background-color: #1C66E5;
  }
}

.tui-badge-danger {
  .tui-badge-count {
    background-color: #F23C5B;
  }
}

.tui-badge-isDot {
  .tui-badge-count {
    top: 0;
    height: 8px;
    width: 8px;
    padding: 0;
    border-radius: 50%;
  }
}
</style>
