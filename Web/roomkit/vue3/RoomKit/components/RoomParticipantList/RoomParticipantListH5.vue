<template>
  <div class="participant-list-h5">
    <div class="search-container">
      <div class="search-box">
        <IconSearch class="search-icon" size="20" />
        <input
          v-model="searchText"
          class="search-input"
          type="text"
          :placeholder="t('ParticipantList.Search')"
        >
      </div>
    </div>

    <!-- Tab navigation -->
    <div class="tabs">
      <div
        :class="['tab', { active: activeTab === 'joined' }]"
        @click="activeTab = 'joined'"
      >
        <span class="title">{{ t('ParticipantList.Joined') }}({{ currentRoom?.participantCount || 0 }})</span>
      </div>
      <div
        :class="['tab', { active: activeTab === 'unjoined' }]"
        @click="activeTab = 'unjoined'"
      >
        <span class="title">{{ t('ParticipantList.NotJoined') }}({{ pendingParticipantList.length }})</span>
      </div>
    </div>

    <template v-if="activeTab === 'joined'">
      <!-- Participant list -->
      <div class="participant-container">
        <div v-if="filteredParticipants.length === 0" class="empty-state">
          {{ t('ParticipantList.NoMember') }}
        </div>
        <ParticipantItemH5
          v-for="participant in filteredParticipants"
          :key="participant.userId"
          :participant="participant"
          :is-local="participant.userId === localParticipant?.userId"
          @click="handleParticipantClick(participant)"
        />
      </div>

      <!-- Footer actions -->
      <div class="footer">
        <RoomActionH5 v-if="activeTab === 'joined'" />
      </div>
    </template>

    <template v-if="activeTab === 'unjoined'">
      <div class="unjoined-user-container">
        <PendingParticipantItemH5
          v-for="userInfo in filteredParticipants"
          :key="userInfo.userId"
          :userInfo="userInfo"
        />
      </div>

      <!-- Footer actions -->
      <div class="footer">
        <TUIButton
          v-if="pendingParticipantList.length > 0"
          type="primary"
          size="big"
          :style="{ minWidth: '80%' }"
          @click="handleCallAllPendingParticipant"
        >
          {{ t('ParticipantList.CallAll') }}
        </TUIButton>
      </div>
    </template>

    <!-- Participant action popup -->
    <ParticipantActionH5
      :visible="showParticipantActionPopup"
      :participant="selectedParticipant"
      @update:visible="showParticipantActionPopup = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRef } from 'vue';
import { IconSearch, useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantStatus, RoomParticipantRole, DeviceStatus } from 'tuikit-atomicx-vue3';
import { combineComparators, createComparator } from '../../utils/compare';
import ParticipantActionH5 from './ParticipantActionH5.vue';
import ParticipantItemH5 from './ParticipantItemH5.vue';
import PendingParticipantItemH5 from './PendingParticipantItemH5.vue';
import RoomActionH5 from './RoomActionH5.vue';
import { useParticipantAction } from './useParticpantAction';
import type { RoomParticipant } from 'tuikit-atomicx-vue3';

const { pendingParticipantList } = useRoomParticipantState();

const { t } = useUIKit();
const {
  currentRoom,
  callUserToRoom,
} = useRoomState();
const {
  participantList,
  localParticipant,
  participantListCursor,
  getParticipantList,
} = useRoomParticipantState();

watch(() => currentRoom.value?.roomId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal && participantListCursor.value === '') {
    getParticipantList({ cursor: participantListCursor.value });
  }
}, { immediate: true });

const searchText = ref('');
const activeTab = ref<'joined' | 'unjoined'>('joined');
const showParticipantActionPopup = ref(false);
const selectedParticipant = ref<RoomParticipant | null>(null);

