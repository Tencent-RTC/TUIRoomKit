<template>
  <div v-click-outside="handleCloseOperate" class="schedule-room-control">
    <div class="schedule-room-info">
      <div class="schedule-title" :title="item.basicRoomInfo.roomName">{{ item.basicRoomInfo.roomName }}</div>
      <div class="schedule-content">
        <span class="schedule-content-time">
          <span>{{ props.scheduleStartTime }}</span>
          <i class="segregation-level"></i>
          <span>{{ props.scheduleEndTime }}</span>
        </span>
        <i class="segregation-vertical"></i>
        <span class="schedule-content-roomId">
          {{ item.basicRoomInfo.roomId }}
        </span>
        <i v-if="item.status !== TUIConferenceStatus.kConferenceStatusNotStarted" class="segregation-vertical"></i>
        <span class="schedule-content-status" :class="getStatusTextAndClass(item.status).className">
          {{ t(getStatusTextAndClass(item.status).text) }}
        </span>
      </div>
    </div>
    <div ref="moreBtnRef" class="schedule-room-operate">
      <svg-icon class="ellipsis" :icon="EllipsisIcon" @click="toggleClickMoreBtn"></svg-icon>
      <div
        v-show="showMoreControl"
        ref="operateListRef"
        :class="['operate-list', dropdownClass]"
      >
        <template
          v-for="controlItem in moreControlList"
          :key="controlItem.key"
        >
          <div
            v-if="controlItem.visible"
            class="operate-item"
            :class="{ 'cancel-text': controlItem.key === 'cancelRoom' }"
            @click="controlItem.func()"
          >
            <span class="operate-text" @click="controlItem.func">{{ controlItem.title }}</span>
          </div>
        </template>
      </div>
      <svg-icon class="link" :icon="LinkIcon" @click="toggleInviteRoom"></svg-icon>
      <tui-button size="default" @click="joinConference">{{ t('join') }}</tui-button>
    </div>
    <ScheduleConferencePanel
      :visible="modifyDialogVisible"
      :conference-info="props.item"
      @input="modifyDialogVisible = $event"
    ></ScheduleConferencePanel>
    <Dialog
      v-model="showRoomDetail"
      :title="t('Room Details')"
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      width="540px"
      :append-to-body="true"
    >
      <div class="roomInfo-container">
        <div
          v-for="(item, index) in scheduleRoomDetailList"
          v-show="item.isVisible"
          :key="index"
          class="roomInfo-content"
        >
          <span class="roomInfo-title">{{ t(item.title) }}</span>
          <span class="roomInfo-item" :title="item.content">{{ item.content }}</span>
          <span v-if="item.isShowCopyIcon" class="copy-container" @click="onCopy(item.content)">
            <svg-icon class="copy" :icon="copyIcon"></svg-icon>
          </span>
          <div v-if="item.isShowStatus" :class="['roomInfo-status', getStatusTextAndClass(item.status).className]">
            {{ t(getStatusTextAndClass(item.status).text) }}
          </div>
        </div>
      </div>
      <template #footer>
        <tui-button
          v-if="item.status === TUIConferenceStatus.kConferenceStatusNone"
          class="dialog-button"
          size="default" disabled
        >
          {{ t('The room is closed') }}
        </tui-button>
        <span v-else>
          <tui-button class="dialog-button" size="default" @click="joinConference">{{ t('Enter Now') }}</tui-button>
          <tui-button
            type="primary" size="default" class="button" @click="toggleInviteRoom"
          >{{ t('Invited members') }}</tui-button>
        </span>
      </template>
    </Dialog>
    <Dialog
      v-model="showRoomCancel"
      :title="t('Cancellation of scheduled rooms')"
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      width="480px"
      :append-to-body="true"
      :title-icon="WarningIcon"
    >
      <span>{{ t('Other members will not be able to join after cancellation') }}</span>
      <template #footer>
        <span>
          <tui-button class="dialog-button" size="default" @click="handleCancelSchedule">{{ t('cancel room') }}</tui-button>
          <tui-button type="primary" size="default" class="button" @click="showRoomCancel = false">{{ t('No cancellation') }}</tui-button>
        </span>
      </template>
    </Dialog>
    <Dialog
      v-model="showRoomInvite"
      :title="t('sb invites you to join the conference', { name: userName || userId })"
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      width="540px"
      :append-to-body="true"
      :title-icon="SuccessIcon"
    >
      <div class="invite-member">
        <div v-for="(item, index) in scheduleInviteList" :key="index" class="invite-member-container">
            <span class="invite-member-title">{{ t(item.title) }}</span>
            <span class="invite-member-content" :title="item.content"> {{ item.content }}</span>
            <svg-icon class="copy" :icon="copyIcon" v-if="item.isShowCopyIcon" @click="onCopy(item.content)"></svg-icon>
          </div>
      </div>
      <template #footer>
        <span>
          <tui-button class="dialog-button" size="default" @click="copyRoomIdAndRoomLink()">{{ t('Copy the conference number and link') }}</tui-button>
        </span>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { TUIConferenceStatus  } from '@tencentcloud/tuiroom-engine-js';
