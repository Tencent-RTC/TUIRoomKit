<template>
  <div v-show="props.isShowScheduledConference && !isMobile" id="scheduleRoomContainer" class="schedule-room">
    <div class="schedule-loading" v-if="isShowLoading">
      <svg-icon :icon="LoadingScheduleIcon" class="loading"></svg-icon>
      <span class="text">{{ t('Schedule room loading') }}</span>
    </div>
    <div v-else>
      <div v-if="scheduleRoomList.length > 0" class="schedule-room-container">
        <div v-for="(item, index) in scheduleContentList" :key="index">
          <div v-show="item.showTimestamp" class="schedule-room-date">
            <svg-icon class="date" :icon="CalendarIcon"></svg-icon>
            <span>{{ getScheduleDate(item.scheduleStartTime) }}</span>
          </div>
          <ScheduleRoomControl
            :item="item"
            :schedule-start-date="getScheduleDate(item.scheduleStartTime)"
            :schedule-end-date="getScheduleDate(item.scheduleEndTime)"
            :schedule-start-time="getScheduleTime(item.scheduleStartTime)"
            :schedule-end-time="getScheduleTime(item.scheduleEndTime)"
            @join-conference="joinConference"
            @show-more="(data) => handleShowMore(data, index)"
          />
        </div>
      </div>
      <div v-else class="schedule-no-body">
        <svg-icon :icon="ApplyStageLabelIcon"></svg-icon>
        <span class="text">{{ t('No room available for booking') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { EventType, roomService } from '../../services';
import SvgIcon from '../../components/common/base/SvgIcon.vue';
import CalendarIcon from '../../components/common/icons/CalendarIcon.vue';
import ApplyStageLabelIcon from '../../components/common/icons/ApplyStageLabelIcon.vue';
import ScheduleRoomControl from './ScheduleRoomControl.vue';
import LoadingScheduleIcon from '../common/icons/LoadingScheduleIcon.vue';
import { useI18n } from '../../locales';
import { TUIConferenceInfo, TUIConferenceListManagerEvents, TUIConferenceModifyInfo, TUIConferenceStatus } from '@tencentcloud/tuiroom-engine-electron';
import { isMobile } from '../../utils/environment';
import { objectMerge } from '../../utils/utils.ts';

const { t } = useI18n();
const scheduleRoomList = ref<TUIConferenceInfo[]>([]);
const emit = defineEmits(['join-conference']);
const isShowLoading = ref(true);

const joinConference = (options: any) => {
  emit('join-conference', options);
};

const props = withDefaults(defineProps<{
  isShowScheduledConference?: boolean,
}>(), {
  isShowScheduledConference: true,
});

const sortedScheduleRoomList = computed(() => scheduleRoomList.value.sort((a, b) => a.scheduleStartTime - b.scheduleStartTime));

const fetchScheduledData = async (cursor = '', result: any[] = []) => {
  const res = await roomService.scheduleConferenceManager.
    fetchScheduledConferenceList({
      cursor,
      count: 20,
    });
  res?.conferenceList && result.push(...res?.conferenceList);
  if (res.cursor !== '') {
    await fetchScheduledData(res.cursor, result);
  }
  return result;
};

const scheduleContentList = computed(() => sortedScheduleRoomList.value.map((item, index, arr) => {
  if (index === 0 || getScheduleDate(item.scheduleStartTime) !== getScheduleDate(arr[index - 1].scheduleStartTime)) {
    return { ...item, showTimestamp: true };
  }
  return { ...item, showTimestamp: false };
}));

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

const fetchAttendeeList = async (roomId: string, cursor = '', result: any[] = []) => {
  const res = await roomService.scheduleConferenceManager.
    fetchAttendeeList({ roomId, cursor, count: 20 });
  if (!res?.attendeeList) return [];
  result.push(...res?.attendeeList);
  if (res.cursor !== '') {
    await fetchAttendeeList(roomId, res.cursor, result);
  }
  return result;
};

const handleShowMore = async (data: { roomId: string }, index: number) => {
  const attendeeList = await fetchAttendeeList(data.roomId);
  scheduleRoomList.value[index].scheduleAttendees = attendeeList;
};

const fetchData = async () => {
  scheduleRoomList.value = await fetchScheduledData();
  isShowLoading.value = false;
};

const updateAttendees = (originList: any[] = [], changeData: { joinedUsers: any[], leftUsers: any[] }) => {
  const { joinedUsers, leftUsers } = changeData;
  // Add joined users to the attendees array
  let resultList = [...originList, ...joinedUsers];
  // Remove left users from the attendees array
  resultList = resultList.filter((attendee: any) => !leftUsers.some(leftUser => leftUser.userId === attendee.userId));
  return resultList;
};
const onConferenceScheduled = async (data: { conferenceInfo: any }) => {
  const { conferenceInfo } = data;
  scheduleRoomList.value.push(conferenceInfo);
};
const onConferenceCancelled = async (data: any) => {
  scheduleRoomList.value = scheduleRoomList.value.filter(item => item.basicRoomInfo.roomId !== data.roomId);
};
const onConferenceInfoChanged = async (data: { conferenceModifyInfo: TUIConferenceModifyInfo }) => {
  const aimConferenceIndex = scheduleRoomList.value
    .findIndex(item => item.basicRoomInfo.roomId === data.conferenceModifyInfo.basicRoomInfo.roomId);
  if (aimConferenceIndex !== -1) {
    scheduleRoomList.value[aimConferenceIndex] = objectMerge(
      scheduleRoomList.value[aimConferenceIndex],
      data.conferenceModifyInfo,
    );
  }
};
const onScheduleAttendeesChanged = async (data: any) => {
  const aimConference = scheduleRoomList.value.find(item => item.basicRoomInfo.roomId === data.roomId);
  if (aimConference) {
    aimConference.scheduleAttendees = updateAttendees(aimConference.scheduleAttendees, data);
  }
};

const onConferenceStatusChanged = (data: {
  roomId: string;
  status: TUIConferenceStatus;
}) => {
  const aimConference = scheduleRoomList.value.find(item => item.basicRoomInfo.roomId === data.roomId);
  if (aimConference) {
    aimConference.status = data.status;
  }
};

onMounted(() => {
  roomService.on(EventType.ROOM_LOGIN, fetchData);
  roomService.scheduleConferenceManager.on(TUIConferenceListManagerEvents.onConferenceScheduled, onConferenceScheduled);
  roomService.scheduleConferenceManager.on(TUIConferenceListManagerEvents.onConferenceCancelled, onConferenceCancelled);
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceInfoChanged,
    onConferenceInfoChanged,
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
    onScheduleAttendeesChanged,
  );
  roomService.scheduleConferenceManager.on(
    TUIConferenceListManagerEvents.onConferenceStatusChanged,
    onConferenceStatusChanged,
  );
});
onUnmounted(() => {
  roomService.off(EventType.ROOM_LOGIN, fetchData);
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceScheduled,
    onConferenceScheduled,
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceCancelled,
    onConferenceCancelled,
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceInfoChanged,
    onConferenceInfoChanged,
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onScheduleAttendeesChanged,
    onScheduleAttendeesChanged,
  );
  roomService.scheduleConferenceManager.off(
    TUIConferenceListManagerEvents.onConferenceStatusChanged,
    onConferenceStatusChanged,
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

.schedule-room {
    width: 100%;
    min-width: 470px;
    background-color: var(--white-color);
    margin-left: 20px;
    border-radius: 24px;
    box-shadow: rgba(197, 210, 229, 0.3);
    position: relative;
    padding: 20px 0;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    .schedule-room-history {
        position: absolute;
        top: 20px;
        right: 20px;
        color: var(--active-color-1);
        cursor: pointer;
        display: flex;
        font-size: 14px;
        font-weight: 500;
        .arrow {
            margin-left: 4px;
        }
    }
    .schedule-loading {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        color: #8f9ab2;
        font-size: 14px;
        font-weight: 400;
        .loading {
          margin-bottom: 10px;
          animation: loading-rotate 1.5s linear infinite;
        }
    }
    .schedule-room-container{
      overflow-y: scroll;
      padding: 0 2px 0 10px;
      height: 504px;
      margin-right: 2px;
        .schedule-room-date {
          display: flex;
          font-size: 14px;
          font-weight: 400;
          color: var(--font-color-9);
          padding: 10px;
          .date {
              margin-right: 2px;
          }
       }
    }
    .schedule-no-body {
        height: 504px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        .text {
          color: #8f9ab2;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          margin-top: 10px;
        }
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-thumb {
      background-color: #E0E2E9;
      border-radius: 10px;
    }
}
</style>
