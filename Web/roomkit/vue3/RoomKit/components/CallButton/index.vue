<template>
  <div>
    <div
      v-click-outside="closeMenu"
      class="invite-button-wrapper"
    >
      <IconButton :title="t('Invite.Title')" @click-icon="toggleMenu">
        <IconInvite :size="24" />
      </IconButton>
      <transition name="menu-fade">
        <div
          v-show="showMenu"
          class="dropdown-menu"
          @click.stop
        >
          <div class="operate-list">
            <button
              class="operate-item"
              type="button"
              @click="handleOpenUserPicker"
            >
              <IconInvite :size="16" />
              <span class="operate-item-text">{{ t('Invite.AddMember') }}</span>
            </button>
            <button
              class="operate-item"
              type="button"
              @click="handleOpenRoomShare"
            >
              <IconShare :size="16" />
              <span class="operate-item-text">{{ t('Invite.ShareRoom') }}</span>
            </button>
          </div>
        </div>
      </transition>
    </div>

    <TUIDialog
      v-model:visible="userPickerVisible"
      appendTo="#roomPage"
      :title="`${t('Contacts')} (${userPickerData.length})`"
    >
      <UserPicker
        v-if="userPickerVisible"
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
      appendTo="#roomPage"
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
import { computed, nextTick, ref, watch } from 'vue';
import { IconInvite, IconShare, TUIButton, TUIDialog, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useContactListState } from 'tuikit-atomicx-vue3/chat';
import { UserPicker, useLoginState, useRoomParticipantState, useRoomState, RoomParticipantStatus } from 'tuikit-atomicx-vue3/room';
import { conference } from '../../adapter/conference';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';
import RoomShare from './RoomShare.vue';
import type { RoomUser } from 'tuikit-atomicx-vue3/room';

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { currentRoom, callUserToRoom } = useRoomState();
const { participantList, pendingParticipantList } = useRoomParticipantState();
const { friendList: defaultFriendList } = useContactListState();

const showMenu = ref(false);
const userPickerRef = ref();
const userPickerVisible = ref(false);
const roomShareVisible = ref(false);
const customContactList = ref<RoomUser[]>([]);

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}

const contactListProvider = computed(() => conference.getFeatureConfig('contactList'));

watch(contactListProvider, async (provider) => {
  if (provider) {
    try {
      customContactList.value = await provider();
    } catch (error) {
      console.warn('Failed to load custom contact list:', error);
    }
  } else {
    customContactList.value = [];
  }
}, { immediate: true });

const friendList = computed(() => {
  if (contactListProvider.value) {
    return customContactList.value.map(item => ({
      userID: item.userId,
      nick: item.userName || '',
      avatar: item.avatarUrl || '',
    }));
  }
  return defaultFriendList.value;
});

const userPickerData = computed(() => friendList.value
  .filter(item => !participantList.value.some(participant => participant.userId === item.userID))
  .filter(item => !pendingParticipantList.value.some(user => user.userId === item.userID && user.roomStatus === RoomParticipantStatus.InCalling))
  .map(item => ({
    key: item.userID,
    label: item.nick,
    avatarUrl: item.avatar,
    extraData: item,
  })));

const openDialogAfterCloseDropdown = async (dialog: 'userPicker' | 'roomShare') => {
  closeMenu();
  await nextTick();
  if (dialog === 'userPicker') {
    userPickerVisible.value = true;
    return;
  }
  roomShareVisible.value = true;
};

const handleOpenUserPicker = async () => {
  await openDialogAfterCloseDropdown('userPicker');
};

const handleOpenRoomShare = async () => {
  await openDialogAfterCloseDropdown('roomShare');
};

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
.invite-button-wrapper {
  position: relative;
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 1000;
  padding: 6px;
  background: var(--bg-color-operate);
  border-radius: 8px;
  box-shadow: 0 4px 16px var(--uikit-color-black-16);
  transform: translateX(-50%);
}

.operate-list {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: max-content;
  color: var(--text-color-primary);
}

.operate-item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 6px;

  &:hover {
    background: var(--button-color-secondary-hover);
  }
}

.operate-item-text {
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
  white-space: nowrap;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
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
