<template>
  <div class="participant-item-h5">
    <Avatar :src="participant.avatarUrl" :size="40" />
    <div class="participant-content">
      <div class="user-info">
        <div class="user-details">
          <div class="user-name-row">
            <span class="user-name">{{ displayName }}</span>
          </div>
          <div v-if="roleLabel" class="role-info">
            <IconUser
              v-if="isOwner || isAdmin"
              size="14"
              :class="isAdmin ? 'admin-icon' : 'master-icon'"
            />
            <span :class="`user-extra-info ${isAdmin ? 'user-extra-info-admin' : ''}`">
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <div class="member-av-state">
          <component
            :is="item.icon"
            v-for="(item, index) in iconList"
            :key="index"
            :class="['state-icon']"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IconUser,
  useUIKit,
  IconVideoOpen,
  IconVideoClose,
  IconAudioOpen,
  IconAudioClose,
  IconScreenOpen,
} from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantRole, DeviceStatus } from 'tuikit-atomicx-vue3';
import { Avatar } from 'tuikit-atomicx-vue3';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

defineOptions({
  name: 'ParticipantItemH5',
});

interface Props {
  participant: RoomParticipant;
  isLocal?: boolean;
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

const iconList = computed(() => {
  const list = [];
  if (props.participant?.screenShareStatus && props.participant?.screenShareStatus === DeviceStatus.On) {
    list.push({ icon: IconScreenOpen });
  }
  list.push({
    icon: props.participant?.microphoneStatus && props.participant?.microphoneStatus === DeviceStatus.On ? IconAudioOpen : IconAudioClose,
  });
  list.push({
    icon: props.participant?.cameraStatus && props.participant?.cameraStatus === DeviceStatus.On ? IconVideoOpen : IconVideoClose,
  });
  return list;
});
</script>

<style scoped lang="scss">
.participant-item-h5 {
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
  position: relative;
  cursor: pointer;
  transition: background .2s ease;
  height: 50px;
  -webkit-tap-highlight-color: transparent;

  &:active {
    background: var(--list-color-hover);
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
  box-sizing: border-box;
}

.user-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  .user-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .user-name-row {
      display: flex;
      align-items: center;

      .user-name {
        min-width: 0;
        font-size: 16px;
        font-weight: 400;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 4px;

      .master-icon,
      .admin-icon {
        display: flex;
        color: var(--text-color-link-hover);
        flex-shrink: 0;
      }

      .admin-icon {
        color: var(--text-color-warning);
      }

      .user-extra-info,
      .user-extra-info-admin {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--text-color-link-hover);
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
      }

      .user-extra-info-admin {
        color: var(--text-color-warning);
      }
    }
  }

  .member-av-state {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--uikit-color-gray-7);
    flex-shrink: 0;

    .state-icon {
      flex-shrink: 0;
    }
  }
}
</style>
