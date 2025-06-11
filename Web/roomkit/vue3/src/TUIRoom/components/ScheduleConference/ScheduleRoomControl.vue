<template>
  <div>
    <div v-click-outside="handleCloseOperate" class="schedule-room-control">
      <div class="schedule-room-info" @click="showDetail">
        <div class="schedule-title" :title="item.basicRoomInfo.roomName">
          <span class="schedule-title-text">
            {{ item.basicRoomInfo.roomName }}
          </span>
          <IconChevronRight
            class="schedule-title-icon"
            v-if="isMobile"
            size="10"
          />
        </div>
        <div class="schedule-content">
          <span class="schedule-content-time">
            <span>{{ props.scheduleStartTime }}</span>
            <i class="segregation-level"></i>
            <span>{{ props.scheduleEndTime }}</span>
          </span>
          <i class="segregation-vertical"></i>
          <span class="schedule-content-room-id">
            {{ item.basicRoomInfo.roomId }}
          </span>
          <i
            v-if="item.status === TUIConferenceStatus.kConferenceStatusRunning"
            class="segregation-vertical"
          ></i>
          <span
            class="schedule-content-status"
            :class="getStatusTextAndClass(item.status).className"
          >
            {{ t(getStatusTextAndClass(item.status).text) }}
          </span>
        </div>
      </div>
      <div ref="moreBtnRef" class="schedule-room-operate">
        <IconEllipsis
          class="ellipsis"
          @click="toggleClickMoreBtn"
          v-if="!isMobile"
          size="13"
        />
        <div
          v-show="showMoreControl"
          ref="operateListRef"
          :class="[
            'operate-list',
            dropdownClass,
            !showMoreControl ? 'hidden' : '',
          ]"
        >
          <template v-for="controlItem in moreControlList">
            <div
              v-if="controlItem.visible"
              :key="controlItem.key"
              class="operate-item"
              :class="{ 'cancel-text': controlItem.key === 'cancelRoom' }"
              @click="controlItem.func()"
            >
              <span class="operate-text" @click="controlItem.func">{{
                controlItem.title
              }}</span>
            </div>
          </template>
        </div>
        <IconLink
          v-if="!isMobile"
          size="13"
          class="link"
          @click="toggleInviteRoom"
        />
        <TUIButton @click="joinConference" type="primary">
          {{ t('Join') }}
        </TUIButton>
      </div>
    </div>
    <PanelContainer
      :visible="showRoomDetail"
      @input="showRoomDetail = $event"
      :title="t('Room Details')"
      :editButtonText="modifyRoom.visible && t('Modify')"
      width="540px"
      @edit="modifyRoom.func"
    >
      <div class="room-detail-content">
        <ConferenceDetail
          :conferenceInfo="props.item"
          :scheduleRoomDetailList="scheduleRoomDetailList"
        />
      </div>
      <div class="room-detail h5" v-if="isMobile">
        <div class="detail-footer">
          <TUIButton
            plain
            :custom-style="{ width: '100%', padding: '10px', fontSize: '16px' }"
            @click.stop="joinConference"
            type="primary"
          >
            {{ t('Join Room') }}
          </TUIButton>
          <TUIButton
            plain
            :custom-style="{ width: '100%', padding: '10px', fontSize: '16px' }"
            @click.stop="toggleInvitePanelShow"
            type="primary"
          >
            {{ t('Invited members') }}
          </TUIButton>
          <TUIButton
            color="red"
            plain
            :custom-style="{ width: '100%', padding: '10px', fontSize: '16px' }"
            v-if="cancelRoom.visible"
            @click.stop="cancelRoom.func"
            type="primary"
          >
            {{ t('cancel room') }}
          </TUIButton>
        </div>
        <div
          class="mask"
          v-if="invitePanelShow"
          @click.stop="toggleInvitePanelShow"
        ></div>
        <div class="invite-member-panel" v-if="invitePanelShow">
          <div class="invite-member-close" @click="toggleInvitePanelShow">
            <IconArrowDown />
          </div>
          <div class="invite-member-header">
            {{ t('Inviting members to join') }}
          </div>
          <InvitePanel :scheduleInviteList="scheduleInviteList" />
        </div>
      </div>
      <template v-if="!isMobile" #footer>
        <TUIButton
          v-if="item.status === TUIConferenceStatus.kConferenceStatusNone"
          disabled
          type="primary"
          style="min-width: 88px"
        >
          {{ t('The room is closed') }}
        </TUIButton>
        <span v-else>
          <TUIButton
            @click="joinConference"
            type="primary"
            style="min-width: 88px"
          >
            {{ t('Enter Now') }}
          </TUIButton>
          <TUIButton @click="toggleInviteRoom" style="min-width: 88px">{{ t('Invited members') }}
          </TUIButton>
        </span>
      </template>
    </PanelContainer>
    <ScheduleConferencePanel
      :visible="modifyDialogVisible"
      :conference-info="props.item"
      @input="modifyDialogVisible = $event"
    />
    <Dialog
      v-model="showRoomCancel"
      :title="t('Cancellation of scheduled rooms')"
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      width="480px"
      :append-to-body="true"
      :title-icon="IconWarning"
      :cancelButton="t('No cancellation')"
      :confirmButton="t('cancel room')"
      @confirm="handleCancelSchedule"
      @cancel="showRoomCancel = false"
    >
      <span>{{
        t('Other members will not be able to join after cancellation')
      }}</span>
      <template #footer>
        <span>
          <TUIButton
            @click="handleCancelSchedule"
            type="primary"
            style="min-width: 88px"
            >{{ t('cancel room') }}
          </TUIButton>
          <TUIButton @click="showRoomCancel = false" style="min-width: 88px">
            {{ t('No cancellation') }}
          </TUIButton>
        </span>
      </template>
    </Dialog>
    <Dialog
      v-model="showRoomInvite"
      :title="
        t('sb invites you to join the conference', {
          name: userName || userId,
        })
      "
      :modal="true"
      :show-close="true"
      :close-on-click-modal="true"
      width="540px"
      :append-to-body="true"
      :title-icon="IconSuccess"
    >
      <InvitePanel :scheduleInviteList="scheduleInviteList" />
      <template #footer>
        <span>
          <TUIButton @click="copyRoomIdAndRoomLink()" type="primary">{{ t('Copy the conference number and link') }}
          </TUIButton>
        </span>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { TUIConferenceStatus } from '@tencentcloud/tuiroom-engine-js';
