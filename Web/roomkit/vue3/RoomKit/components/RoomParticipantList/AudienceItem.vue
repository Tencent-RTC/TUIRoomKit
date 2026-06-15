<template>
  <div
    :class="['participant-item', { 'hovered': isHovered }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="user-info">
      <Avatar :src="audience.avatarUrl" :size="40" />
      <span class="user-name">{{ displayName }}</span>
      <div class="role-info">
        <IconUser
          v-if="isAdmin"
          size="20"
          :class="isAdmin ? 'admin-icon' : 'master-icon'"
        />
        <div
          :class="`user-extra-info ${isAdmin ? 'user-extra-info-admin' : ''}`"
        >
          {{ roleLabel }}
        </div>
      </div>
    </div>

    <div v-if="isHovered" class="action-area">
      <slot name="actions" :audience="audience" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IconUser, useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { Avatar } from 'tuikit-atomicx-vue3';
import type { RoomUser } from 'tuikit-atomicx-vue3';

interface Props {
  audience: RoomUser;
}

const props = defineProps<Props>();

const { localParticipant, adminList } = useRoomParticipantState();

const { t } = useUIKit();

const displayName = computed(() => props.audience?.userName || props.audience?.userId);

const isAdmin = computed(() => adminList.value?.find(admin => admin.userId === props.audience.userId));
const isMe = computed(() => localParticipant.value?.userId === props.audience.userId);

const roleLabel = computed(() => {
  if (isAdmin.value && isMe.value) {
    return `${t('ParticipantList.Admin')}, ${t('ParticipantList.Me')}`;
  }
  if (isAdmin.value) {
    return t('ParticipantList.Admin');
  }
  if (isMe.value) {
    return t('ParticipantList.Me');
  }
  return '';
});
const isHovered = ref(false);

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  isHovered.value = false;
};
</script>

<style scoped lang="scss">
.participant-item {
  display: flex;
  align-items: center;
  padding: 0px 20px;
  height: 52px;
  box-sizing: border-box;
  gap: 12px;
  position: relative;
  cursor: pointer;

  &.hovered {
    background: var(--list-color-hover);
  }
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  min-width: 0;

  .user-name {
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color-secondary);
    overflow: hidden;
    margin-left: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role-info {
    display: flex;
    flex-shrink: 0;
    margin-left: 8px;

    .master-icon,
    .admin-icon {
      display: flex;
      color: var(--text-color-link);
    }

    .admin-icon {
      color: var(--text-color-warning);
    }

    .user-extra-info,
    .user-extra-info-admin {
      margin-left: 4px;
      font-size: 14px;
      font-weight: 400;
      line-height: 20px;
      color: var(--text-color-link);
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .user-extra-info-admin {
      color: var(--text-color-warning);
      transition: none;
    }
  }
}

.member-av-state {
    display: flex;
    align-items: center;
    height: 100%;
    color: var(--uikit-color-gray-7);

    .state-icon {
      margin-left: 16px;
    }

    .disable-icon {
      opacity: 0.4;
    }
  }

.action-area {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>
