<template>
  <div>
    <PanelContainer
      :visible="isDialogVisible"
      :title="t(!isEditMode ? t('Schedule') : t('Modify Room'))"
      @input="isDialogVisible = $event"
    >
      <div class="schedule-conference-form">
        <div class="form-items-container">
          <div class="form-item">
            <span class="form-label">{{ t('Room Name') }}</span>
            <TuiInput
              v-model="form.roomName"
              theme="white"
              class="form-value"
              :placeholder="t('please enter the room name')"
              maxlength=""
              :border="false"
            />
          </div>
          <div v-if="!isEditMode" class="form-item">
            <span class="form-label">{{ t('Room type') }}</span>
            <div class="form-value">
              <tui-select
                :value="form.roomMode"
                @input="form.roomMode = $event"
              >
                <tui-option
                  v-for="item in roomTypeList"
                  :key="item.value"
                  :value="item.value"
                  :label="t(item.label)"
                />
              </tui-select>
            </div>
          </div>
          <div class="form-item">
            <span class="form-label">{{ t('Starting time') }}</span>
            <div class="form-value">
              <TuiDatepicker
                class="date-picker"
                :value="form.startDate"
                @input="form.startDate = $event"
              />
              <TuiTimepicker
                :value="form.startTime"
                class="time-picker"
                @input="form.startTime = $event"
              />
            </div>
          </div>
          <div class="form-item">
            <span class="form-label">{{ t('Room duration') }}</span>
            <div class="form-value">
              <TuiDurationTimePicker
                :model-value="form.duration"
                class="select"
                @input="form.duration = $event"
              />
            </div>
          </div>
          <div class="form-item" v-if="!isWeChat">
            <span class="form-label">{{ t('Time zone') }}</span>
            <div class="form-value">
              <TimezonePicker
                :model-value="form.timezone"
                class="select"
                @input="form.timezone = $event"
              />
            </div>
          </div>
          <div class="form-item column">
            <span class="form-label">{{ t('Attendees') }}</span>
            <div class="form-value">
              <TuiInput
                v-model="form.searchUser"
                class="form-input search-user"
                :search="searchScheduleAttend"
                :select="addSelectUser"
                :placeholder="t('Please enter the member name')"
                :border="false"
              >
                <template #suffixIcon>
                  <svg-icon
                    @click="selectScheduleAttends"
                    :icon="ScheduleAttendees"
                    :class="['select-attendees']"
                  />
                </template>
                <template #searchResultItem="{ data }">
                  <div class="form-attendees-item-container">
                    <TuiAvatar
                      class="form-attendees-item-avatar"
                      :img-src="data.profile.avatar"
                    />
                    <p
                      class="form-attendees-item-name"
                      :title="data.profile.nick"
                    >
                      {{ data.profile.nick }}
                    </p>
                  </div>
                </template>
              </TuiInput>
              <div class="form-attendees">
                <span
                  v-for="user in form.scheduleAttendees"
                  :key="user.userId"
                  class="form-attendees-item"
                >
                  <TuiAvatar
                    class="form-attendees-item-avatar"
                    :img-src="user.avatarUrl"
                  />
                  <p class="form-attendees-item-name" :title="user.userName">
                    {{ user.userName }}
                  </p>
                  <CloseIcon
                    class="form-attendees-item-remove"
                    @click="removeSelectUser(user)"
                  />
                </span>
                <span
                  v-if="form.scheduleAttendees?.length > 0"
                  class="form-attendees-item"
                  style="flex-basis: content"
                >
                  {{ `${form.scheduleAttendees.length} ${t('people')}` }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isEditMode" class="form-items-container">
          <div class="form-item">
            <span class="form-label">{{ t('Disable all audios') }}</span>
            <div class="form-value flex-end">
              <TuiSwitch
                theme="white"
                v-model="form.isMicrophoneDisableForAllUser"
              />
            </div>
          </div>
          <div class="form-item">
            <span class="form-label">{{ t('Disable all videos') }}</span>
            <div class="form-value flex-end">
              <TuiSwitch
                theme="white"
                v-model="form.isCameraDisableForAllUser"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="schedule-conference-footer">
        <TuiButton
          v-if="!isEditMode"
          class="footer-button"
          :custom-style="{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '6px',
          }"
          @click="scheduleConference"
        >
          {{ t('Schedule') }}
        </TuiButton>
        <TuiButton
          v-else
          class="footer-button"
          @click="updateConferenceInfo"
          :custom-style="{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '6px',
          }"
          >{{ t('Save') }}
        </TuiButton>
      </div>
    </PanelContainer>
    <Contacts
      :visible="contactsVisible"
      :contacts="contacts"
      :selected-list="scheduleParams.scheduleAttendees"
      @input="contactsVisible = $event"
      @confirm="contactsConfirm"
      :isMobile="true"
    />
    <ActionSheep
      :visible="showRoomInvite"
      @input="showRoomInvite = $event"
      :title="t('Schedule successful, invite members to join')"
    >
      <InvitePanel :shareLinkData="shareLinkData" />
    </ActionSheep>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, computed, nextTick } from 'vue';
