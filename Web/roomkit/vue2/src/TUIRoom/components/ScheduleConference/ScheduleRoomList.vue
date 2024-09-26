<template>
  <div
    v-show="props.isShowScheduledConference"
    id="scheduleRoomContainer"
    :class="[
      'schedule-room',
      !isMobile ? 'schedule-room-pc' : 'schedule-room-h5',
    ]"
  >
    <div class="schedule-loading" v-if="isShowLoading">
      <svg-icon :icon="LoadingScheduleIcon" class="loading" />
      <span class="text">{{ t('Schedule room loading') }}</span>
    </div>
    <template v-else>
      <div v-if="scheduleRoomList.length > 0" class="schedule-room-container">
        <div
          v-for="item in scheduleContentList"
          :key="item.basicRoomInfo.roomId"
        >
          <div v-if="item.showTimestamp" class="schedule-room-date">
            <svg-icon class="date" :icon="CalendarIcon" />
            <span>{{ getScheduleDate(item.scheduleStartTime) }}</span>
          </div>
          <ScheduleRoomControl
            :item="item"
            :schedule-start-date="getScheduleDate(item.scheduleStartTime)"
            :schedule-end-date="getScheduleDate(item.scheduleEndTime)"
            :schedule-start-time="getScheduleTime(item.scheduleStartTime)"
            :schedule-end-time="getScheduleTime(item.scheduleEndTime)"
            @join-conference="joinConference"
            @show-more="handleShowMore"
          />
        </div>
      </div>
      <div v-else class="schedule-no-body">
        <svg-icon :icon="ApplyStageLabelIcon" />
        <span class="text">{{ t('No room available for booking') }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  defineEmits,
  defineProps,
  withDefaults,
} from 'vue';
import { EventType, roomService } from '../../services';
import SvgIcon from '../common/base/SvgIcon.vue';
import CalendarIcon from '../common/icons/CalendarIcon.vue';
import ApplyStageLabelIcon from '../common/icons/ApplyStageLabelIcon.vue';
import ScheduleRoomControl from './ScheduleRoomControl.vue';
import LoadingScheduleIcon from '../common/icons/LoadingScheduleIcon.vue';
import { useI18n } from '../../locales';
import {
  TUIConferenceInfo,
  TUIConferenceListManagerEvents,
  TUIConferenceModifyInfo,
  TUIConferenceStatus,
} from '@tencentcloud/tuiroom-engine-js';
import { isMobile } from '../../utils/environment';
import { objectMerge } from '../../utils/utils.ts';

const { t } = useI18n();
const scheduleRoomList = ref<TUIConferenceInfo[]>([]);

interface JoinParams {
  roomId: string;
  roomParam?: {
    isOpenCamera?: boolean;
    isOpenMicrophone?: boolean;
  };
}

const emit = defineEmits<{
  (e: 'join-conference', options: JoinParams): void;
}>();
const isShowLoading = ref(true);
const joinConference = (options: JoinParams) => {
  emit('join-conference', options);
};

const props = withDefaults(
  defineProps<{
    isShowScheduledConference?: boolean;
  }>(),
  {
    isShowScheduledConference: true,
  }
);

function sortScheduleRoomList() {
  return scheduleRoomList.value.sort(
    (a, b) => a.scheduleStartTime - b.scheduleStartTime
  );
}
const sortedScheduleRoomList = computed(() => sortScheduleRoomList());

const fetchScheduledData = async (cursor = '', result: any[] = []) => {
  const res =
    await roomService.scheduleConferenceManager.fetchScheduledConferenceList({
      cursor,
      count: 20,
    });
  res?.conferenceList && result.push(...(res?.conferenceList || []));
  if (res.cursor !== '') {
    await fetchScheduledData(res.cursor, result);
  }
  return result;
};

const scheduleContentList = computed(() =>
  sortedScheduleRoomList.value.map((item, index, arr) => {
    if (
      index === 0 ||
      getScheduleDate(item.scheduleStartTime) !==
        getScheduleDate(arr[index - 1].scheduleStartTime)
    ) {
      return { ...item, showTimestamp: true };
    }
    return { ...item, showTimestamp: false };
  })
);

function getScheduleDate(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const year = `${date.getFullYear()}`;
  const month = `${date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1}`;
  const day = `${date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()}`;
  return `${year}${t('schedule year')}${month}${t('schedule month')}${day}${t('schedule day')}`;
}

function getScheduleTime(timestamp: number) {
  const date = new Date(timestamp * 1000);
  const hours = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}`;
  const minutes = `${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
  return `${hours}:${minutes}`;
}

const fetchAttendeeList = async (
  roomId: string,
  cursor = '',
  result: any[] = []
) => {
  const res = await roomService.scheduleConferenceManager.fetchAttendeeList({
    roomId,
    cursor,
    count: 20,
  });
  if (!res?.attendeeList) return [];
  result.push(...(res?.attendeeList || []));
  if (res.cursor !== '') {
    await fetchAttendeeList(roomId, res.cursor, result);
  }
  return result;
};

