<template>
  <div class="member-invite-container">
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
  justify-content: end;
  width: 100%;

  .member-invite-reject {
    display: flex;
    align-self: center;
    padding-right: 10px;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-primary);
  }

  .member-invite-calling {
    display: flex;
    align-items: center;
    padding-right: 10px;
    font-size: 14px;
    font-weight: 400;
    color: var(--text-color-primary);
  }

  .button {
    width: 68px;
  }
}
</style>