const defaultUserListCompareFunction = combineComparators(
  createComparator((userInfo: RoomParticipant) =>
    Boolean(userInfo.userId === localParticipant.value?.userId),
  ),
  createComparator((userInfo: RoomParticipant) =>
    Boolean(userInfo.role === RoomParticipantRole.Owner),
  ),
  createComparator((userInfo: RoomParticipant) =>
    Boolean(userInfo.role === RoomParticipantRole.Admin),
  ),
  createComparator((userInfo: RoomParticipant) => Boolean(userInfo.screenShareStatus === DeviceStatus.On)),
  createComparator((userInfo: RoomParticipant) =>
    Boolean(userInfo.cameraStatus === DeviceStatus.On && userInfo.microphoneStatus === DeviceStatus.On),
  ),
  createComparator((userInfo: RoomParticipant) => Boolean(userInfo.cameraStatus === DeviceStatus.On)),
  createComparator((userInfo: RoomParticipant) => Boolean(userInfo.microphoneStatus === DeviceStatus.On)),
  createComparator((userInfo: RoomParticipant) => Boolean(userInfo.roomStatus === RoomParticipantStatus.InCalling)),
);

const showParticipantList = computed(() => {
  if (activeTab.value === 'joined') {
    return [...participantList.value].sort(defaultUserListCompareFunction);
  }
  if (activeTab.value === 'unjoined') {
    return [...pendingParticipantList.value].sort(defaultUserListCompareFunction);
  }
  return [];
});

const filteredParticipants = computed(() => {
  if (!searchText.value.trim()) {
    return showParticipantList.value;
  }

  const searchLower = searchText.value.toLowerCase();
  return showParticipantList.value.filter(participant =>
    participant.userName.toLowerCase().includes(searchLower)
    || participant.nameCard.toLowerCase().includes(searchLower)
    || participant.userId.toLowerCase().includes(searchLower),
  );
});

const handleParticipantClick = (participant: RoomParticipant) => {
  const { controlList } = useParticipantAction({ targetParticipant: toRef(participant) });

  if (controlList.value.length === 0) {
    return;
  }

  selectedParticipant.value = participant;
  showParticipantActionPopup.value = true;
};

async function handleCallAllPendingParticipant() {
  const userIdList = pendingParticipantList.value.map(participant => participant.userId);
  if (!currentRoom.value?.roomId) {
    return;
  }
  await callUserToRoom({
    roomId: currentRoom.value?.roomId || '',
    userIdList,
    timeout: 60,
  });
}
</script>

<style scoped lang="scss">
.participant-list-h5 {
  width: 100%;
  height: 100%;
  background: var(--bg-color-operate);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  -webkit-tap-highlight-color: transparent;
}

.search-container {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  align-items: center;

  .search-box {
    display: flex;
    align-items: center;
    flex: 1;
    height: 32px;
    padding: 0 16px;
    color: var(--text-color-primary);
    background-color: var(--bg-color-input);
    border-radius: 16px;

    .search-input {
      width: 100%;
      margin-left: 8px;
      font-size: 14px;
      color: var(--text-color-primary);
      background: none;
      border: none;
      outline: none;
    }
  }
}

.tabs {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  height: 36px;
  padding: 3px 4px;
  margin: 0 20px;
  cursor: pointer;
  background-color: var(--bg-color-input);
  border-radius: 20px;

  .tab {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-radius: 20px;

    &.active {
      background-color: var(--bg-color-operate);
    }

    .title {
      font-size: 14px;
      font-weight: 400;
      color: var(--text-color-primary);
      filter: drop-shadow(0 2px 4px var(--base-color-black-8))
        drop-shadow(0 6px 10px var(--base-color-black-8))
        drop-shadow(0 3px 14px var(--base-color-black-8));
      border-radius: 20px;
      transform: translateX(4px);
    }
  }
}

.participant-container, .unjoined-user-container {
  flex: 1 1 0;
  min-height: 0;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999999;
  font-size: 14px;
}

.footer {
  display: flex;
  padding: 16px 20px;
  gap: 12px;
  justify-content: center;
}
</style>
