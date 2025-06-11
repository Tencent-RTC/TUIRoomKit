<template>
  <!-- User base information -->
  <div :class="[isMobile ? 'member-info-mobile' : 'member-info']">
    <div
      :class="
        !showStateIcon && isTargetUserAdmin
          ? 'member-basic-info-admin'
          : 'member-basic-info'
      "
    >
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl" />
      <div class="user-name">{{ roomService.getDisplayName(userInfo) }}</div>
      <div class="role-info">
        <IconUser
          size="20"
          v-if="isTargetUserRoomOwner || isTargetUserAdmin"
          :class="isTargetUserAdmin ? 'admin-icon' : 'master-icon'"
        />
        <div
          :class="`user-extra-info ${isTargetUserAdmin ? 'user-extra-info-admin' : ''}`"
        >
          {{ extraInfo }}
        </div>
      </div>
    </div>
    <!-- User audio and video status information -->
    <div v-if="showStateIcon" class="member-av-state">
      <TUIIcon
        v-for="(item, index) in iconList"
        :key="index"
        :icon="item.icon"
        :class="['state-icon', { 'disable-icon': item.disable }]"
        :size="item.size"
      />
    </div>
    <member-invite
      class="member-invite"
      v-show="!props.userInfo.isInRoom"
      :user-info="props.userInfo"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, defineProps } from 'vue';
import Avatar from '../../common/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import MemberInvite from '../MemberInvite/MemberInvite.vue';
import { useI18n } from '../../../locales';
import { isMobile } from '../../../utils/environment';
import {
  TUIIcon,
  IconVideoOpen,
  IconVideoClose,
  IconAudioOpen,
  IconAudioClose,
  IconScreenOpen,
  IconApplyActive,
  IconUser,
} from '@tencentcloud/uikit-base-component-vue3';
import { TUIRole } from '@tencentcloud/tuiroom-engine-js';
import { roomService } from '../../../services';

const { t } = useI18n();

interface Props {
  userInfo: UserInfo;
  showStateIcon: boolean;
}

const props = defineProps<Props>();
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { isMaster, isSpeakAfterTakingSeatMode } = storeToRefs(roomStore);

const isMe = computed(() => basicStore.userId === props.userInfo.userId);

const isTargetUserRoomOwner = computed(
  () => props.userInfo.userRole === TUIRole.kRoomOwner
);
const isTargetUserAdmin = computed(
  () => props.userInfo.userRole === TUIRole.kAdministrator
);

const extraInfo = computed(() => {
  if (isMaster.value && isMe.value) {
    return `${t('Host')}, ${t('Me')}`;
  }
  if (isTargetUserRoomOwner.value) {
    return t('Host');
  }
  if (isTargetUserAdmin.value && isMe.value) {
    return `${t('Admin')}, ${t('Me')}`;
  }
  if (isTargetUserAdmin.value) {
    return t('Admin');
  }
  if (isMe.value) {
    return t('Me');
  }
  return '';
});

const isAudienceRole = computed(
  () => isSpeakAfterTakingSeatMode.value && !props.userInfo.onSeat
);

const iconList = computed(() => {
  const list = [];
  if (props.userInfo.hasScreenStream) {
    list.push({ icon: IconScreenOpen });
  }
  if (!isAudienceRole.value) {
    list.push({
      icon: props.userInfo.hasAudioStream ? IconAudioOpen : IconAudioClose,
    });
    list.push({
      icon: props.userInfo.hasVideoStream ? IconVideoOpen : IconVideoClose,
    });
  }
  if (isAudienceRole.value && !props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: IconAudioClose, disable: true });
    list.push({ icon: IconVideoClose, disable: true });
  }
  if (isAudienceRole.value && props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: IconApplyActive, size: 20 });
  }
  return list;
});
</script>

<style lang="scss" scoped>
.member-info,
.member-info-mobile {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;

  .member-basic-info,
  .member-basic-info-admin {
    display: flex;
    flex-direction: row;
    align-items: center;

    .avatar-url {
      display: flex;
      align-items: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }

    .user-name {
      max-width: 100px;
      margin-left: 12px;
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      line-height: 22px;
      color: var(--text-color-secondary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .role-info {
      display: flex;

      .master-icon,
      .admin-icon {
        display: flex;
        margin-left: 8px;
        color: var(--text-color-link);
      }

      .admin-icon {
        color: var(--text-color-warning);
      }

      .user-extra-info,
      .user-extra-info-admin {
        padding: 2px;
        padding: 0 6px;
        margin-left: 4px;
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        color: var(--text-color-link);
      }

      .user-extra-info-admin {
        color: var(--text-color-warning);
        transition: none;
      }
    }
  }

  .member-basic-info-admin {
    .user-name {
      max-width: 40px;
    }
  }

  .member-invite {
    display: flex;
    align-items: center;
    height: 100%;
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
}

.member-info-mobile {
  align-items: center;
  width: 80vw;
}
</style>
