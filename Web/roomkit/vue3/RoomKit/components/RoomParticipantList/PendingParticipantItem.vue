<template>
  <div
    :class="{ 'unjoined-user-item': true, 'hovered': isHovered }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="user-info">
      <Avatar :src="userInfo.avatarUrl" :size="40" />
      <span class="user-name">{{ displayName }}</span>
    </div>

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
</template>

<script setup lang="ts">
import { ref, computed, defineOptions, watch } from 'vue';
import { useUIKit, TUIButton, TUIToast } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantStatus } from 'tuikit-atomicx-vue3';
import { Avatar } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

defineOptions({
  name: 'ParticipantItem',
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
.unjoined-user-item {
  display: flex;
  align-items: center;
  padding: 0px 20px;
  height: 52px;
  box-sizing: border-box;
  gap: 12px;
  position: relative;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color-secondary);

  &.hovered {
    background: var(--list-color-hover);
  }
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.user-name {

  overflow: hidden;
  margin-left: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-text {
  font-size: 12px;
}
</style>
