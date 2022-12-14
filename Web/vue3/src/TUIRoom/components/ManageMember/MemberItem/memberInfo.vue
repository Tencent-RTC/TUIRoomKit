<template>
  <!--
    *User base information
    *
    *用户基础信息
  -->
  <div class="member-basic-info">
    <img class="avatar-url" :src="userInfo.avatarUrl || defaultAvatar">
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
  <div v-if="!isMe && !showMemberControl" class="member-av-state">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
import defaultAvatar from '../../../assets/imgs/avatar.png';
import { useBasicStore } from '../../../stores/basic';
import { UserInfo, useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../../constants/icon';
// import { ETUIRoomRole } from '../../../tui-room-core';
import SvgIcon from '../../common/SvgIcon.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Props {
  userInfo: UserInfo,
  showMemberControl: Boolean,
}

const props = defineProps<Props>();

const basicStore = useBasicStore();
const roomStore = useRoomStore();
const { isMaster } = storeToRefs(roomStore);

const isMe = computed(() => basicStore.userId === props.userInfo.userId);

</script>

<style lang="scss">
.member-basic-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  .avatar-url {
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }
  .user-name {
    margin-left: 9px;
    font-size: 14px;
    color: #7C85A6;
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
    color: #4D70FF;
    background: #2E323D;
    border-radius: 8px;
    padding: 0 6px;
  }
}
.member-av-state {
  .video-icon {
    margin-left: 5px;
  }
}
</style>
