<template>
  <div v-if="showInvitation" class="invitation-notification-container">
    <div class="invitation-notification-inviter-container">
      <div class="invitation-notification-inviter">
        <Avatar class="avatar" :img-src="invitationInfo.avatarUrl" />
        <span class="invitation-notification-title">{{
          t('sb invites you to join the conference', {
            name: invitationInfo.userName || invitationInfo.userId,
          })
        }}</span>
      </div>
      <span class="invitation-notification-room-name">{{
        invitationInfo.roomName
      }}</span>
      <div class="invitation-notification-room-info-container">
        <div class="invitation-notification-room-text-container">
          <span class="invitation-notification-room-text">
            {{ t('Host') }}:
          </span>
          <span class="invitation-notification-room-text">
            {{ invitationInfo.roomOwner }}
          </span>
        </div>
        <i class="invitation-notification-room-text-split"></i>
        <div>
          <span class="invitation-notification-room-text">
            {{ t('Attendees') }}:
          </span>
          <span class="invitation-notification-room-text">
            {{ `${invitationInfo.roomMemberCount} ${t('people')}` }}
          </span>
        </div>
      </div>
    </div>
    <i class="invitation-notification-bottom-split"></i>
    <div class="invitation-notification-bottom-container">
      <span
        class="invitation-notification-bottom"
        @click="handleRejectInvitation"
        >{{ t('Not joining for now') }}
      </span>
      <tui-button
        class="button-item"
        style="width: 110px"
        @click="handleEnterRoom"
      >
        <svg-icon class="icon" :icon="EnterRoomIcon" />
        <span class="button-text">{{ t('Enter Now') }}</span>
      </tui-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineEmits } from 'vue';
import Avatar from '../common/Avatar.vue';
import { useI18n } from '../../locales';
import EnterRoomIcon from '../common/icons/EnterRoomIcon.vue';
import SvgIcon from '../common/base/SvgIcon.vue';
import TuiButton from '../common/base/Button.vue';
import {
  TUIConferenceInvitationManagerEvents,
  TUIInvitation,
  TUIInvitationRejectedReason,
  TUIRoomInfo,
} from '@tencentcloud/tuiroom-engine-js';
import { roomService } from '../../services/index';
import { isMobile } from '../../utils/environment';
const invitationInfo = ref({
  userId: '',
  userName: '',
  avatarUrl: '',
  roomName: '',
  roomMemberCount: 0,
  roomOwner: '',
  roomId: '',
});
const { t } = useI18n();
const showInvitation = ref(false);

const emits = defineEmits(['join-conference']);

const onReceiveInvitation = (data: {
  roomInfo: TUIRoomInfo;
  invitation: TUIInvitation;
  extensionInfo: string;
}) => {
  const { roomInfo, invitation } = data;
  invitationInfo.value.userId = invitation.inviter.userId;
  invitationInfo.value.userName = invitation.inviter.userName;
  invitationInfo.value.avatarUrl = invitation.inviter.avatarUrl;
  invitationInfo.value.roomName = roomInfo.roomName;
  invitationInfo.value.roomMemberCount = roomInfo.roomMemberCount;
  invitationInfo.value.roomOwner = roomInfo.roomOwner;
  invitationInfo.value.roomId = roomInfo.roomId;
  setInvitationDisplay(true);
};

const handleEnterRoom = () => {
  const { roomId } = invitationInfo.value;
  roomService.conferenceInvitationManager.accept({ roomId });
  setInvitationDisplay(false);
  emits('join-conference', {
    roomId,
    roomParam: {
      isOpenCamera: false,
      isOpenMicrophone: true,
    },
  });
};

const handleRejectInvitation = () => {
  const { roomId } = invitationInfo.value;
  roomService.conferenceInvitationManager.reject({
    roomId,
    reason: TUIInvitationRejectedReason.kRejectToEnter,
  });
  setInvitationDisplay(false);
};

const onInvitationTimeout = () => {
  setInvitationDisplay(false);
};

const setInvitationDisplay = (options: boolean) => {
  if (isMobile) {
    return;
  }
  showInvitation.value = options;
};

onMounted(() => {
  roomService.conferenceInvitationManager.on(
    TUIConferenceInvitationManagerEvents.onReceiveInvitation,
    onReceiveInvitation
  );
  roomService.conferenceInvitationManager.on(
    TUIConferenceInvitationManagerEvents.onInvitationTimeout,
    onInvitationTimeout
  );
});
onUnmounted(() => {
  roomService.conferenceInvitationManager.off(
    TUIConferenceInvitationManagerEvents.onReceiveInvitation,
    onReceiveInvitation
  );
  roomService.conferenceInvitationManager.off(
    TUIConferenceInvitationManagerEvents.onInvitationTimeout,
    onInvitationTimeout
  );
});
</script>
<style scoped lang="scss">
.invitation-notification-container {
  position: fixed;
  top: 40px;
  right: 20px;
  padding: 20px 30px 10px 20px;
  background-color: var(--white-color);
  border-radius: 15px;

  .invitation-notification-inviter {
    display: flex;
    align-items: center;

    .invitation-notification-title {
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      color: var(--font-color-4);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .avatar {
      width: 30px;
      height: 30px;
      margin-right: 5px;
    }
  }

  .invitation-notification-room-info-container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .invitation-notification-room-text {
      max-width: 20px;
      overflow: hidden;
      font-size: 14px;
      font-weight: 400;
      color: rgba(79, 88, 107, 1);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .invitation-notification-room-text-split {
    display: block;
    width: 1px;
    height: 14px;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .invitation-notification-bottom-split {
    display: block;
    width: 100%;
    height: 1px;
    margin-top: 15px;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .invitation-notification-bottom-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;

    .invitation-notification-bottom {
      font-size: 14px;
      font-weight: 500;
      color: rgba(143, 154, 178, 1);
      cursor: pointer;
    }
  }

  .icon {
    width: 16px;
    height: 16px;
  }

  .invitation-notification-room-name {
    display: block;
    max-width: 300px;
    padding: 5px 0;
    overflow: hidden;
    font-size: 20px;
    font-weight: 500;
    color: rgba(34, 38, 46, 1);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .button-text {
    padding-left: 5px;
  }
}
</style>
