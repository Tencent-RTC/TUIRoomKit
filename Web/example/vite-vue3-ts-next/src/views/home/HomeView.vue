<template>
  <RoomKitProvider
    class="home-host"
    scene="conference"
  >
    <div class="home-view">
      <PreconferenceView
        v-if="!showConference"
        class="home-preconference"
        :credentials="credentials"
        :busy="isEntering"
        :show-refresh-return="showRefreshReturn"
        :initial-room-id="queryRoomId"
        @create="createMeeting"
        @join="joinMeeting"
        @rejoin="rejoinLastMeeting"
        @dismiss-last-room="dismissLastRoom"
        @logout="logout"
      />
      <div v-show="showConference" ref="roomContainer" class="home-conference" />
      <RoomInvitation
        :invitation="incoming"
        :countdown="countdown"
        @accept="acceptInvitation"
        @reject="rejectInvitation"
      />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { RoomKitProvider } from '@tencentcloud/roomkit-web-vue3-next';
import { useEnterRoom } from '../../features/EnterRoom';
import { RoomInvitation, useRoomInvitation } from '../../features/Invitation';
import {
  isRefreshReturnForLink,
  PreconferenceView,
  useRefreshReturn,
} from '../../features/Preconference';
import { useUserSession } from '../../session/userSession';

const { credentials, userName, logout } = useUserSession();
const { lastRoom, dismiss } = useRefreshReturn();
const {
  roomContainer,
  showConference,
  isEntering,
  queryRoomId,
  clearRoomQuery,
  createMeeting,
  joinMeeting,
} = useEnterRoom({
  credentials,
  userName: () => userName.value,
});
const showRefreshReturn = computed(() =>
  isRefreshReturnForLink(lastRoom.value?.roomId, queryRoomId.value),
);

watch(queryRoomId, (linkedRoomId) => {
  const savedRoomId = lastRoom.value?.roomId;
  if (savedRoomId && linkedRoomId && linkedRoomId !== savedRoomId) {
    dismiss();
  }
}, { immediate: true });
const { incoming, countdown, accept: acceptInvitation, reject: rejectInvitation } = useRoomInvitation({
  onAcceptCall: (params) => {
    joinMeeting(params.roomId, params.password);
  },
});

function dismissLastRoom() {
  const declinedRoomId = lastRoom.value?.roomId ?? '';
  dismiss();
  if (declinedRoomId && queryRoomId.value === declinedRoomId) {
    void clearRoomQuery();
  }
}

function rejoinLastMeeting() {
  if (!lastRoom.value) {
    return;
  }
  joinMeeting(lastRoom.value.roomId, lastRoom.value.password);
}
</script>

<style lang="scss" scoped>
.home-host {
  width: 100%;
  height: 100%;
}

.home-host :deep(.rk-root-slot) {
  height: 100%;
}

.home-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: var(--bg-color-topbar);
}

.home-preconference {
  width: 100%;
  height: 100%;
}

.home-conference {
  width: 100%;
  height: 100%;
}
</style>
