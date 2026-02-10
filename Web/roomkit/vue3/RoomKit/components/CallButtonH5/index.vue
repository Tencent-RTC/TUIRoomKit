<template>
  <IconButtonH5 :title="t('Invite.Title')" @click="isVisible = true">
    <IconInvite :size="24" />
  </IconButtonH5>

  <TUIPopup v-model:visible="isVisible">
    <PopUpArrowDown @click="isVisible = false" />
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
  </TUIPopup>

  <TUIPopup v-model:visible="roomShareVisible">
    <PopUpArrowDown @click="roomShareVisible = false" />
    <div class="room-share-content">
      <div class="room-share-header">
        {{ t('Invite.ShareRoom') }}
      </div>
      <RoomShare :room-info="currentRoom" />
    </div>
  </TUIPopup>

  <TUIPopup
    v-model:visible="userPickerVisible"
    height="90%"
  >
    <div class="user-picker-content">
      <PopUpArrowDown @click="userPickerVisible = false" />

      <div class="user-picker-header">
        {{ `${t('Contacts')} (${userPickerData.length})` }}
      </div>
      <UserPicker
        v-if="userPickerVisible"
        ref="userPickerRef"
        class="room-user-picker"
        :data-source="userPickerData"
        display-mode="list"
      />
      <div class="user-picker-footer">
        <TUIButton type="primary" @click="handleUserPickerConfirm">
          {{ t('Room.Confirm') }}
        </TUIButton>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { IconInvite, IconShare, TUIButton, TUIToast, TUIPopup, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from 'tuikit-atomicx-vue3/chat';
import { useRoomParticipantState, RoomParticipantStatus, UserPicker, useRoomState } from 'tuikit-atomicx-vue3/room';
import IconButtonH5 from '../base/IconButtonH5.vue';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';
import RoomShare from './RoomShare.vue';

const { t } = useUIKit();
const { currentRoom, callUserToRoom } = useRoomState();
const { participantList, pendingParticipantList } = useRoomParticipantState();
const { friendList } = useContactListState();

const isVisible = ref(false);
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
      roomId: currentRoom.value?.roomId,
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
.operate-list {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 400;
  color: var(--text-color-primary);
  -webkit-tap-highlight-color: transparent;

  .operate-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 14px;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;
    border-bottom: 1px solid var(--stroke-color-secondary);

    .operate-item-text {
      flex: 1;
      min-width: 0;
    }
  }
}

.room-share-content {
  display: flex;
  flex-direction: column;
  padding: 12px 16px;

  .room-share-header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
  }
}

.user-picker-content {
  display: flex;
  flex-direction: column;
  height: 100%;

  .user-picker-header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--stroke-color-secondary);
    font-size: 16px;
    font-weight: 600;
    padding: 12px 16px;
  }

  .room-user-picker {
    flex: 1;
    padding: 8px;
  }

  .user-picker-footer {
    display: flex;
    justify-content: flex-end;
    padding: 12px;
  }
}
</style>
