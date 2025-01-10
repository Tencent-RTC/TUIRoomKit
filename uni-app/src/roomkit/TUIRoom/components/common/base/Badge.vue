<template>
  <div :class="badgeClass">
    <slot style="position: relative;"></slot>
    <div v-if="showBadge" class="tui-badge-count">
      <text style="font-size: 12px;font-weight: 500; color: #fff;">{{ content }}</text>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, defineProps } from 'vue';

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

  .tui-badge-count {
	  padding: 1px 3px;
	  position: absolute;
	  top: 0;
	  right: 3px;
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
