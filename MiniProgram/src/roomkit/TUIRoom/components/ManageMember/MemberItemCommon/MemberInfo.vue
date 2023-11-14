<template>
  <!--
      *User base information
      *
      *用户基础信息
    -->
  <div :class="[isMobile ? 'member-info-mobile' : 'member-info']">
    <!-- 用户基础信息 -->
    <div class="member-basic-info">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl"></Avatar>
      <div class="user-name">{{ userInfo.userName || userInfo.userId }}</div>
      <div v-if="userInfo.userRole === TUIRole.kRoomOwner" class="master-icon">
        <svg-icon style="display: flex" :icon="UserIcon" />
      </div>
      <div class="user-extra-info">{{ extraInfo }}</div>
    </div>
    <!--
      *User audio and video status information
      *
      *用户音视频状态信息
    -->
    <div v-if="showStateIcon" class="member-av-state">
      <svg-icon
        style="display: flex"
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
import VideoOpenIcon from '../../../assets/icons/VideoOpenIcon.svg';
import VideoCloseIcon from '../../../assets/icons/VideoCloseIcon.svg';
import AudioOpenIcon from '../../../assets/icons/AudioOpenIcon.svg';
import AudioCloseIcon from '../../../assets/icons/AudioCloseIcon.svg';
import ScreenOpenIcon from '../../../assets/icons/ScreenOpenIcon.svg';
import ApplyActiveIcon from '../../../assets/icons/ApplyActiveIcon.svg';
import { useI18n } from '../../../locales';
import { isMobile } from '../../../utils/useMediaValue';
import UserIcon from '../../../assets/icons/UserIcon.svg';
import { TUIRole } from '@tencentcloud/tuiroom-engine-wx';

const { t } = useI18n();

interface Props {
  userInfo: UserInfo,
  showStateIcon: Boolean,
}

const props = defineProps<Props>();
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { isMaster, isSpeakAfterTakingSeatMode, masterUserId } = storeToRefs(roomStore);

const isMe = computed(() => basicStore.userId === props.userInfo.userId);

const extraInfo = computed(() => {
  if (isMaster.value && isMe.value) {
    return `${t('Host')}, ${t('Me')}`;
  }
  if (isMe.value) {
    return t('Me');
  }
  if (masterUserId.value === props.userInfo.userId) {
    return t('Host');
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
.member-info-mobile{
  display: flex;
  align-items: center;
  width: 80vw;
  justify-content: space-between;
}
.member-info{
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: space-between;
}
.member-basic-info {
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
    max-width: 110px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .master-icon {
    color: var(--active-color-2);
    margin-left: 8px;
    display: flex;
  }
  .user-extra-info {
    line-height: 20px;
    font-size: 14px;
    font-weight: 400;
    margin-left: 4px;
    padding: 2px;
    color: var(--active-color-2);
    padding: 0 6px;
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

</style>
