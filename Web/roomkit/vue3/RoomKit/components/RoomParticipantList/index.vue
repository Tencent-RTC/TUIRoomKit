<template>
  <div class="participant-list">
    <div v-if="!isWebinar" class="search-container">
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
    <div v-else style="padding-top: 16px;" />

    <!-- 标签页 -->
    <div v-if="!isWebinar" class="tabs">
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

    <div v-else class="tabs">
      <div
        :class="['tab', { active: activeTabWebinar === 'Guest' }]"
        @click="activeTabWebinar = 'Guest'"
      >
        <span class="title">{{ t('ParticipantList.Guest') }}({{ currentRoom?.participantCount || 0 }})</span>
      </div>
      <div
        :class="['tab', { active: activeTabWebinar === 'Audience' }]"
        @click="activeTabWebinar = 'Audience'"
      >
        <span class="title">{{ t('ParticipantList.Audience') }}({{ currentRoom?.audienceCount || 0 }})</span>
      </div>
    </div>

    <template v-if="activeTab === 'joined' && !isWebinar">
      <!-- 成员列表 -->
      <div class="participant-container">
        <div v-if="filteredParticipants.length === 0" class="empty-state">
          {{ t('ParticipantList.NoMember') }}
        </div>
        <ParticipantItem
          v-for="participant in filteredParticipants"
          :key="participant.userId"
          :participant="participant"
          :is-local="participant.userId === localParticipant?.userId"
          :is-hovered="hoveredUserId === participant.userId"
          @hover="handleParticipantHover"
          @leave="handleParticipantLeave"
        >
          <template #actions>
            <ParticipantAction
              :participant="participant"
              :is-local="participant.userId === localParticipant?.userId"
            />
          </template>
        </ParticipantItem>
      </div>

      <!-- 底部操作 -->
      <div class="footer">
        <RoomAction v-if="activeTab === 'joined'" />
      </div>
    </template>

    <template v-if="activeTab === 'unjoined' && !isWebinar">
      <div class="unjoined-user-container">
        <PendingParticipantItem
          v-for="userInfo in filteredParticipants"
          :key="userInfo.userId"
          :userInfo="userInfo"
        />
      </div>

      <!-- 底部操作 -->
      <div class="footer">
        <TUIButton
          v-if="pendingParticipantList.length > 0"
          type="primary"
          :style="{ minWidth: '80%' }"
          @click="handleCallAllPendingParticipant"
        >
          {{ t('ParticipantList.CallAll') }}
        </TUIButton>
      </div>
    </template>

    <template v-if="activeTabWebinar === 'Guest' && isWebinar">
      <!-- 成员列表 -->
      <div class="participant-container">
        <div v-if="filteredParticipants.length === 0" class="empty-state">
          {{ t('ParticipantList.NoMember') }}
        </div>
        <ParticipantItem
          v-for="participant in filteredParticipants"
          :key="participant.userId"
          :participant="participant"
          :is-local="participant.userId === localParticipant?.userId"
          :is-hovered="hoveredUserId === participant.userId"
          @hover="handleParticipantHover"
          @leave="handleParticipantLeave"
        >
          <template #actions>
            <ParticipantAction
              :participant="participant"
              :is-local="participant.userId === localParticipant?.userId"
            />
          </template>
        </ParticipantItem>
      </div>

      <!-- 底部操作 -->
      <div class="footer">
        <RoomAction />
      </div>
    </template>

    <template v-if="activeTabWebinar === 'Audience' && isWebinar">
      <!-- 成员列表 -->
      <div class="participant-container">
        <div v-if="sortedAudienceList.length === 0" class="empty-state">
          {{ t('ParticipantList.NoMember') }}
        </div>
        <AudienceItem
          v-for="audience in sortedAudienceList"
          :key="audience.userId"
          :audience="audience"
          :is-local="audience.userId === localParticipant?.userId"
          :is-hovered="hoveredUserId === audience.userId"
          @hover="handleParticipantHover"
          @leave="handleParticipantLeave"
        >
          <template #actions>
            <AudienceAction
              :audience="audience"
              :is-local="audience.userId === localParticipant?.userId"
            />
          </template>
        </AudienceItem>
      </div>

      <!-- 底部操作 -->
      <div class="footer">
        <RoomAction />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { IconSearch, useUIKit, TUIButton } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState } from 'tuikit-atomicx-vue3/room';
import { useRoomState } from 'tuikit-atomicx-vue3/room';
import { RoomParticipantStatus, RoomParticipantRole, DeviceStatus, RoomType } from 'tuikit-atomicx-vue3';
import { combineComparators, createComparator } from '../../utils/compare';
import AudienceAction from './AudienceAction.vue';
import AudienceItem from './AudienceItem.vue';
import ParticipantAction from './ParticipantAction.vue';
import ParticipantItem from './ParticipantItem.vue';
import PendingParticipantItem from './PendingParticipantItem.vue';
import RoomAction from './RoomAction.vue';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-vue3';

const { t } = useUIKit();
const {
  currentRoom,
  callUserToRoom,
} = useRoomState();
const {
  pendingParticipantList,
  participantList,
  audienceList,
  adminList,
  localParticipant,
  participantListCursor,
  audienceListCursor,
  getParticipantList,
  getAudienceList,
} = useRoomParticipantState();

const isWebinar = computed(() => currentRoom.value?.roomType === RoomType.Webinar);

watch(() => currentRoom.value?.roomId, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal && participantListCursor.value === '') {
    getParticipantList({ cursor: participantListCursor.value });
  }
  if (newVal && newVal !== oldVal && audienceListCursor.value === '') {
    getAudienceList({ cursor: audienceListCursor.value });
  }
}, { immediate: true });

const searchText = ref('');
const activeTab = ref<'joined' | 'unjoined'>('joined');
const activeTabWebinar = ref<'Guest' | 'Audience'>('Guest');

const hoveredUserId = ref<string | null>(null);

const getParticipantSortName = (p: RoomParticipant) =>
  (p?.nameCard || p?.userName || p?.userId || '').trim();
const getAudienceSortName = (u: RoomUser) =>
  (u?.userName || u?.userId || '').trim();

// participant list sort: 1. Current user first, 2. Room owner, 3. Admin, 4. Others, 5. By name (Unicode order)
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
  createComparator((a: RoomParticipant, b: RoomParticipant) =>
    getParticipantSortName(a) < getParticipantSortName(b),
  ),
);

// Audience list sort: 1. Current user first, 2. Room owner, 3. Admin, 4. Others, 5. By name (Unicode order)
const audienceListCompareFunction = combineComparators(
  createComparator((user: RoomUser) => Boolean(user.userId === localParticipant.value?.userId)),
  createComparator((user: RoomUser) => Boolean(user.userId === currentRoom.value?.roomOwner?.userId)),
  createComparator((user: RoomUser) => Boolean(adminList.value?.some(admin => admin.userId === user.userId))),
  createComparator((a: RoomUser, b: RoomUser) =>
    getAudienceSortName(a) < getAudienceSortName(b),
  ),
);

const sortedAudienceList = computed(() =>
  [...audienceList.value].sort(audienceListCompareFunction),
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

const handleParticipantHover = (userId: string) => {
  hoveredUserId.value = userId;
};

const handleParticipantLeave = () => {
  hoveredUserId.value = null;
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
.participant-list {
  width: 100%;
  height: 100%;
  background: var(--bg-color-operate);
  min-width: 200px;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  margin-top: 10px;
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