import { useI18n } from '../../../locales';
import TuiInput from '../../common/base/Input';
import TuiSelect from '../../common/base/Select';
import TuiOption from '../../common/base/Option';
import TuiButton from '../../common/base/Button.vue';
import TuiAvatar from '../../common/Avatar.vue';
import TuiDatepicker from '../../common/base/Datepicker';
import TuiTimepicker from '../../common/base/Timepicker';
import TuiSwitch from '../../common/base/TuiSwitch.vue';
import TuiDurationTimePicker from '../DurationTimePicker.vue';
import TimezonePicker from '../TimezonePicker.vue';
import Contacts from '../Contacts.vue';
import ScheduleAttendees from '../../common/icons/ScheduleAttendees.vue';
import PanelContainer from '../PanelContainer.vue';
import CloseIcon from '../../common/icons/CloseIcon.vue';
import InvitePanel from '../InvitePanel.vue';
import ActionSheep from '../../common/base/ActionSheep.vue';
import SvgIcon from '../../common/base/SvgIcon.vue';

import { EventType, roomService } from '../../../services';
import {
  TUIUserInfo,
  TUIConferenceInfo,
  TUISeatMode,
  TUIConferenceStatus,
} from '@tencentcloud/tuiroom-engine-js';
import { deepClone, calculateByteLength } from '../../../utils/utils';
import { isWeChat } from '../../../utils/environment';
import {
  getDateAndTime,
  convertToTimestamp,
  calculateEndTime,
} from '../scheduleUtils';

const { t } = useI18n();
const shareLinkData = ref();
interface Props {
  userName?: string;
  visible: boolean;
  conferenceInfo?: TUIConferenceInfo;
}
const props = defineProps<Props>();

const emit = defineEmits(['input']);
const isDialogVisible = ref(false);
const contactsVisible = ref(false);
const showRoomInvite = ref(false);
const needCheck = ref(false);
const isEditMode = computed(() => !!props.conferenceInfo);
const roomId = ref('');
let contacts: any = [];
const { date: startDate, laterTime: startTime } = getDateAndTime(new Date());
const defaultFormData = ref({
  roomName: t('sb temporary room', {
    name: props.userName || roomService.basicStore.userId,
  }),
  roomMode: 'FreeToSpeak',
  startDate,
  startTime,
  duration: 1800,
  timezone: isWeChat
    ? 'Asia/Shanghai'
    : Intl.DateTimeFormat().resolvedOptions().timeZone,
  searchUser: '',
  scheduleAttendees: [],
  isMicrophoneDisableForAllUser: false,
  isScreenShareDisableForAllUser: false,
  isCameraDisableForAllUser: false,
});
const form = ref(deepClone(defaultFormData.value));

