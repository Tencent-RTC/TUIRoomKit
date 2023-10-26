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
      <div v-if="isMaster && isMe" class="user-extra-info">
        {{ t('Host') }}, {{ t('Me') }}
      </div>
      <div v-else-if="isMe" class="user-extra-info">
        {{ t('Me') }}
      </div>
      <div v-else-if="basicStore.masterUserId === userInfo.userId" class="user-extra-info">
        {{ t('Host') }}
      </div>
    </div>
    <!--
      *User audio and video status information
      *
      *用户音视频状态信息
    -->
    <div v-if="!isMe && showStateIcon" class="member-av-state">
      <div v-if="userInfo.onSeat">
        <svg-icon
          class="setting-icon"
          :icon-name="userInfo.hasAudioStream ? ICON_NAME.MicOn : ICON_NAME.MicOff"
          size="large"
        />
        <svg-icon
          class="setting-icon video-icon"
          :icon-name="userInfo.hasVideoStream ? ICON_NAME.CameraOn : ICON_NAME.CameraOff "
          size="large"
        />
      </div>
      <div v-if="!userInfo.onSeat && !userInfo.isUserApplyingToAnchor">
        <svg-icon
          class="setting-icon"
          :icon-name="ICON_NAME.MicOffDisabled"
          size="large"
        />
        <svg-icon
          class="setting-icon video-icon"
          :icon-name="ICON_NAME.CameraOffDisabled"
          size="large"
        />
      </div>
      <div v-if="!userInfo.onSeat && userInfo.isUserApplyingToAnchor">
        <svg-icon icon-name="apply-active"></svg-icon>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import Avatar from '../../base/Avatar.vue';
import { useBasicStore } from '../../../stores/basic';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../../constants/icon';
import SvgIcon from '../../common/SvgIcon.vue';
import { useI18n } from '../../../locales';
import { isMobile } from '../../../utils/useMediaValue';

const { t } = useI18n();

interface Props {
  userInfo: UserInfo,
  showStateIcon?: Boolean,
}

const props = defineProps<Props>();
const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { isMaster } = storeToRefs(roomStore);

const isMe = computed(() => basicStore.userId === props.userInfo.userId);

</script>

<style lang="scss" scoped>
.member-info-mobile{
    display: flex;
    align-items: center;
    width: 80vw;
    justify-content: space-between;
}
.member-info{
    display: contents;
}
.member-basic-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  .avatar-url {
    width: 48px;
    height: 48px;
    display: flex;
    border-radius: 50%;
    align-items: center;
  }
  .user-name {
    margin-left: 9px;
    font-size: 14px;
    color: var(--input-font-color);
    line-height: 22px;
    max-width: 110px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .user-extra-info {
    line-height: 18px;
    font-size: 12px;
    margin-left: 13px;
    padding: 2px;
    color: var(--user-extra-info-color-h5);
    background: var(--user-extra-info-bg-color-h5);
    border-radius: 8px;
    padding: 0 6px;
  }
}
.member-av-state {
  height: 100%;
  display: flex;
  align-items: center;
  .video-icon {
    margin-left: 5px;
  }
}
</style>