import { ref, defineProps, nextTick, computed, defineEmits } from 'vue';
import { roomService } from '../../services';
import useRoomInfo from '../../components/RoomHeader/RoomInfo/useRoomInfoHooks';
import SvgIcon from '../../components/common/base/SvgIcon.vue';
import Dialog from '../../components/common/base/Dialog';
import EllipsisIcon from '../../components/common/icons/EllipsisIcon.vue';
import copyIcon from '../../components/common/icons/CopyIcon.vue';
import LinkIcon from '../../components/common/icons/LinkIcon.vue';
import SuccessIcon from '../../components/common/icons/SuccessIcon.vue';
import WarningIcon from '../../components/common/icons/WarningIcon.vue';
import TuiButton from '../../components/common/base/Button.vue';
import { useI18n } from '../../locales';
import '../../directives/vClickOutside';
import ScheduleConferencePanel from './ScheduleConferencePanel.vue';
import { getUrlWithRoomId } from '../../utils/utils';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';

const basicStore = useBasicStore();
const { userId, userName } = storeToRefs(basicStore);

const { t } = useI18n();
const showMoreControl = ref(false);
const dropdownClass = ref('down');
const moreBtnRef = ref();
const operateListRef = ref();
const modifyDialogVisible = ref(false);
const emit = defineEmits(['join-conference', 'show-more']);
const showRoomDetail = ref(false);
const showRoomCancel = ref(false);
const showRoomInvite = ref(false);

const props = defineProps<{
  item: any;
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
}>();

const { onCopy } = useRoomInfo();

type StatusMapType = {
  [key: number]: {
    text: string;
    className: string;
  };
};

const statusMap: StatusMapType = {
  [TUIConferenceStatus.kConferenceStatusRunning]: {
    text: 'Ongoing',
    className: 'status-running',
  },
};

const getStatusTextAndClass = (status: TUIConferenceStatus) => statusMap[status] || { text: '', className: '' };

const isOwner = computed(() => props.item.basicRoomInfo.ownerId === roomService.basicStore.userId
  && props.item.status === TUIConferenceStatus.kConferenceStatusNotStarted);

const viewDetails = computed(() => ({
  key: 'roomDetails',
  title: t('view details'),
  visible: true,
  func: () => {
    showRoomDetail.value = true;
    showMoreControl.value = false;
  },
}));

const modifyRoom = computed(() => ({
  key: 'modifyRoom',
  title: t('modify room'),
  visible: isOwner.value,
  func: () => {
    modifyDialogVisible.value = true;
    showMoreControl.value = false;
  },
}));

const cancelRoom = computed(() => ({
  key: 'cancelRoom',
  title: t('cancel room'),
  visible: isOwner.value,
  func: () => {
    showRoomCancel.value = true;
    showMoreControl.value = false;
  },
}));

const moreControlList = computed(() => [
  viewDetails.value,
  modifyRoom.value,
  cancelRoom.value,
]);
const scheduleAttendeesInfo = computed(() => (props.item.scheduleAttendees ? props.item.scheduleAttendees.map((attendee: { userId: string; userName: string; }) => attendee.userName || attendee.userId).join('; ') : ''));
const durationTime = computed(() => props.item.scheduleEndTime - props.item.scheduleStartTime);

function getScheduleTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}`;
  const minutes = `${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
  return `${hours}:${minutes}`;
}
const scheduleRoomDetailList = computed(() => [
  { title: 'Room Name', content: props.item.basicRoomInfo.roomName, isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: true },
  { title: 'Room ID', content: props.item.basicRoomInfo.roomId, isShowCopyIcon: true, status: null, isShowStatus: false,  isVisible: true },
  {
    title: 'Room Time',
    content: `${props.scheduleStartDate} ${props.scheduleStartTime} - ${props.scheduleEndDate} ${props.scheduleEndTime}`,
    isShowCopyIcon: false,
    status: props.item.status,
    isShowStatus: true,
    isVisible: true,
  },
  { title: 'Room Type', content: `${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}`, isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: true },
  { title: 'Creator', content: props.item.basicRoomInfo.roomOwner, isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: true },
  { title: 'Members', content: scheduleAttendeesInfo.value, isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: true },
  { title: 'Entry Time', content: `${props.scheduleStartDate}${props.scheduleStartTime}`, isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: props.item.status === TUIConferenceStatus.kConferenceStatusNone },
  { title: 'Duration of participation', content: getScheduleTime(durationTime.value), isShowCopyIcon: false, status: null, isShowStatus: false, isVisible: props.item.status === TUIConferenceStatus.kConferenceStatusNone },
]);

const scheduleInviteList = computed(() => [
  { title: 'Room Name', content: props.item.basicRoomInfo.roomName, isShowCopyIcon: false },
  { title: 'Room Type', content: `${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}`, isShowCopyIcon: false },
  { title: 'Room Time', content: `${props.scheduleStartDate} ${props.scheduleStartTime} - ${props.scheduleEndDate} ${props.scheduleEndTime}`, isShowCopyIcon: false },
  { title: 'Room ID', content: props.item.basicRoomInfo.roomId, isShowCopyIcon: true },
  { title: 'Room Link', content: getUrlWithRoomId(props.item.basicRoomInfo.roomId), isShowCopyIcon: true },
]);

function getSeatModeDisplay(isSeatEnabled: boolean) {
  return isSeatEnabled ? 'On-stage Speaking Room' : 'Free Speech Room';
}

async function toggleClickMoreBtn() {
  emit('show-more', { roomId: props.item.basicRoomInfo.roomId });
  if (!showMoreControl.value) {
    await handleDropDownPosition();
  }
  showMoreControl.value = !showMoreControl.value;
}

function handleCloseOperate() {
  showMoreControl.value = false;
}

async function handleDropDownPosition() {
  const { top, bottom } = moreBtnRef.value?.getBoundingClientRect();
  const { top: containerTop, bottom: containerBottom } = document.getElementById('scheduleRoomContainer')?.getBoundingClientRect() as DOMRect;
  if (!containerBottom || !containerTop) {
    return;
  }
  const bottomSize = containerBottom - bottom;
  const topSize = top - containerTop;
  let dropDownContainerHeight = 0;
  if (!showMoreControl.value) {
    operateListRef.value.style = 'display:block;position:absolute;z-index:-1000';
    await nextTick();
    dropDownContainerHeight = operateListRef.value.offsetHeight;
    operateListRef.value.style = '';
  } else {
    dropDownContainerHeight = operateListRef.value?.offsetHeight;
  }
  if (topSize < dropDownContainerHeight) {
    return;
  }
  if (bottomSize < dropDownContainerHeight) {
    dropdownClass.value = 'up';
  }
}

const joinConference = () => {
  emit('join-conference', {
    roomId: props.item?.basicRoomInfo.roomId,
    roomParam: {
      isOpenCamera: false,
      isOpenMicrophone: true,
    },
  });
};
function toggleInviteRoom() {
  if (showRoomDetail.value) {
    showRoomDetail.value = false;
  }
  showRoomInvite.value = !showRoomInvite.value;
}

function copyRoomIdAndRoomLink() {
  const invitation = `${props.item.basicRoomInfo.roomName}\n
${t('Room Type')}: ${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}\n
${t('Room Time')}: ${props.scheduleStartDate}${props.scheduleStartTime} - ${props.scheduleEndDate}${props.scheduleEndTime}\n
${t('Room ID')}: ${props.item.basicRoomInfo.roomId}\n
${t('Room Link')}: ${getUrlWithRoomId(props.item.basicRoomInfo.roomId)}`;
  onCopy(invitation);
}

async function handleCancelSchedule() {
  await roomService.scheduleConferenceManager.cancelConference({ roomId: props.item.basicRoomInfo.roomId });
  showRoomCancel.value = false;
}
</script>