const resetData = () => {
  defaultFormData.value.startDate = form.value.startDate;
  defaultFormData.value.startTime = form.value.startTime;
  form.value = Object.assign({}, deepClone(defaultFormData.value));
};
watch(
  () => props.visible,
  async val => {
    isDialogVisible.value = val;
    if (val) {
      form.value.roomName = t('sb temporary room', {
        name: props.userName || roomService.basicStore.userId,
      });
      const { date, laterTime } = getDateAndTime(new Date());
      form.value.startDate = date;
      form.value.startTime = laterTime;
      contacts = await roomService.scheduleConferenceManager.fetchFriendList();
      isEditMode.value &&
        (form.value = Object.assign({}, deepClone(editParams.value)));
    }
  },
  {
    immediate: true,
  }
);
const updateDialogVisible = (val: boolean) => {
  needCheck.value = val;
  emit('input', val);
  if (!val) {
    resetData();
  }
};
watch(
  isDialogVisible,
  val => {
    updateDialogVisible(val);
  },
  { immediate: true }
);
const editParams = computed(() => {
  if (!props.conferenceInfo) return {};
  const {
    basicRoomInfo,
    scheduleAttendees,
    scheduleStartTime,
    scheduleEndTime,
  } = props.conferenceInfo;
  const { date, time } = getDateAndTime(new Date(scheduleStartTime * 1000));
  const {
    roomName,
    isSeatEnabled,
    isMicrophoneDisableForAllUser,
    isScreenShareDisableForAllUser,
    isCameraDisableForAllUser,
  } = basicRoomInfo;
  return {
    roomName,
    roomMode: isSeatEnabled ? 'SpeakAfterTakingSeat' : 'FreeToSpeak',
    startDate: date,
    startTime: time,
    duration: scheduleEndTime - scheduleStartTime,
    timezone: isWeChat
      ? 'Asia/Shanghai'
      : Intl.DateTimeFormat().resolvedOptions().timeZone,
    searchUser: '',
    scheduleAttendees,
    isMicrophoneDisableForAllUser,
    isScreenShareDisableForAllUser,
    isCameraDisableForAllUser,
  };
});

const scheduleParams = computed(() => {
  const { startDate, startTime, timezone, duration, scheduleAttendees } =
    form.value;
  const scheduleStartTime = convertToTimestamp(startDate, startTime, timezone);
  const scheduleEndTime = calculateEndTime(scheduleStartTime, duration);
  return {
    roomId: roomId.value,
    scheduleStartTime: scheduleStartTime / 1000,
    scheduleEndTime: scheduleEndTime / 1000,
    scheduleAttendees,
    roomName: form.value.roomName,
    isSeatEnabled: form.value.roomMode !== 'FreeToSpeak',
    seatMode:
      form.value.roomMode === 'SpeakAfterTakingSeat'
        ? TUISeatMode.kApplyToTake
        : undefined,
    isMicrophoneDisableForAllUser: form.value.isMicrophoneDisableForAllUser,
    isScreenShareDisableForAllUser: form.value.isScreenShareDisableForAllUser,
    isCameraDisableForAllUser: form.value.isCameraDisableForAllUser,
  };
});

const timeCheck = () => {
  if (!needCheck.value) return true;
  const { timezone, startDate, startTime } = form.value;
  const scheduleStartTime = convertToTimestamp(startDate, startTime, timezone);

  const currentDate = new Date();
  currentDate.setMilliseconds(0);
  currentDate.setSeconds(0);
  const currentTime = currentDate.getTime();

  const result = scheduleStartTime >= currentTime;
  !result &&
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'warning',
      message: t('The start time cannot be earlier than the current time'),
    });
  return result;
};
const roomNameCheck = () => {
  if (!needCheck.value) return true;
  if (form.value.roomName === '') {
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'warning',
      message: t('The room name cannot be empty'),
    });
    return false;
  }
  const result = calculateByteLength(form.value.roomName) <= 100;
  !result &&
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'warning',
      message: t('The room name cannot exceed 100 characters'),
    });
  return result;
};
const roomStatusCheck = () => {
  if (!needCheck.value) return true;
  const isNotStarted =
    props.conferenceInfo?.status ===
    TUIConferenceStatus.kConferenceStatusNotStarted;
  !isNotStarted &&
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'warning',
      message: t(
        'The meeting is in progress and any meeting information cannot be modified'
      ),
    });
  return isNotStarted;
};

