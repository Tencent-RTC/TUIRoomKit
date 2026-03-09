<template>
  <div>
    <IconButton
      :title="t('RaiseHands.List')"
      @click="handleClick"
    >
      <Badge :value="unreadCount" :hidden="!unreadCount">
        <IconApplyManage :size="24" />
      </Badge>
    </IconButton>

    <TUIDialog
      v-model:visible="dialogVisible"
      :title="t('RaiseHands.List')"
      :custom-classes="['raise-hands-list-dialog']"
      appendTo="#roomPage"
    >
      <div class="pending-device-invitations">
        <div v-if="pendingDeviceApplications.length === 0" class="pending-device-invitation-empty">
          <span>{{ t('RaiseHands.Empty') }}</span>
        </div>
        <div
          v-for="invitation in pendingDeviceApplications"
          :key="invitation.timestamp"
          class="pending-device-invitation"
        >
          <div class="user-info">
            <Avatar :src="invitation.senderAvatarUrl" :size="40" />
            <span class="user-name">{{ invitation.senderUserName || invitation.senderUserId }}</span>
          </div>
          <div class="action-area">
            <TUIButton type="primary" @click="handleAccept(invitation)">
              {{ t('RaiseHands.Agree') }}
            </TUIButton>
            <TUIButton @click="handleReject(invitation)">
              {{ t('RaiseHands.Reject') }}
            </TUIButton>
          </div>
        </div>
      </div>
      <template #footer>
        <div />
      </template>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Badge, IconApplyManage, TUIButton, TUIDialog, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, DeviceRequestInfo, useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';

const { t } = useUIKit();

const {
  pendingDeviceApplications,
  approveOpenDeviceRequest,
  rejectOpenDeviceRequest,
  promoteToParticipant,
} = useRoomParticipantState();

const unreadCount = computed(() => pendingDeviceApplications.value.length);

const dialogVisible = ref(false);

const handleClick = () => {
  dialogVisible.value = true;
};

const handleAccept = (invitation: DeviceRequestInfo) => {
  approveOpenDeviceRequest({ device: invitation.deviceType, userId: invitation.senderUserId });
  promoteToParticipant({ userId: invitation.senderUserId });
};

const handleReject = (invitation: DeviceRequestInfo) => {
  rejectOpenDeviceRequest({ device: invitation.deviceType, userId: invitation.senderUserId });
};

</script>

<style lang="scss">
.raise-hands-list-dialog {
  width: 540px;
  max-height: 600px;
  min-height: 300px;
}

.pending-device-invitation-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 14px;
  color: var(--text-color-secondary);
  padding: 20px;
}
.pending-device-invitations {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 10px;
  overflow: auto;

  .pending-device-invitation {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;

    .user-info {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      flex: 1;
      overflow: hidden;

      .user-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .action-area {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