<style scoped lang="scss">
.tui-theme-black .operate-list {
  --operation-box-shadow: 0px 3px 8px rgba(34, 38, 46, 0.30), 0px 6px 40px rgba(34, 38, 46, 0.30);
}

.tui-theme-white .operate-list {
  --operation-box-shadow: 0px 3px 8px #E9F0FB, 0px 6px 40px rgba(0, 0, 0, 0.10);
}
.schedule-room-control {
    padding: 10px;
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    .schedule-room-info {
      flex: 1;
      .schedule-title {
        font-weight: 500;
        font-size: 16px;
        color: var(--font-color-4);
        white-space: nowrap;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
      }
        .schedule-content {
          font-size: 14px;
          font-weight: 400;
          color: var(--font-color-4);
          margin-top: 6px;
          display: flex;
          .schedule-content-time {
            min-width: 94px;
            max-width: 94px;
            .segregation-level{
              width: 10px;
              height: 1px;
              background-color: var(--font-color-4);
              display: inline-block;
              margin: 0 4px 4px 4px;
            }
          }
          .schedule-content-roomId {
            text-overflow: ellipsis;
            flex-wrap: nowrap;
            min-width: 60px;
            max-width: 84px;
            padding-right: 10px;
          }
          .segregation-vertical {
            width: 1px;
            height: 10px;
            background-color: #969EB4;
            margin: 5px 10px 0 5px;
          }
        }
    }
    .schedule-room-operate {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: space-between;
      .ellipsis, .link {
        width: 30px;
        height: 30px;
        color: var(--active-color-1);
        margin-right: 6px;
        &:hover {
          border-radius: 4px;
          background: rgba(150, 158, 180, 0.10);
        }
      }
    .operate-list {
      position: absolute;
      min-width: 96px;
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: var(--operation-box-shadow);
      z-index: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
      &::before {
        content: '';
        position: absolute;
        width: 0px;
        border-top: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #FFFFFF;
        border-left: 10px solid transparent;
      }
      .operate-item {
        cursor: pointer;
        color: #6B758A;
        height: 20px;
        display: flex;
        justify-content: center;
        .operate-text {
          font-size: 14px;
          white-space: nowrap;
          }
          &:not(:first-child) {
            margin-top: 20px;
          }
          &:hover {
            color: var(--active-color-1);
          }
      }
      .cancel-text{
        color: var(--red-color-2);
        &:hover {
          color: var(--red-color-2);
        }
      }
    }
    .down {
      top: 50px;
      right: 74px;
      &::before {
        right: 60px;
        top: -20px;
      }
      &::after {
        left: 0px;
        top: -20px;
      }
    }
    .up {
      bottom: 50px;
      right: 74px;
      &::before {
        bottom: -20px;
        right: 60px;
        transform: rotate(180deg);
      }
      &::after {
        left: 0px;
        bottom: -20px;
      }
    }
    }
    &:hover {
      background-color: rgba(150, 158, 180, 0.1);
      cursor: pointer;
      border-radius: 8px;
    }
}
.roomInfo-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  .roomInfo-content {
    display: flex;
    min-width: 300px;
    align-items: stretch;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    .roomInfo-title {
      flex-basis: 18%;
      color: #4F586B;
    }
    .roomInfo-item {
      overflow: hidden;
      max-width: 360px;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #4F586B;
      font-weight: 500;
    }
    .copy-container {
      display: flex;
      cursor: pointer;
      color: var(--active-color-2);
      margin-left: 6px;
      .copy {
        width: 20px;
        height: 20px;
      }
    }
    .roomInfo-status {
      margin-left: 10px;
    }
  }
}

.invite-member {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 10px;
  .invite-member-container {
    display: flex;
    min-width: 400px;
    align-items: stretch;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: #4F586B;
    .invite-member-title {
      flex-basis: 18%;
    }
    .invite-member-content {
      font-weight: 500;
      max-width: 360px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .copy {
      width: 20px;
      height: 20px;
      cursor: pointer;
      color: var(--active-color-1);
      margin-left: 8px;
    }
  }
}
.schedule-detail-closed {
  color: #4F586B;
}
.button {
  margin-left: 10px;
}
.status-not-start {
  color: var(--font-color-10);
}
.status-running {
  color: var(--active-color-1);
}
.status-finished {
  color: #B2BBD1;
}
</style>