watch(
  () => form.value.startTime,
  async (newValue, oldValue) => {
    if (!timeCheck()) {
      await nextTick();
      form.value.startTime = oldValue;
    }
  }
);

watch(
  () => form.value.startDate,
  async (newValue, oldValue) => {
    if (!timeCheck()) {
      await nextTick();
      form.value.startDate = oldValue;
    }
  }
);

watch(
  () => form.value.timezone,
  async (newValue, oldValue) => {
    const { startDate, startTime } = form.value;
    const currentDate = new Date(
      convertToTimestamp(startDate, startTime, newValue, -1, oldValue)
    );
    const { date, laterTime } = getDateAndTime(currentDate);
    form.value.startDate = date;
    form.value.startTime = laterTime;
  }
);

const roomTypeList = [
  { label: 'Free Speech Room', value: 'FreeToSpeak' },
  { label: 'On-stage Speaking Room', value: 'SpeakAfterTakingSeat' },
];

const selectScheduleAttends = () => {
  contactsVisible.value = true;
};
const searchScheduleAttend = (v: string) => {
  if (!v) return [];
  return contacts.filter(
    (user: any) => user?.profile.nick.includes(v) || user?.userID.includes(v)
  );
};
const addSelectUser = (user: any) => {
  form.value.searchUser = '';
  if (
    form.value.scheduleAttendees.findIndex(
      (item: TUIUserInfo) => item.userId === user.userID
    ) !== -1
  )
    return;
  form.value.scheduleAttendees.push({
    userId: user.userID,
    userName: user.profile?.nick,
    avatarUrl: user.profile?.avatar,
  });
};

const removeSelectUser = (user: TUIUserInfo) => {
  form.value.scheduleAttendees = form.value.scheduleAttendees.filter(
    (item: TUIUserInfo) => item.userId !== user.userId
  );
};

const contactsConfirm = (contacts: TUIUserInfo[]) => {
  form.value.scheduleAttendees = contacts;
};

const scheduleConference = async () => {
  if (!timeCheck()) return;
  if (!roomNameCheck()) return;
  roomId.value = String(Math.ceil(Math.random() * 1000000));
  try {
    await roomService.scheduleConferenceManager.scheduleConference({
      ...scheduleParams.value,
      roomId: roomId.value,
    });
    const userIdList = scheduleParams.value.scheduleAttendees.map(
      (item: TUIUserInfo) => item.userId
    );
    if (userIdList && userIdList.length > 0) {
      await roomService.scheduleConferenceManager.addAttendeesByAdmin({
        roomId: roomId.value,
        userIdList,
      });
    }
    shareLinkData.value = deepClone(scheduleParams.value);
    updateDialogVisible(false);
    showRoomInvite.value = true;
  } catch (err: any) {
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'error',
      message: err.message,
    });
  }
};
const compareArrays = (oldArray: any[], newArray: any[], key: string) => {
  const added: any[] = [];
  const removed: any[] = [];

  const newKeySet = new Set(newArray.map(item => item[key]));
  const oldKeySet = new Set(oldArray.map(item => item[key]));

  // Find added elements
  newArray.forEach(item => {
    if (!oldKeySet.has(item[key])) {
      added.push(item);
    }
  });

  // Find removed elements
  oldArray.forEach(item => {
    if (!newKeySet.has(item[key])) {
      removed.push(item);
    }
  });

  return {
    added,
    removed,
  };
};
const updateConferenceInfo = async () => {
  if (!roomStatusCheck()) return;
  if (!timeCheck()) return;
  if (!roomNameCheck()) return;
  try {
    const roomId = props.conferenceInfo?.basicRoomInfo.roomId;
    if (!roomId) return;
    const { roomName, scheduleStartTime, scheduleEndTime, scheduleAttendees } =
      scheduleParams.value;
    await roomService.scheduleConferenceManager.updateConferenceInfo({
      roomId,
      roomName,
      scheduleStartTime,
      scheduleEndTime,
    });
    const compareResult = compareArrays(
      props.conferenceInfo.scheduleAttendees,
      scheduleAttendees,
      'userId'
    );
    await Promise.all([
      compareResult.added.length > 0 &&
        roomService.scheduleConferenceManager.addAttendeesByAdmin({
          roomId,
          userIdList: compareResult.added.map(item => item.userId),
        }),
      compareResult.removed.length > 0 &&
        roomService.scheduleConferenceManager.removeAttendeesByAdmin({
          roomId,
          userIdList: compareResult.removed.map(item => item.userId),
        }),
    ]);
    updateDialogVisible(false);
  } catch (err: any) {
    roomService.emit(EventType.ROOM_NOTICE_MESSAGE, {
      type: 'error',
      message: err.message,
    });
  }
};
</script>