const handleShowMore = async (data: { roomId: string }) => {
  const attendeeList = await fetchAttendeeList(data.roomId);
  const scheduleRoom = scheduleRoomList.value.find(
    item => item.basicRoomInfo.roomId === data.roomId
  );
  if (scheduleRoom) {
    scheduleRoom.scheduleAttendees = attendeeList;
  }
};

const fetchData = async () => {
  scheduleRoomList.value = await fetchScheduledData();
  isShowLoading.value = false;
};

const updateAttendees = (
  originList: any[] = [],
  changeData: { joinedUsers: any[]; leftUsers: any[] }
) => {
  const { joinedUsers, leftUsers } = changeData;
  // Add joined users to the attendees array
  let resultList = [...originList, ...joinedUsers];
  // Remove left users from the attendees array
  resultList = resultList.filter(
    (attendee: any) =>
      !leftUsers.some(leftUser => leftUser.userId === attendee.userId)
  );
  return resultList;
};
const onConferenceScheduled = async (data: {
  conferenceInfo: TUIConferenceInfo;
}) => {
  const { conferenceInfo } = data;
  const index = scheduleRoomList.value.findIndex(
    item => item.basicRoomInfo.roomId === conferenceInfo.basicRoomInfo.roomId
  );
  if (index >= 0) {
    scheduleRoomList.value.splice(index, 1, conferenceInfo);
  } else {
    scheduleRoomList.value.push(conferenceInfo);
  }
};
const onConferenceCancelled = async (data: any) => {
  scheduleRoomList.value = scheduleRoomList.value.filter(
    item => item.basicRoomInfo.roomId !== data.roomId
  );
};
const onConferenceInfoChanged = async (data: {
  conferenceModifyInfo: TUIConferenceModifyInfo;
}) => {
  const aimConferenceIndex = scheduleRoomList.value.findIndex(
    item =>
      item.basicRoomInfo.roomId ===
      data.conferenceModifyInfo.basicRoomInfo.roomId
  );
  if (aimConferenceIndex !== -1) {
    scheduleRoomList.value[aimConferenceIndex] = objectMerge(
      scheduleRoomList.value[aimConferenceIndex],
      data.conferenceModifyInfo
    );
  }
};
const onScheduleAttendeesChanged = async (data: any) => {
  const aimConference = scheduleRoomList.value.find(
    item => item.basicRoomInfo.roomId === data.roomId
  );
  if (aimConference) {
    aimConference.scheduleAttendees = updateAttendees(
      aimConference.scheduleAttendees,
      data
    );
  }
};

const onConferenceStatusChanged = (data: {
  roomId: string;
  status: TUIConferenceStatus;
}) => {
  const aimConference = scheduleRoomList.value.find(
    item => item.basicRoomInfo.roomId === data.roomId
  );
  if (aimConference) {
    aimConference.status = data.status;
  }
};

onMounted(() => {
  roomService.on(EventType.ROOM_LOGIN, fetchData);
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceScheduled,
    onConferenceScheduled
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceCancelled,
    onConferenceCancelled
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceInfoChanged,
    onConferenceInfoChanged
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
    onScheduleAttendeesChanged
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceStatusChanged,
    onConferenceStatusChanged
  );
});
onUnmounted(() => {
  roomService.off(EventType.ROOM_LOGIN, fetchData);
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceScheduled,
    onConferenceScheduled
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceCancelled,
    onConferenceCancelled
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceInfoChanged,
    onConferenceInfoChanged
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
    onScheduleAttendeesChanged
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceStatusChanged,
    onConferenceStatusChanged
  );
});
</script>

<style lang="scss" scoped>
@keyframes loading-rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.schedule-room.schedule-room-pc {
  min-width: 470px;
  padding: 20px 0;
  margin-left: 20px;
  user-select: none;
  background-color: var(--white-color);
  border-radius: 24px;
  box-shadow: rgba(197, 210, 229, 0.3);
}

.schedule-room {
  position: relative;
  width: 100%;

  .schedule-room-history {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    font-size: 14px;
    font-weight: 500;
    color: var(--active-color-1);
    cursor: pointer;

    .arrow {
      margin-left: 4px;
    }
  }

  .schedule-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 14px;
    font-weight: 400;
    color: #8f9ab2;

    .loading {
      margin-bottom: 10px;
      animation: loading-rotate 1.5s linear infinite;
    }
  }

  .schedule-room-container {
    height: 504px;
    padding: 0 2px 0 10px;
    margin-right: 2px;
    overflow-y: scroll;

    .schedule-room-date {
      display: flex;
      padding: 10px;
      font-size: 14px;
      font-weight: 400;
      color: var(--font-color-9);

      .date {
        margin-right: 2px;
      }
    }
  }

  .schedule-no-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 504px;

    .text {
      margin-top: 10px;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      color: #8f9ab2;
    }
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #e0e2e9;
    border-radius: 10px;
  }
}

.schedule-room.schedule-room-h5 {
  height: 100%;
  padding: 10px 0;

  .schedule-room-container {
    height: 100%;
    overflow: auto;
  }
}
</style>
