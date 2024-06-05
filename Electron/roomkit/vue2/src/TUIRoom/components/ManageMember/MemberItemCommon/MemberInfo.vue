<template>
  <!-- User base information -->
  <div :class="[isMobile ? 'member-info-mobile' : 'member-info']">
    <div :class="!showStateIcon && isTargetUserAdmin ? 'member-basic-info-admin' : 'member-basic-info'">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl"></Avatar>
      <div class="user-name">{{ userInfo.userName || userInfo.userId }}</div>
      <div class="role-info">
        <svg-icon
          v-if="isTargetUserRoomOwner || isTargetUserAdmin"
          :icon="UserIcon"
          :color="isTargetUserAdmin ? '#F06C4B' : '#4791FF'"
          :class="isTargetUserAdmin ? 'admin-icon' : 'master-icon'"
        />
        <div :class="`user-extra-info ${isTargetUserAdmin ? 'user-extra-info-admin' : ''}`">{{ extraInfo }}</div>
      </div>
    </div>
    <!-- User audio and video status information -->
    <div v-if="showStateIcon" class="member-av-state">
      <svg-icon
        v-for="(item, index) in iconList"
        :key="index"
        :icon="item.icon"
        :class="['state-icon', { 'disable-icon': item.disable }]"
        :size="item.size"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import Avatar from '../../common/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import SvgIcon from '../../common/base/SvgIcon.vue';
import VideoOpenIcon from '../../common/icons/VideoOpenIcon.vue';
import VideoCloseIcon from '../../common/icons/VideoCloseIcon.vue';
import AudioOpenIcon from '../../common/icons/AudioOpenIcon.vue';
import AudioCloseIcon from '../../common/icons/AudioCloseIcon.vue';
import ScreenOpenIcon from '../../common/icons/ScreenOpenIcon.vue';
import ApplyActiveIcon from '../../common/icons/ApplyActiveIcon.vue';
import { useI18n } from '../../../locales';
import { isMobile } from '../../../utils/environment';
import UserIcon from '../../common/icons/UserIcon.vue';
import { TUIRole } from '@tencentcloud/tuiroom-engine-electron';

const { t } = useI18n();

interface Props {
  userInfo: UserInfo,
  showStateIcon: Boolean,
}

const props = defineProps<Props>();
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { isMaster, isSpeakAfterTakingSeatMode } = storeToRefs(roomStore);

const isMe = computed(() => basicStore.userId === props.userInfo.userId);

const isTargetUserRoomOwner = computed(() => props.userInfo.userRole === TUIRole.kRoomOwner);
const isTargetUserAdmin = computed(() => props.userInfo.userRole === TUIRole.kAdministrator);

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

const isAudienceRole = computed(() => isSpeakAfterTakingSeatMode.value && !props.userInfo.onSeat);

const iconList = computed(() => {
  const list = [];
  if (props.userInfo.hasScreenStream) {
    list.push({ icon: ScreenOpenIcon });
  }
  if (!isAudienceRole.value) {
    list.push({ icon: props.userInfo.hasAudioStream ? AudioOpenIcon : AudioCloseIcon });
    list.push({ icon: props.userInfo.hasVideoStream ? VideoOpenIcon : VideoCloseIcon });
  }
  if (isAudienceRole.value && !props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: AudioCloseIcon, disable: true });
    list.push({ icon: VideoCloseIcon, disable: true });
  }
  if (isAudienceRole.value && props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: ApplyActiveIcon, size: 20 });
  }
  return list;
});
</script>

<style lang="scss" scoped>

.tui-theme-black .member-av-state {
  --icon-color: #A3AEC7;
}

.tui-theme-white .member-av-state {
  --icon-color: #B2BBD1;
}
.member-info,
.member-info-mobile {
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-between;
  .member-basic-info
  ,.member-basic-info-admin {
    display: flex;
    flex-direction: row;
    align-items: center;
    .avatar-url {
      width: 32px;
      height: 32px;
      display: flex;
      border-radius: 50%;
      align-items: center;
    }
    .user-name {
      margin-left: 12px;
      font-size: 14px;
      font-weight: 400;
      color: var(--font-color-1);
      line-height: 22px;
      max-width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .role-info {
      display: flex;
      .master-icon,
      .admin-icon {
        color: var(--active-color-2);
        margin-left: 8px;
        display: flex;
      }
      .admin-icon {
        color: var(--orange-color);
      }
      .user-extra-info,
      .user-extra-info-admin {
        line-height: 20px;
        font-size: 14px;
        font-weight: 400;
        margin-left: 4px;
        padding: 2px;
        color: var(--active-color-2);
        padding: 0 6px;
      }
      .user-extra-info-admin {
        transition: none;
        color: var(--orange-color);
      }
    }
  }

  .member-basic-info-admin {
    .user-name {
      max-width: 40px;
    }
  }

  .member-av-state {
    height: 100%;
    display: flex;
    align-items: center;
    color: var(--icon-color);
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
