<template>
  <div class="schedule-room-panel">
    <div class="panel-content">
      <form class="form" @submit.prevent>
        <div class="form-item">
          <label class="label">{{ t('ScheduleRoomPanel.RoomName') }}</label>
          <TUIInput
            v-model="formData.roomName"
            :max-length="25"
            :placeholder="t('ScheduleRoomPanel.EnterRoomName')"
          />
        </div>

        <div class="form-item">
          <label class="label">{{ t('ScheduleRoomPanel.StartingTime') }}</label>
          <div class="datetime-group">
            <Datepicker v-model="formData.startDate" />
            <Timepicker v-model="formData.startTime" />
          </div>
        </div>

        <div class="form-item">
          <label class="label">{{ t('ScheduleRoomPanel.RoomDuration') }}</label>
          <DurationSelector v-model="formData.duration" />
        </div>

        <div class="form-item">
          <label class="label">{{ t('ScheduleRoomPanel.TimeZone') }}</label>
          <TimezoneSelector v-model="formData.timezone" />
        </div>

        <div :class="['form-item', { 'flex-start': formData.selectedUserList?.length > 0 }]">
          <label class="label">{{ t('ScheduleRoomPanel.Participants') }}</label>
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
            <div v-if="formData.selectedUserList?.length > 0" class="form-attendees">
              <span
                v-for="user in formData.selectedUserList"
                :key="user.key"
                class="form-attendees-item"
              >
                <Avatar
                  class="form-attendees-item-avatar"
                  :size="20"
                  :src="user.avatarUrl"
                />
                <p class="form-attendees-item-name" :title="user.label">
                  {{ user.label }}
                </p>
                <IconClose1 class="form-attendees-item-remove" @click="removeSelectUser(user)" />
              </span>
              <span class="form-attendees-item form-attendees-count">
                {{ `${formData.selectedUserList?.length || 0} ${t('ScheduleRoomPanel.People')}` }}
              </span>
            </div>
          </div>
          <TUIDialog
            v-model:visible="userPickerVisible"
            :title="t('ScheduleRoomPanel.Contacts')"
            :cancel-text="t('ScheduleRoomPanel.Cancel')"
            :confirm-text="t('ScheduleRoomPanel.Confirm')"
          >
            <UserPicker
              ref="userPickerRef"
              class="room-user-picker"
              :data-source="userPickerData"
              :defaultSelectedItems="formData.selectedUserList"
              display-mode="list"
            />
            <template #footer>
              <div class="user-picker-footer">
                <TUIButton @click.prevent="userPickerVisible = false">
                  {{ t('ScheduleRoomPanel.Cancel') }}
                </TUIButton>
                <TUIButton type="primary" @click.prevent="handleUserPickerConfirm">
                  {{ t('ScheduleRoomPanel.Confirm') }}
                </TUIButton>
              </div>
            </template>
          </TUIDialog>
        </div>

        <div class="form-item flex-start">
          <label class="label">{{ t('ScheduleRoomPanel.Security') }}</label>
          <div class="security-group">
            <label class="checkbox-item">
              <input v-model="formData.hasPassword" type="checkbox">
              <span>{{ t('ScheduleRoomPanel.RoomPassword') }}</span>
            </label>
            <TUIInput
              v-if="formData.hasPassword"
              v-model="formData.password"
              :max-length="6"
              type="number"
              showPassword
              :placeholder="t('ScheduleRoomPanel.Enter6DigitPassword')"
              class="password-input"
            />
          </div>
        </div>

        <div class="form-item flex-start">
          <label class="label">{{ t('ScheduleRoomPanel.MemberManagement') }}</label>
          <div class="member-group">
            <label class="checkbox-item">
              <input v-model="formData.isMicrophoneDisableForAllUser" type="checkbox">
              <span>{{ t('ScheduleRoomPanel.DisableAllAudios') }}</span>
            </label>
            <label class="checkbox-item">
              <input v-model="formData.isCameraDisableForAllUser" type="checkbox">
              <span>{{ t('ScheduleRoomPanel.DisableAllVideos') }}</span>
            </label>
          </div>
        </div>
      </form>
    </div>

    <div class="panel-footer">
      <TUIButton @click="handleCancel">
        {{ t('ScheduleRoomPanel.Cancel') }}
      </TUIButton>
      <TUIButton
        type="primary"
        :loading="isScheduling"
        @click="handleSchedule"
      >
        {{ t('ScheduleRoomPanel.Schedule') }}
      </TUIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import {
  TUIButton,
  TUIInput,
  useUIKit,
  TUIToast,
  IconManageMember,
  TUIDialog,
  IconClose1,
} from '@tencentcloud/uikit-base-component-vue3';
import { useContactStore, useLoginStore } from 'tuikit-atomicx-vue3/chat';
import { useLoginState } from 'tuikit-atomicx-vue3';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { Avatar } from 'tuikit-atomicx-vue3';
import { useRoomModal } from 'tuikit-atomicx-vue3/room';
import { UserPicker } from 'tuikit-atomicx-vue3';
import Datepicker from './Datepicker.vue';
import DurationSelector from './DurationSelector.vue';
import Timepicker from './Timepicker.vue';
import TimezoneSelector from './TimezoneSelector.vue';
import { getCurrentTimeInTimezone, getNext15MinuteInterval, convertTimezoneToUTC, convertTimeBetweenTimezones } from './utils';
import type { ScheduleRoomOptions } from 'tuikit-atomicx-vue3';
import type { UserPickerRow, UserPickerResultItem } from 'tuikit-atomicx-vue3/room';

