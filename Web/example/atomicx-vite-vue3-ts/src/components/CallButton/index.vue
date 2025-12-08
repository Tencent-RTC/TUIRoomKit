<template>
  <div>
    <Dropdown
      trigger="click"
      placement="top"
      :teleported="false"
      :hideOnClick="false"
    >
      <IconButton :title="t('Invite.Title')">
        <IconInvite :size="24" />
      </IconButton>
      <template #dropdown>
        <div class="operate-list">
          <div class="operate-item" @click="userPickerVisible = true">
            <IconInvite :size="18" />
            <span class="operate-item-text">{{ t('Invite.AddMember') }}</span>
          </div>
          <div class="operate-item" @click="roomShareVisible = true">
            <IconShare :size="18" />
            <span class="operate-item-text">{{ t('Invite.ShareRoom') }}</span>
          </div>
        </div>
      </template>
    </Dropdown>

    <TUIDialog
      v-model:visible="userPickerVisible"
      append-to="body"
      :title="t('Contacts')"
    >
      <UserPicker
        ref="userPickerRef"
        class="room-user-picker"
        :data-source="userPickerData"
        display-mode="list"
      />
      <template #footer>
        <div class="user-picker-footer">
          <TUIButton @click="userPickerVisible = false">
            {{ t('Room.Cancel') }}
          </TUIButton>
          <TUIButton type="primary" @click="handleUserPickerConfirm">
            {{ t('Room.Confirm') }}
          </TUIButton>
        </div>
      </template>
    </TUIDialog>

    <TUIDialog
      v-model:visible="roomShareVisible"
      append-to="body"
      :title="t('Room.InviteToMeeting', { userName: loginUserInfo?.userName || loginUserInfo?.userId })"
      :custom-classes="['room-share-dialog']"
    >
      <RoomShare :room-info="currentRoom" />
      <template #footer>
        <div />
      </template>
    </TUIDialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { Dropdown, IconInvite, IconShare, TUIButton, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from 'tuikit-atomicx-vue3/chat';
import { UserPicker, useLoginState, useRoomParticipantState, useRoomState, RoomParticipantStatus } from 'tuikit-atomicx-vue3/room';
import { useRoute } from 'vue-router';
import IconButton from '../base/IconButton.vue';
import RoomShare from './RoomShare.vue';

const route = useRoute();
const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { currentRoom, callUserToRoom } = useRoomState();
const { participantList, pendingParticipantList } = useRoomParticipantState();
const { friendList } = useContactListState();

const userPickerRef = ref();
const userPickerVisible = ref(false);
const roomShareVisible = ref(false);

const userPickerData = computed(() => friendList.value
  .filter(item => !participantList.value.some(participant => participant.userId === item.userID))
  .filter(item => !pendingParticipantList.value.some(user => user.userId === item.userID && user.roomStatus === RoomParticipantStatus.InCalling))
  .map(item => ({
    key: item.userID,
    label: item.nick,
    avatarUrl: item.avatar,
    extraData: item,
  })));

const handleUserPickerConfirm = async () => {
  try {
    const selectedUsers = userPickerRef.value.getSelectedItems();
    if (selectedUsers.length === 0) {
      TUIToast.error({ message: t('Invite.PleaseSelectUser') });
      return;
    }
    await callUserToRoom({
      roomId: route.query.roomId as string,
      userIdList: selectedUsers.map((item: any) => item.key),
      timeout: 60,
    });
    userPickerVisible.value = false;
    TUIToast.success({ message: t('Invite.InviteSuccess') });
  } catch (error) {
    console.error('Failed to invite users to room:', error);
    TUIToast.error({ message: t('Invite.InviteFailed') });
  }
};
</script>

<style lang="scss" scoped>
.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  gap: 4px;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;

  .control-title {
    text-align: center;
    font-family: "PingFang SC";
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
}

.operate-list {
  display: flex;
  align-items: center;
  flex-direction: column;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-color-primary);

  .operate-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 6px;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;

    .operate-item-text {
      flex: 1;
      min-width: 0;
    }
  }
}

.room-user-picker {
  height: 400px;
  width: 600px;
}

.user-picker-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