import {
  ref,
  defineProps,
  nextTick,
  computed,
  defineEmits,
  onMounted,
} from 'vue';
import { roomService } from '../../services';
import useRoomInfo from '../RoomHeader/RoomInfo/useRoomInfoHooks';
import Dialog from '../common/base/Dialog';
import {
  TUIButton,
  IconChevronRight,
  IconSuccess,
  IconWarning,
  IconEllipsis,
  IconLink,
  IconArrowDown,
} from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../locales';
import vClickOutside from '../../directives/vClickOutside';
import ScheduleConferencePanel from './ScheduleConferencePanel';
import { getUrlWithRoomId, convertSecondsToHMS } from '../../utils/utils';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { isMobile } from '../../utils/environment';
import ConferenceDetail from './ConferenceDetail.vue';
import InvitePanel from './InvitePanel.vue';
import PanelContainer from './PanelContainer.vue';
import logger from '../../utils/common/logger';

const basicStore = useBasicStore();
const { userId, userName, isRoomLinkVisible } = storeToRefs(basicStore);

const roomLinkConfig = roomService.getComponentConfig('RoomLink');

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
const roomInfo = ref();

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

const getStatusTextAndClass = (status: TUIConferenceStatus) =>
  statusMap[status] || { text: '', className: '' };

const isOwner = computed(
  () =>
    props.item.basicRoomInfo.ownerId === roomService.basicStore.userId &&
    props.item.status === TUIConferenceStatus.kConferenceStatusNotStarted
);

const isShowPassword = computed(() => !!roomInfo.value?.password);

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
const scheduleAttendeesInfo = computed(() =>
  props.item.scheduleAttendees
    ? props.item.scheduleAttendees
        .map(
          (attendee: { userId: string; userName: string }) =>
            attendee.userName || attendee.userId
        )
        .join('; ')
    : ''
);
const durationTime = computed(
  () => props.item.scheduleEndTime - props.item.scheduleStartTime
);

function getScheduleTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}`;
  const minutes = `${date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()}`;
  return `${hours}:${minutes}`;
}

const scheduleRoomDetailList = computed(() => {
  const { hours, minutes } = convertSecondsToHMS(
    props.item.scheduleEndTime - props.item.scheduleStartTime
  );
  return [
    {
      title: 'Room Name',
      content: props.item.basicRoomInfo.roomName,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: true,
    },
    {
      title: 'Room ID',
      content: props.item.basicRoomInfo.roomId,
      isShowCopyIcon: true,
      status: null,
      isShowStatus: false,
      isVisible: true,
    },
    {
      title: 'Room Time',
      content: `${props.scheduleStartDate} ${props.scheduleStartTime} - ${props.scheduleEndDate} ${props.scheduleEndTime}`,
      isShowCopyIcon: false,
      status: props.item.status,
      isShowStatus: true,
      isVisible: !isMobile,
    },
    {
      title: 'Starting time',
      content: `${props.scheduleStartDate} ${props.scheduleStartTime}`,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: isMobile,
    },
    {
      title: 'Room duration',
      content: hours
        ? `${hours}${t('hours')}${minutes ? ` ${minutes}${t('minutes')}` : ''}`
        : `${minutes}${t('minutes')}`,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: isMobile,
    },
    {
      title: 'Room Type',
      content: `${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}`,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: true,
    },
    {
      title: 'Room Password',
      content: `${roomInfo.value?.password}`,
      isShowCopyIcon: true,
      status: null,
      isShowStatus: false,
      isVisible: isShowPassword.value,
    },
    {
      title: 'Creator',
      content: props.item.basicRoomInfo.roomOwner,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: true,
    },
    {
      title: 'Participants',
      content: scheduleAttendeesInfo.value,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible: true,
    },
    {
      title: 'Entry Time',
      content: `${props.scheduleStartDate}${props.scheduleStartTime}`,
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible:
        props.item.status === TUIConferenceStatus.kConferenceStatusNone,
    },
    {
      title: 'Duration of participation',
      content: getScheduleTime(durationTime.value),
      isShowCopyIcon: false,
      status: null,
      isShowStatus: false,
      isVisible:
        props.item.status === TUIConferenceStatus.kConferenceStatusNone,
    },
  ];
});

const scheduleInviteList = computed(() => [
  {
    title: 'Room Name',
    content: props.item.basicRoomInfo.roomName,
    isShowCopyIcon: false,
    isVisible: true,
  },
  {
    title: 'Room Type',
    content: `${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}`,
    isShowCopyIcon: false,
    isVisible: true,
  },
  {
    title: 'Room Time',
    content: !isMobile
      ? `${props.scheduleStartDate} ${props.scheduleStartTime} - ${props.scheduleEndDate} ${props.scheduleEndTime}`
      : `${props.scheduleStartDate} ${props.scheduleStartTime} - ${props.scheduleEndTime}`,
    isShowCopyIcon: false,
    isVisible: true,
  },
  {
    title: 'Room ID',
    content: props.item.basicRoomInfo.roomId,
    isShowCopyIcon: true,
    isVisible: true,
  },
  {
    title: 'Room Password',
    content: `${roomInfo.value?.password}`,
    isShowCopyIcon: true,
    isVisible: isShowPassword.value,
  },
  {
    title: 'Room Link',
    content: getUrlWithRoomId(props.item.basicRoomInfo.roomId),
    isShowCopyIcon: isMobile,
    isVisible: isRoomLinkVisible.value && roomLinkConfig.visible,
  },
]);

function getSeatModeDisplay(isSeatEnabled: boolean) {
  return isSeatEnabled ? 'On-stage Speaking Room' : 'Free Speech Room';
}

async function toggleClickMoreBtn() {
  emit('show-more', { roomId: props.item.basicRoomInfo.roomId });
  if (!showMoreControl.value) {
    await handleDropDownPosition();
  }
  handleFetchRoomInfo();
  showMoreControl.value = !showMoreControl.value;
}

function handleCloseOperate() {
  showMoreControl.value = false;
}

async function handleDropDownPosition() {
  await nextTick();
  const { top, bottom } = moreBtnRef.value?.getBoundingClientRect() || {};
  const { top: containerTop, bottom: containerBottom } = document
    .getElementById('scheduleRoomContainer')
    ?.getBoundingClientRect() as DOMRect;
  if (!containerBottom || !containerTop) {
    return;
  }
  const bottomSize = containerBottom - bottom;
  const topSize = top - containerTop;
  let dropDownContainerHeight = 0;
  if (!showMoreControl.value) {
    operateListRef.value.style =
      'display:block;position:absolute;z-index:-1000';
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

const invitePanelShow = ref(false);
const joinConference = () => {
  emit('join-conference', {
    roomId: props.item?.basicRoomInfo.roomId,
    roomParam: {
      isOpenCamera: false,
      isOpenMicrophone: true,
    },
  });
};
const toggleInvitePanelShow = () => {
  invitePanelShow.value = !invitePanelShow.value;
};
const showDetail = () => {
  if (!isMobile) return;
  handleFetchRoomInfo();
  emit('show-more', { roomId: props.item.basicRoomInfo.roomId });
  viewDetails.value.func();
};
function toggleInviteRoom() {
  if (showRoomDetail.value) {
    showRoomDetail.value = false;
  }
  handleFetchRoomInfo();
  showRoomInvite.value = !showRoomInvite.value;
}

function copyRoomIdAndRoomLink() {
  const invitationList = [
    `${props.item.basicRoomInfo.roomName}`,
    `${t('Room Type')}: ${t(getSeatModeDisplay(props.item.basicRoomInfo.isSeatEnabled))}`,
    `${t('Room ID')}: ${props.item.basicRoomInfo.roomId}`,
  ];
  if (isShowPassword.value) {
    invitationList.push(`${t('Room Password')}: ${roomInfo.value?.password}`);
  }
  if (isRoomLinkVisible.value && roomLinkConfig.visible) {
    invitationList.push(
      `${t('Room Link')}: ${getUrlWithRoomId(props.item.basicRoomInfo.roomId)}`
    );
  }
  const invitation = invitationList.join('\n');
  onCopy(invitation);
}

async function handleCancelSchedule() {
  await roomService.scheduleConferenceManager.cancelConference({
    roomId: props.item.basicRoomInfo.roomId,
  });
  showRoomCancel.value = false;
  showRoomDetail.value = false;
}

async function handleFetchRoomInfo() {
  if (roomInfo.value) {
    return;
  }
  try {
    const roomInfoParams = {
      roomId: props.item.basicRoomInfo.roomId,
      roomType: props.item.basicRoomInfo.roomType,
    };
    roomInfo.value = await roomService.fetchRoomInfo(roomInfoParams);
  } catch (error) {
    logger.error('fetch roomInfo failed:', error);
  }
}
</script>

<style scoped lang="scss">
.schedule-room-control {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  padding: 10px;
  user-select: none;

  .schedule-room-info {
    flex: 1;

    .schedule-title {
      display: flex;
      gap: 6px;
      align-items: center;
      max-width: 220px;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color-primary);

      .schedule-title-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .schedule-title-icon {
        min-width: 6px;
      }
    }

    .schedule-content {
      display: flex;
      margin-top: 6px;
      font-size: 14px;
      font-weight: 400;
      color: var(--text-color-primary);

      .schedule-content-time {
        min-width: 94px;
        max-width: 94px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .segregation-level {
          display: inline-block;
          width: 10px;
          height: 1px;
          margin: 0 4px 4px;
          background-color: var(--text-color-primary);
        }
      }

      .schedule-content-room-id {
        flex-wrap: nowrap;
        min-width: 60px;
        max-width: 84px;
        padding-right: 10px;
        text-overflow: ellipsis;
      }

      .segregation-vertical {
        width: 1px;
        height: 10px;
        margin: 5px 10px 0 5px;
        background-color: var(--text-color-primary);
      }
    }
  }

  &:hover {
    cursor: pointer;
    background-color: var(--list-color-hover);
    border-radius: 8px;
  }
}

.room-detail-content {
  border-radius: 8px;
  background-color: var(--bg-color-dialog);
}

.room-detail.h5 {
  .detail-footer {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }
}

.invite-member-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  padding: 20px 12px 36px;
  border-radius: 18px 18px 0 0;
  background-color: var(--bg-color-operate);

  .invite-member-close {
    display: flex;
    justify-content: center;
    padding-bottom: 12px;
    text-align: center;
  }

  .invite-member-header {
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color-primary);
  }
}

.schedule-room-operate {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .ellipsis,
  .link {
    margin-right: 20px;
    color: var(--text-color-link);

    &:hover {
      background: var(--bg-color-function);
      border-radius: 4px;
    }
  }

  .operate-list {
    position: absolute;
    z-index: 1;
    display: flex;
    flex-direction: column;
    min-width: 96px;
    padding: 20px;
    border-radius: 8px;
    background: var(--dropdown-color-default);
    box-shadow:
      0 12px 26px var(--uikit-color-black-8),
      0 8px 12px var(--uikit-color-black-8),
      0 1px 5px var(--uikit-color-black-8);

    &::before {
      position: absolute;
      width: 0;
      content: '';
      border-top: 10px solid transparent;
      border-right: 10px solid transparent;
      border-left: 10px solid transparent;
      border-bottom: 10px solid var(--dropdown-color-default);
    }

    .operate-item {
      display: flex;
      justify-content: center;
      height: 20px;
      color: var(--text-color-primary);
      cursor: pointer;

      .operate-text {
        font-size: 14px;
        white-space: nowrap;
      }

      &:not(:first-child) {
        margin-top: 20px;
      }

      &:hover {
        color: var(--text-color-link-hover);
      }
    }

    .cancel-text {
      color: var(--text-color-error);

      &:hover {
        color: var(--text-color-error);
      }
    }
  }

  .down {
    top: 50px;
    right: 74px;

    &::before {
      top: -20px;
      right: 60px;
    }

    &::after {
      top: -20px;
      left: 0;
    }
  }

  .up {
    right: 74px;
    bottom: 50px;

    &::before {
      right: 60px;
      bottom: -20px;
      transform: rotate(180deg);
    }

    &::after {
      bottom: -20px;
      left: 0;
    }
  }
}

.schedule-detail-closed {
  color: var(--text-color-secondary);
}

.status-running {
  color: var(--text-color-success);
}

.status-finished {
  color: var(--uikit-color-gray-7);
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background-color: var(--uikit-color-black-4);
}

.hidden {
  pointer-events: none;
  opacity: 0;
}
</style>