interface Props {
  visible?: boolean;
  userName?: string;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'confirm', roomId: string, scheduleOptions: ScheduleRoomOptions): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  userName: '',
});

const emit = defineEmits<Emits>();

const { t } = useUIKit();
const { loginUserInfo } = useLoginState();
const { scheduleRoom, getRoomInfo } = useRoomState();
const { friendList, loadFriends } = useContactStore();
const { loginStatus } = useLoginStore();
const { handleErrorWithModal } = useRoomModal();

// ContactStore is a singleton; kick off loading once login completes so the
// participant picker has fresh data.
watch(loginStatus, (status) => {
  if (status === 'logined') {
    loadFriends().catch(err => console.error('[ScheduleRoomPanel loadFriends]', err));
  }
}, { immediate: true });

const formData = ref({
  roomName: '',
  startDate: 0,
  startTime: 0,
  duration: 1800,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hasPassword: false,
  password: '',
  isCameraDisableForAllUser: false,
  isMicrophoneDisableForAllUser: false,
  scheduleAttendees: '',
  selectedUserList: [] as UserPickerRow[],
});

const userPickerRef = ref();
const userPickerVisible = ref(false);
const searchUserId = ref('');
const isScheduling = ref(false);

const userPickerData = computed(() =>
  friendList.value.map(item => ({
    key: item.userID,
    label: item.friendRemark || item.nickname || item.userID,
    avatarUrl: item.avatarURL ?? '',
    extraData: item,
  })),
);

const scheduleStartTime = computed(() => {
  const dateObj = new Date(formData.value.startDate * 1000);
  const timeObj = new Date(formData.value.startTime * 1000);

  return convertTimezoneToUTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    timeObj.getHours(),
    timeObj.getMinutes(),
    formData.value.timezone,
  );
});

const scheduleEndTime = computed(() => scheduleStartTime.value + formData.value.duration);

const validateForm = (): string | null => {
  const { roomName, hasPassword, password } = formData.value;

  if (!roomName.trim()) {
    return t('ScheduleRoomPanel.RoomNameRequired');
  }

  const now = new Date();
  const currentUtcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    0,
  ));
  const currentUtcTimestamp = Math.floor(currentUtcDate.getTime() / 1000);

  if (scheduleStartTime.value <= currentUtcTimestamp) {
    return t('ScheduleRoomPanel.StartTimeInvalid');
  }

  const MIN_DURATION = 15 * 60;
  const MAX_DURATION = 24 * 3600;
  if (formData.value.duration < MIN_DURATION) {
    return t('ScheduleRoomPanel.DurationMin');
  }
  if (formData.value.duration > MAX_DURATION) {
    return t('ScheduleRoomPanel.DurationMax');
  }

  if (hasPassword) {
    if (!password) {
      return t('ScheduleRoomPanel.PasswordRequired');
    }
    if (!/^\d{6}$/.test(password)) {
      return t('ScheduleRoomPanel.PasswordMust6Digits');
    }
  }

  return null;
};

const initializeForm = () => {
  const currentTimezone = formData.value.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = getCurrentTimeInTimezone(currentTimezone);
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const nextIntervalTime = getNext15MinuteInterval(now);

  formData.value = {
    roomName: `${loginUserInfo.value?.userName || loginUserInfo.value?.userId}${t('ScheduleRoomPanel.TemporaryMeeting')}`,
    startDate: Math.floor(startDate.getTime() / 1000),
    startTime: Math.floor(nextIntervalTime.getTime() / 1000),
    duration: 1800,
    timezone: currentTimezone,
    hasPassword: false,
    password: '',
    isCameraDisableForAllUser: false,
    isMicrophoneDisableForAllUser: false,
    scheduleAttendees: '',
    selectedUserList: [],
  };
};

