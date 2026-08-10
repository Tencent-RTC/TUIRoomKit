<template>
  <div class="room-chat">
    <!-- Remount on room switch so Barrage keeps a roomId snapshot (keepAlive-safe). -->
    <BarrageList
      v-if="currentRoom?.roomId"
      :key="currentRoom.roomId"
      ref="barrageListRef"
      class="room-message-list"
      :roomId="currentRoom.roomId"
    >
      <template #user-badge="{ message }">
        <span :class="['user-badge', getRoleClass(message.sender.userId)]">{{ getRoleLabel(message.sender.userId) }}</span>
      </template>
    </BarrageList>
    <BarrageInput
      v-if="currentRoom?.roomId"
      :key="`input-${currentRoom.roomId}`"
      :roomId="currentRoom.roomId"
      class="room-message-input"
      :placeholder="placeholder"
      :disabled="localParticipant?.isMessageDisabled"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState, useRoomState } from 'tuikit-atomicx-vue3/room';
import { BarrageInput, BarrageList } from './Barrage';

interface Props {
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
});

const barrageListRef = ref<InstanceType<typeof BarrageList> | null>(null);
const { t } = useUIKit();
const { currentRoom } = useRoomState();
const { localParticipant, adminList, participantList } = useRoomParticipantState();

const isAdmin = (userId: string) => adminList.value?.some(admin => admin.userId === userId);
const isOwner = (userId: string) => currentRoom.value?.roomOwner?.userId === userId;
const isParticipant = (userId: string) => participantList.value?.some(participant => participant.userId === userId);

const getRoleClass = (userId: string) => {
  if (isOwner(userId)) {
    return 'user-badge-owner';
  }
  if (isAdmin(userId)) {
    return 'user-badge-admin';
  }
  if (isParticipant(userId)) {
    return 'user-badge-participant';
  }
  return '';
};
const getRoleLabel = (userId: string) => {
  if (isOwner(userId)) {
    return t('RoomBarrage.Host');
  }
  if (isAdmin(userId)) {
    return t('RoomBarrage.Admin');
  }
  if (isParticipant(userId)) {
    return '';
  }
  return '';
};

const placeholder = computed(() =>
  localParticipant.value?.isMessageDisabled
    ? t('RoomChat.disabled_placeholder')
    : t('RoomChat.input_placeholder'),
);

watch(() => props.isActive, (newVal, oldVal) => {
  if (newVal && !oldVal && barrageListRef.value) {
    barrageListRef.value?.scrollToBottom('smooth');
  }
});
</script>

<style lang="scss" scoped>
.room-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
  padding: 8px;

  .room-message-list {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .room-message-input {
    flex-shrink: 0;
  }
}

.user-badge {
  color: #fff;

}

.user-badge-admin {
  border-radius: 12px;
  padding: 2px 8px;
  margin-right: 6px;
  background-color: var(--text-color-warning);;
}
.user-badge-owner {
  border-radius: 12px;
  padding: 2px 8px;
  margin-right: 6px;
  background-color: var(--text-color-link);
}
.user-badge-participant {

}
</style>
