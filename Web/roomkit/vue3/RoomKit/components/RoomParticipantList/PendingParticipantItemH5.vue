<template>
  <div
    :class="{ 'pending-participant-item-h5': true, 'hovered': isHovered }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <Avatar :src="userInfo.avatarUrl" :size="40" />
    <div class="participant-content">
      <div class="user-info">
        <span class="user-name">{{ displayName }}</span>

        <div class="status-container">
          <span v-if="showRejectedMessage">{{ t('ParticipantList.NotJoin') }}</span>
          <span v-if="userInfo.roomStatus === RoomParticipantStatus.InCalling">{{ t('ParticipantList.Calling') }}</span>
          <TUIButton
            v-else
            type="primary"
            @click="handleInvite({ userId: userInfo.userId })"
          >
            {{ t('ParticipantList.Call') }}
          </TUIButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUIKit, TUIButton, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantStatus } from 'tuikit-atomicx-vue3';
import { Avatar } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

defineOptions({
  name: 'PendingParticipantItemH5',
});

interface Props {
  userInfo: RoomParticipant;
}

const props = defineProps<Props>();

const { currentRoom, callUserToRoom } = useRoomState();
const { t } = useUIKit();

const displayName = computed(() => props.userInfo?.userName || props.userInfo?.userId);

const isHovered = ref(false);
const showRejectedMessage = ref(false);
let rejectedTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.userInfo.roomStatus,
  (newStatus) => {
    if (rejectedTimer) {
      clearTimeout(rejectedTimer);
      rejectedTimer = null;
    }

    if (newStatus === RoomParticipantStatus.CallRejected) {
      showRejectedMessage.value = true;
      rejectedTimer = setTimeout(() => {
        showRejectedMessage.value = false;
        rejectedTimer = null;
      }, 3000);
    } else {
      showRejectedMessage.value = false;
    }
  },
);

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
};

async function handleInvite({ userId }: { userId: string }) {
  if (!currentRoom.value?.roomId) {
    return;
  }
  try {
    await callUserToRoom({
      roomId: currentRoom.value?.roomId || '',
      userIdList: [userId],
      timeout: 60,
    });
    TUIToast.success({ message: t('ParticipantList.InviteSuccess') });
  } catch (error) {
    TUIToast.error({ message: t('ParticipantList.InviteFailed') });
    console.error('Failed to invite user to room:', error);
  }
}
</script>

<style scoped lang="scss">
.pending-participant-item-h5 {
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
  position: relative;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-secondary);
  transition: background .2s ease;
  height: 50px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--list-color-hover);
  }

  &:last-child {
    .participant-content {
      border-bottom: none;
    }
  }
}

.participant-content {
  flex: 1;
  min-width: 0;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-bottom: 1px solid var(--stroke-color-secondary);

  .user-info {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }
}

.user-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-text {
  font-size: 12px;
}
</style>