const checkRoomExist = async (roomId: string) => {
  try {
    await getRoomInfo({ roomId });
  } catch (error: any) {
    if (error.code === TUIErrorCode.ERR_ROOM_ID_NOT_EXIST) {
      return false;
    }
  }
  return true;
};

const generateRoomId = async (): Promise<string> => {
  const roomId = String(Math.floor(Math.random() * 900000) + 100000);
  if (await checkRoomExist(roomId)) {
    return generateRoomId();
  }
  return roomId;
};

const handleSchedule = async () => {
  const validationError = validateForm();
  if (validationError) {
    TUIToast.error({ message: validationError });
    return;
  }

  isScheduling.value = true;

  try {
    const roomId = await generateRoomId();
    const scheduleOptions: ScheduleRoomOptions = {
      roomName: formData.value.roomName,
      scheduleStartTime: scheduleStartTime.value,
      scheduleEndTime: scheduleEndTime.value,
      scheduleAttendees: formData.value.selectedUserList.map(item => item.key),
      password: formData.value.hasPassword ? formData.value.password : '',
      isAllMicrophoneDisabled: formData.value.isMicrophoneDisableForAllUser,
      isAllCameraDisabled: formData.value.isCameraDisableForAllUser,
    };

    await scheduleRoom({ roomId, options: scheduleOptions });
    emit('confirm', roomId, scheduleOptions);
  } catch (error: any) {
    console.error('Schedule meeting failed:', error);
    handleErrorWithModal(error);
    TUIToast.error({ message: t('ScheduleRoomPanel.ScheduleFailed') });
  } finally {
    isScheduling.value = false;
  }
};

const handleCancel = () => emit('cancel');

const handleUserSearchChange = (value: string) => userPickerData.value
  .filter((item) => {
    // Filter by search value
    if (!item.label.includes(value)) {
      return false;
    }
    // Filter out already selected users
    return !formData.value.selectedUserList.some(selected => selected.key === item.key);
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

  if (formData.value.selectedUserList.some(item => item.key === userRow.key)) {
    return;
  }

  formData.value.selectedUserList = [...formData.value.selectedUserList, userRow];
  searchUserId.value = '';
};

const handleUserPickerConfirm = () => {
  const selectedItems: UserPickerResultItem[] = userPickerRef.value.getSelectedItems();
  // Convert UserPickerResultItem[] to UserPickerRow[]
  formData.value.selectedUserList = selectedItems.map((item): UserPickerRow => ({
    key: item.key,
    label: item.label,
    avatarUrl: item.avatarUrl,
    extraData: item.extraData,
  }));
  userPickerVisible.value = false;
};

const removeSelectUser = (user: UserPickerRow) => {
  formData.value.selectedUserList = formData.value.selectedUserList.filter(item => item.key !== user.key);
};

// Generate 6-digit random password when hasPassword is checked
const generateRandomPassword = (): string => Math.floor(100000 + Math.random() * 900000).toString();

watch(() => formData.value.hasPassword, (newValue) => {
  if (newValue) {
    if (!formData.value.password) {
      formData.value.password = generateRandomPassword();
    }
  } else {
    formData.value.password = '';
  }
});

watch(() => formData.value.timezone, (newTimezone, oldTimezone) => {
  if (newTimezone && oldTimezone && newTimezone !== oldTimezone) {
    const convertedTime = convertTimeBetweenTimezones(
      formData.value.startDate,
      formData.value.startTime,
      oldTimezone,
      newTimezone,
    );

    formData.value.startDate = convertedTime.startDate;
    formData.value.startTime = convertedTime.startTime;
  }
});

onMounted(initializeForm);
watch(() => props.visible, (visible) => {
  if (visible) {
    initializeForm();
  }
});
</script>

<style lang="scss" scoped>
.schedule-room-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  height: 100%;
  text-align: initial;
}

.panel-content {
  flex: 1;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-color-secondary);

  .label {
    width: 100px;
    min-width: 100px;
    font-size: 14px;
    font-weight: 400;
  }

  &.flex-start {
    align-items: flex-start;
  }
}

.datetime-group {
  display: flex;
  gap: 8px;
  width: 100%;
}

.security-group,
.member-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    margin: 0;
  }

  span {
    font-size: 14px;
  }
}

.password-input {
  margin-top: 8px;
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
    color: var(--text-color-secondary);

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
      cursor: pointer;
      flex-shrink: 0;
    }
  }

  &-count {
    flex-basis: content;
  }
}

.panel-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  padding: 20px 24px;

  button {
    min-width: 88px;
  }
}
</style>
