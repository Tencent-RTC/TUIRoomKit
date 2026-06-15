<template>
  <div class="room-edit">
    <div class="edit-form">
      <div class="form-item">
        <div class="form-label">
          {{ t('ScheduleRoomPanel.RoomName') }}
        </div>
        <TUIInput
          v-model="internalForm.roomName"
          :placeholder="t('ScheduleRoomPanel.EnterRoomName')"
          class="form-input"
        />
      </div>

      <div class="form-item">
        <div class="form-label">
          {{ t('ScheduleRoomPanel.StartingTime') }}
        </div>
        <div class="datetime-group">
          <Datepicker v-model="internalForm.startDate" />
          <Timepicker v-model="internalForm.startTime" />
        </div>
      </div>

      <div class="form-item">
        <div class="form-label">
          {{ t('ScheduleRoomPanel.RoomDuration') }}
        </div>
        <DurationSelector v-model="internalForm.duration" />
      </div>

      <div class="form-item">
        <div class="form-label">
          {{ t('ScheduleRoomPanel.TimeZone') }}
        </div>
        <TimezoneSelector v-model="internalForm.timezone" />
      </div>

      <div :class="['form-item', { 'flex-start': internalForm.selectedUserList?.length > 0 }]">
        <div class="form-label">
          {{ t('ScheduleRoomPanel.Participants') }}
        </div>
        <div class="form-participants">
          <TUIInput
            v-model="searchUserId"
            :search="handleUserSearchChange"
            :select="handleSearchResultItemClick"
            :placeholder="t('ScheduleRoomPanel.EnterParticipantNames')"
            :emptyText="t('ScheduleRoomPanel.NoMembersFound')"
          >
            <template #suffix>
              <IconManageMember @click="userPickerVisible = true" />
            </template>
            <template #searchResultItem="{ data }">
              <div class="search-result-item">
                <Avatar
                  class="search-result-item-avatar"
                  :size="20"
                  :src="data.avatarUrl"
                />
                <p class="search-result-item-name" :title="data.label">
                  {{ data.label }}
                </p>
              </div>
            </template>
          </TUIInput>
          <div v-if="internalForm.selectedUserList?.length > 0" class="form-attendees">
            <span
              v-for="user in internalForm.selectedUserList"
              :key="user.key"
              class="form-attendees-item"
            >
              <Avatar
                class="form-attendees-item-avatar"
                :src="user.avatarUrl"
                :size="20"
              />
              <p class="form-attendees-item-name" :title="user.label">
                {{ user.label }}
              </p>
              <IconClose1 class="form-attendees-item-remove" @click="removeSelectUser(user)" />
            </span>
            <span class="form-attendees-item form-attendees-count">
              {{ `${internalForm.selectedUserList?.length || 0} ${t('ScheduleRoomPanel.People')}` }}
            </span>
          </div>
        </div>
        <TUIDialog
          v-model:visible="userPickerVisible"
          :cancel-text="t('ScheduleRoomPanel.Cancel')"
          :confirm-text="t('ScheduleRoomPanel.Confirm')"
          :title="t('ScheduleRoomPanel.Contacts')"
        >
          <UserPicker
            ref="userPickerRef"
            class="room-user-picker"
            :data-source="userPickerData"
            :defaultSelectedItems="internalForm.selectedUserList"
            display-mode="list"
          />
          <template #footer>
            <div class="user-picker-footer">
              <TUIButton @click="userPickerVisible = false">
                {{ t('ScheduleRoomPanel.Cancel') }}
              </TUIButton>
              <TUIButton type="primary" @click="handleUserPickerConfirm">
                {{ t('ScheduleRoomPanel.Confirm') }}
              </TUIButton>
            </div>
          </template>
        </TUIDialog>
      </div>
    </div>

    <div class="form-actions">
      <TUIButton
        type="default"
        @click="handleCancel"
      >
        {{ t('ScheduleRoomPanel.Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        @click="handleSave"
      >
        {{ t('ScheduleRoomPanel.Save') }}
      </TUIButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import {
  TUIButton,
  TUIInput,
  TUIToast,
  TUIDialog,
  IconManageMember,
  IconClose1,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useContactStore, useLoginStore } from 'tuikit-atomicx-vue3/chat';
import { Avatar } from 'tuikit-atomicx-vue3';
import { UserPicker } from 'tuikit-atomicx-vue3';
import Datepicker from './Datepicker.vue';
import DurationSelector from './DurationSelector.vue';
import Timepicker from './Timepicker.vue';
import TimezoneSelector from './TimezoneSelector.vue';
import { convertTimezoneToUTC, convertTimeBetweenTimezones } from './utils';
import type { EditFormData } from './type';
import type { RoomInfo } from 'tuikit-atomicx-vue3';
import type { UserPickerDataSource, UserPickerRow } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();

interface Props {
  roomInfo: RoomInfo | null;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'save', data: EditFormData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalForm = ref({
  roomName: '',
  startDate: 0,
  startTime: 0,
  duration: 1800,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  selectedUserList: [] as UserPickerDataSource,
});

const { friendList, loadFriends } = useContactStore();
const { loginStatus } = useLoginStore();

// ContactStore is a singleton, but its data must be loaded explicitly after
// login. Trigger the load here so the picker has something to render.
watch(loginStatus, (status) => {
  if (status === 'logined') {
    loadFriends().catch(err => console.error('[RoomEdit loadFriends]', err));
  }
}, { immediate: true });

const userPickerRef = ref();
const userPickerVisible = ref(false);
const searchUserId = ref('');

const userPickerData = computed(() =>
  friendList.value.map(item => ({
    key: item.userID,
    label: item.friendRemark || item.nickname || item.userID,
    avatarUrl: item.avatarURL ?? '',
    extraData: item,
  })),
);

const scheduleStartTime = computed(() => {
  const dateObj = new Date(internalForm.value.startDate * 1000);
  const timeObj = new Date(internalForm.value.startTime * 1000);

  return convertTimezoneToUTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    timeObj.getHours(),
    timeObj.getMinutes(),
    internalForm.value.timezone,
  );
});

const scheduleEndTime = computed(() => scheduleStartTime.value + internalForm.value.duration);

const initializeForm = () => {
  if (!props.roomInfo) {
    return;
  }

  const duration = props.roomInfo.scheduledEndTime && props.roomInfo.scheduledStartTime
    ? props.roomInfo.scheduledEndTime - props.roomInfo.scheduledStartTime
    : 1800;

  const selectedUserList = props.roomInfo.scheduleAttendees?.map(attendee => ({
    key: attendee.userId,
    label: attendee.userName || attendee.userId,
    avatarUrl: attendee.avatarUrl || '',
    extraData: attendee,
  })) || [];

  const startDateTime = new Date((props.roomInfo.scheduledStartTime || 0) * 1000);
  const startDate = new Date(startDateTime);
  startDate.setHours(0, 0, 0, 0);

  internalForm.value = {
    roomName: props.roomInfo.roomName || '',
    startDate: Math.floor(startDate.getTime() / 1000),
    startTime: Math.floor(startDateTime.getTime() / 1000),
    duration,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    selectedUserList,
  };
};

watch(() => props.roomInfo, () => {
  initializeForm();
}, { immediate: true });

watch(() => internalForm.value.timezone, (newTimezone, oldTimezone) => {
  if (newTimezone && oldTimezone && newTimezone !== oldTimezone) {
    const convertedTime = convertTimeBetweenTimezones(
      internalForm.value.startDate,
      internalForm.value.startTime,
      oldTimezone,
      newTimezone,
    );

    internalForm.value.startDate = convertedTime.startDate;
    internalForm.value.startTime = convertedTime.startTime;
  }
});

const validateForm = (): boolean => {
  if (!internalForm.value.roomName.trim()) {
    TUIToast.error({ message: t('ScheduleRoomPanel.RoomNameRequired') });
    return false;
  }

  const currentUtcTimestamp = Math.floor(Date.now() / 1000);

  if (scheduleStartTime.value <= currentUtcTimestamp) {
    TUIToast.error({ message: t('ScheduleRoomPanel.StartTimeInvalid') });
    return false;
  }

  return true;
};

const handleUserSearchChange = (value: string) => userPickerData.value
  .filter((item) => {
    // Filter by search value
    if (!item.label.includes(value)) {
      return false;
    }
    // Filter out already selected users
    return !internalForm.value.selectedUserList.some(selected => selected.key === item.key);
  })
  .map(item => ({
    label: item.label,
    value: item.key,
    avatarUrl: item.extraData.avatarURL,
    extraData: item.extraData,
  }));

const handleSearchResultItemClick = (data: { label?: string; value: string | number; [key: string]: unknown }) => {
  // Type guard to ensure required properties exist
  const avatarUrl = data.avatarUrl as string | undefined;
  const extraData = data.extraData as unknown;
  if (!data.label || !data.value || !extraData) {
    return;
  }

  const userRow: UserPickerRow = {
    key: String(data.value),
    label: data.label,
    avatarUrl,
    extraData,
  };

  if (internalForm.value.selectedUserList.some(item => item.key === userRow.key)) {
    return;
  }

  internalForm.value.selectedUserList = [...internalForm.value.selectedUserList, userRow];
  searchUserId.value = '';
};

const handleUserPickerConfirm = () => {
  internalForm.value.selectedUserList = userPickerRef.value.getSelectedItems();
  userPickerVisible.value = false;
};

const removeSelectUser = (user: UserPickerRow) => {
  internalForm.value.selectedUserList = internalForm.value.selectedUserList.filter(item => item.key !== user.key);
};

const handleCancel = () => {
  emit('cancel');
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }

  const saveData: EditFormData = {
    roomId: props.roomInfo?.roomId || '',
    roomName: internalForm.value.roomName,
    scheduleStartTime: scheduleStartTime.value,
    scheduleEndTime: scheduleEndTime.value,
    scheduleAttendees: internalForm.value.selectedUserList.map(user => user.key),
  };

  emit('save', saveData);
};
</script>

<style lang="scss" scoped>
.room-edit {
  width: 100%;
  text-align: initial;

  .edit-form {
    .form-item {
      display: flex;
      align-items: center;
      margin-bottom: 20px;

      .form-label {
        min-width: 80px;
        color: var(--text-color-secondary);
        font-size: 14px;
        margin-right: 16px;
      }

      .form-input,
      .form-select {
        width: 100%;
        flex: 1;
      }

      .datetime-group {
        display: flex;
        gap: 8px;
        width: 100%;
        flex: 1;
      }

      &.flex-start {
        align-items: flex-start;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color-light);
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

.form-participants {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;

  &-avatar {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &-name {
    flex: 1;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.form-attendees {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  max-height: 100px;
  margin-top: 6px;
  overflow: hidden;

  &:hover {
    overflow: auto;
  }

  &-item {
    box-sizing: border-box;
    display: flex;
    flex-basis: calc(33.3333% - 2px);
    align-items: center;
    padding: 2px 8px;
    overflow: hidden;
    background-color: var(--bg-color-bubble-own);
    border-radius: 4px;

    &-avatar {
      width: 20px;
      height: 20px;
      margin-right: 6px;
      flex-shrink: 0;
    }

    &-name {
      flex: 1;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-remove {
      margin-left: auto;
      color: var(--uikit-color-gray-7);
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  &-count {
    flex-basis: content;
  }
}
</style>
