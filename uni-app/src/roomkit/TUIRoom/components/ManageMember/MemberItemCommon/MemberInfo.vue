<template>
  <!--
      *User base information
      *
      *用户基础信息
    -->
  <div :class="[isMobile ? 'member-info-mobile' : 'member-info']">
    <!-- 用户基础信息 -->
    <div :class="!showStateIcon && isTargetUserAdmin ? 'member-basic-info-admin' : 'member-basic-info'">
      <div class="avatar-url">
        <Avatar :img-src="userInfo.avatarUrl"></Avatar>
      </div>
      <text class="user-name">{{ userInfo.userName || userInfo.userId }}</text>
      <div class="role-info">
        <svg-icon
          v-if="isTargetUserRoomOwner || isTargetUserAdmin"
          style="display: flex"
          :color="isTargetUserAdmin ? '#F06C4B' : '#1C66E5'"
          icon="UserIcon"
        />
        <text :class="`user-extra-info ${isTargetUserAdmin ? 'user-extra-info-admin' : ''}`">{{ extraInfo }}</text>
      </div>
    </div>
    <!--
      *User audio and video status information
      *
      *用户音视频状态信息
    -->
    <div v-if="showStateIcon" class="member-av-state">
      <div
        v-for="(item, index) in iconList"
        :class="['state-icon', { 'disable-icon': item.disable }]"
      >
        <svg-icon
          :key="index"
          style="display: flex"
          :icon="item.icon"
          :size="item.size"
          :color="item.color"
        />
      </div>
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
import { useI18n } from '../../../locales';
import { isMobile } from '../../../utils/environment';
import { TUIRole } from '@tencentcloud/tuiroom-engine-uniapp-app';

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
    list.push({ icon: 'ScreenOpenIcon', size: 20, color: '#B2BBD1' });
  }
  if (!isAudienceRole.value) {
    list.push({ icon: props.userInfo.hasAudioStream ? 'AudioOpenIcon' : 'AudioCloseIcon', size: 20, color: '#B2BBD1' });
    list.push({ icon: props.userInfo.hasVideoStream ? 'VideoOpenIcon' : 'VideoCloseIcon', size: 20, color: '#B2BBD1' });
  }
  if (isAudienceRole.value && !props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: 'AudioCloseIcon', disable: true, size: 20, color: '#B2BBD1' });
    list.push({ icon: 'VideoCloseIcon', disable: true, size: 20, color: '#B2BBD1' });
  }
  if (isAudienceRole.value && props.userInfo.isUserApplyingToAnchor) {
    list.push({ icon: 'ApplyActiveIcon', size: 20, color: '#1C66E5' });
  }
  return list;
});
</script>

<style lang="scss" scoped>

// .tui-theme-black .member-av-state {
//   --icon-color: #A3AEC7;
// }

// .tui-theme-white .member-av-state {
//   --icon-color: #B2BBD1;
// }
.member-info,
.member-info-mobile {
  display: flex;
  width: 750rpx;
	flex-direction: row;
  // justify-content: space-between;
	align-items: center;
	position: relative;
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
    }
    .user-name {
      margin-left: 12px;
      font-size: 14px;
      font-weight: 400;
      color: #4F586B;
      line-height: 22px;
      max-width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .role-info {
      display: flex;
      flex-direction: row;
      margin-left: 8px;
      align-items: center;
      .user-extra-info,
      .user-extra-info-admin {
        line-height: 20px;
        font-size: 14px;
        font-weight: 400;
        margin-left: 4px;
        padding: 2px;
        color: #1C66E5;
        padding: 0 6px;
      }
      .user-extra-info-admin {
        transition: none;
        color: #F06C4B;
      }
    }
  }

  .member-basic-info-admin {
    .user-name {
      max-width: 40px;
    }
  }

  .member-av-state {
		position: absolute;
		right: 60px;
		top: 2px;
		bottom: 0;
    display: flex;
    align-items: center;
		flex-direction: row;
    color: #B2BBD1;
    .state-icon {
      margin-left: 16px;
    }
    .disable-icon {
      opacity: 0.4;
    }
  }
}


</style>