<style lang="scss" scoped>
.schedule-conference-form {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .form-items-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 5%;
    background-color: #fff;
    border-radius: 8px;
  }

  .form-item {
    display: flex;
    align-items: center;

    .form-label {
      display: inline-block;
      width: 100px;
      min-width: 100px;
      font-size: 14px;
      font-weight: 400;
      color: #4f586b;
    }

    .form-value {
      display: flex;
      align-items: center;
      width: 100%;
      height: 42px;
      overflow: auto;
      font-size: 14px;
      font-weight: 400;
      line-height: 42px;
      color: #0f1014;

      .search-user {
        height: 42px;
      }

      .form-input {
        width: 100%;
      }

      .checkbox-group {
        display: flex;
        flex-direction: column;

        &-item {
          max-width: 145px;
        }

        &-item:hover {
          color: #409eff;
        }
      }

      .select {
        width: 100%;
      }

      .date-picker {
        width: 210px;
      }

      .time-picker {
        width: 110px;
      }

      .select-attendees {
        cursor: pointer;
      }

      .select-attendees:hover {
        color: var(--active-color-1);
      }

      .select-search-result-item {
        display: inline-block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .form-attendees {
        display: flex;
        flex-wrap: wrap;
        gap: 2px;
        justify-content: flex-start;
        width: 100%;
        max-height: 100px;
        margin-top: 6px;
        overflow: auto;
        line-height: normal;

        &-item {
          box-sizing: border-box;
          display: flex;
          flex-basis: calc(33.3333% - 2px);
          align-items: center;
          padding: 2px 8px;
          overflow: hidden;
          line-height: normal;
          background-color: #e3f0fd;
          border-radius: 4px;

          &-container {
            display: flex;
            align-items: center;
          }

          &-avatar {
            width: 20px;
            min-width: 20px;
            height: 20px;
            min-height: 20px;
            margin-right: 6px;
          }

          &-name {
            display: inline;
            width: 100%;
            margin: initial;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          &-remove {
            margin-left: auto;
            color: #b3acac;
            cursor: pointer;
          }
        }
      }

      .form-attendees:hover {
        overflow: auto;
      }
    }

    .form-value.flex-end {
      justify-content: flex-end;
    }
  }

  .form-item.column {
    align-items: flex-start;

    .form-label {
      height: 42px;
      line-height: 42px;
    }

    .form-value {
      display: flex;
      flex-direction: column;
      height: auto;
    }
  }
}

.schedule-conference-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  width: 100%;

  .footer-button {
    width: 100%;
    margin-top: 10px;
    border-radius: 6px;
  }
}

.invite-member {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .invite-member-title {
    color: #4f586b;
  }

  .invite-member-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 16px;
    margin-top: 8px;
    color: #0f1014;
    background: #f9fafc;
    border: 1px solid #e4e8ee;
    border-radius: 8px;

    .copy {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
  }
}
</style>
