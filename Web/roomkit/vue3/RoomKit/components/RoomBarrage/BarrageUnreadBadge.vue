<template>
  <Badge :value="unreadCount" :hidden="!unreadCount">
    <IconChat :size="24" />
  </Badge>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Badge, IconChat } from '@tencentcloud/uikit-base-component-vue3';
import { useBarrageState } from './Barrage';

const props = withDefaults(defineProps<{
  /** Snapshot room id; parent remounts this component via :key when it changes. */
  roomId: string;
  isActive?: boolean;
}>(), {
  isActive: false,
});

const { messageList } = useBarrageState(props.roomId);
const unreadCount = ref(0);

watch(
  () => messageList.value?.length,
  (newLength, oldLength) => {
    if (!newLength || newLength === 0) {
      return;
    }
    if (!props.isActive && oldLength !== undefined && newLength > oldLength) {
      unreadCount.value += newLength - oldLength;
    }
  },
);

watch(
  () => props.isActive,
  (isOpen) => {
    if (isOpen) {
      unreadCount.value = 0;
    }
  },
);

const reset = () => {
  unreadCount.value = 0;
};

defineExpose({ reset });
</script>
