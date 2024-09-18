<template>
  <div class="member-invite-container">
    <div class="member-invite-item">
      <Avatar class="avatar-url" :img-src="userInfo.avatarUrl" />
      <div class="user-name">{{ userInfo.userId || userInfo.userName }}</div>
    </div>
    <span class="member-invite-reject" v-if="showReject">{{
      t('Not joining for now')
    }}</span>
    <span
      class="member-invite-calling"
      v-if="userInfo.status === TUIInvitationStatus.kPending"
    >
      {{ t('Calling...') }}
    </span>
    <tui-button v-else class="button" size="default" @click="handleInvite">
      {{ t('Call') }}
    </tui-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps } from 'vue';
import { UserInfo } from '../../../stores/room';
import Avatar from '../../common/Avatar.vue';
import TuiButton from '../../common/base/Button.vue';
import { useI18n } from '../../../locales';
import { roomService, TUIInvitationStatus } from '../../../services';
import TUIMessage from '../../common/base/Message/index';
import { MESSAGE_DURATION } from '../../../constants/message';
const { t } = useI18n();

interface Props {
  userInfo: UserInfo;
}

const showReject = ref(false);

const handleInvite = () => {
  roomService.conferenceInvitationManager.inviteUsers({
    userIdList: [props.userInfo.userId],
  });
  TUIMessage({
    type: 'success',
    message: t('Invitation sent, waiting for members to join.'),
    duration: MESSAGE_DURATION.NORMAL,
  });
};

const props = defineProps<Props>();

watch(props.userInfo, val => {
  if (val.status === TUIInvitationStatus.kRejected) {
    showReject.value = true;
    setTimeout(() => {
      showReject.value = false;
    }, 3000);
  }
});
</script>

<style lang="scss" scoped>
.member-invite-container {
  display: flex;
  width: 100%;

  .member-invite-item {
    display: flex;
    flex: 1;
    align-items: center;
  }

  .avatar-url {
    display: flex;
    align-items: center;
    width: 32px;
    height: 32px;
  }

  .member-invite-reject {
    display: flex;
    align-self: center;
    padding-right: 10px;
    font-size: 14px;
    font-weight: 400;
    color: var(--font-color-1);
  }

  .member-invite-calling {
    display: flex;
    align-items: center;
    padding-right: 10px;
    font-size: 14px;
    font-weight: 400;
    color: var(--font-color-1);
  }

  .button {
    width: 68px;
  }

  .user-name {
    max-width: 100px;
    margin-left: 12px;
    overflow: hidden;
    font-size: 14px;
    font-weight: 400;
    line-height: 22px;
    color: var(--font-color-1);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
