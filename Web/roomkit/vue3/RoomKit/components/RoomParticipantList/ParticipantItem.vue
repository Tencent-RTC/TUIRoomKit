<template>
  <div
    :class="['participant-item', { 'hovered': isHovered }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="user-info">
      <Avatar :src="participant.avatarUrl" :size="40" />
      <span class="user-name">{{ displayName }}</span>
      <div class="role-info">
        <IconUser
          v-if="isOwner || isAdmin"
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

    <div v-if="!isHovered" class="member-av-state">
      <component
        :is="item.icon"
        v-for="(item, index) in iconList"
        :key="index"
        :class="['state-icon']"
      />
    </div>

    <div v-if="isHovered" class="action-area">
      <slot name="actions" :participant="participant" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { IconUser, useUIKit,
  IconVideoOpen,
  IconVideoClose,
  IconAudioOpen,
  IconAudioClose,
  IconScreenOpen,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantRole, DeviceStatus, RoomType } from 'tuikit-atomicx-vue3';
import { Avatar } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

interface Props {
  participant: RoomParticipant;
}

const props = defineProps<Props>();

const { localParticipant } = useRoomParticipantState();

const { t } = useUIKit();

const displayName = computed(() => props.participant?.nameCard || props.participant?.userName || props.participant?.userId);

const isOwner = computed(() => props.participant?.role === RoomParticipantRole.Owner);
const isAdmin = computed(() => props.participant?.role === RoomParticipantRole.Admin);
const isMe = computed(() => localParticipant.value?.userId === props.participant.userId);

const roleLabel = computed(() => {
  if (isOwner.value && isMe.value) {
    return `${t('ParticipantList.Host')}, ${t('ParticipantList.Me')}`;
  }
  if (isOwner.value) {
    return t('ParticipantList.Host');
  }
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

const { currentRoom } = useRoomState();
const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);
const iconList = computed(() => {
  const list = [];
  if (!isWebinar.value) {
    if (props.participant?.screenShareStatus && props.participant?.screenShareStatus === DeviceStatus.On) {
      list.push({ icon: IconScreenOpen });
    }
    list.push({
      icon: props.participant?.microphoneStatus && props.participant?.microphoneStatus === DeviceStatus.On ? IconAudioOpen : IconAudioClose,
    });
    list.push({
      icon: props.participant?.cameraStatus && props.participant?.cameraStatus === DeviceStatus.On ? IconVideoOpen : IconVideoClose,
    });
  } else {
    list.push({
      icon: props.participant?.microphoneStatus && props.participant?.microphoneStatus === DeviceStatus.On ? IconAudioOpen : IconAudioClose,
    });
  }
  return list;
});
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
