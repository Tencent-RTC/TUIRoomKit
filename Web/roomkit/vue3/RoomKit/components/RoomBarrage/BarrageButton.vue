<template>
  <IconButton :title="t('Chat.Title')" @click-icon="handleClick">
    <!-- Mount only after join; remount on room switch so useBarrageState keeps a roomId snapshot. -->
    <BarrageUnreadBadge
      v-if="roomId"
      :key="roomId"
      ref="unreadBadgeRef"
      :room-id="roomId"
      :is-active="isActive"
    />
    <IconChat v-else :size="24" />
  </IconButton>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IconChat,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import BarrageUnreadBadge from './BarrageUnreadBadge.vue';

interface Props {
  isActive?: boolean;
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  togglePanel: undefined,
});

const { t } = useUIKit();
const { currentRoom } = useRoomState();
const roomId = computed(() => currentRoom.value?.roomId);
const unreadBadgeRef = ref<InstanceType<typeof BarrageUnreadBadge> | null>(null);

const handleClick = () => {
  unreadBadgeRef.value?.reset();
  props.togglePanel?.();
};
</script>
