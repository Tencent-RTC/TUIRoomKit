<template>
  <div class="participant-list-mobile">
    <div class="participant-list-mobile-body">
      <div class="participant-list-mobile-toolbar">
        <TUIInput
          v-model="query"
          class="participant-list-mobile-search"
          size="sm"
          :placeholder="t('Participants.SearchPlaceholder')"
        >
          <template #prefix>
            <IconSearch class="participant-list-mobile-search-icon" :size="14" />
          </template>
        </TUIInput>
        <div
          class="participant-list-mobile-invite"
          role="button"
          tabindex="0"
          :aria-label="t('Participants.Invite')"
          @click="inviteOpen = true"
          @keydown.enter.prevent="inviteOpen = true"
        >
          <IconUserPlus :size="16" />
        </div>
      </div>

      <div v-if="isSearchEmpty" class="participant-list-mobile-empty">
        <svg class="participant-list-mobile-empty-art" viewBox="0 0 80 64" fill="none" aria-hidden="true">
          <rect class="art-card" x="4" y="8" width="52" height="44" rx="12" />
          <circle class="art-dim" cx="19" cy="22" r="6" />
          <rect class="art-dim" x="30" y="18" width="16" height="4" rx="2" />
          <rect class="art-faint" x="30" y="25" width="10" height="3" rx="1.5" />
          <circle class="art-dim" cx="19" cy="39" r="6" />
          <rect class="art-dim" x="30" y="35" width="13" height="4" rx="2" />
          <rect class="art-faint" x="30" y="42" width="8" height="3" rx="1.5" />
          <circle class="art-lens" cx="56" cy="40" r="12" />
          <path class="art-handle" d="M64.5 48.5 72 56" />
          <path class="art-mark" d="M52 36l8 8M60 36l-8 8" />
        </svg>
        <div class="participant-list-mobile-empty-title">
          {{ t('Participants.SearchEmpty') }}
        </div>
        <div class="participant-list-mobile-empty-desc">
          {{ searchEmptyDesc[0] }}<mark>{{ query.trim() }}</mark>{{ searchEmptyDesc[1] }}
        </div>
        <div class="participant-list-mobile-empty-actions">
          <div class="participant-list-mobile-empty-btn" role="button" tabindex="0" @click="query = ''">
            {{ t('Participants.ClearSearch') }}
          </div>
          <div class="participant-list-mobile-empty-btn is-primary" role="button" tabindex="0" @click="inviteOpen = true">
            {{ t('Participants.Invite') }}
          </div>
        </div>
      </div>

      <template v-else>
        <section class="participant-list-mobile-section">
          <div class="participant-list-mobile-section-bar">
            <div
              class="participant-list-mobile-section-toggle"
              role="button"
              tabindex="0"
              :aria-expanded="joinedOpen"
              @click="joinedOpen = !joinedOpen"
            >
              <IconChevron class="participant-list-mobile-section-chev" :class="{ 'is-collapsed': !joinedOpen }" :size="12" />
              <span>{{ t('Participants.Joined') }}</span>
              <span class="participant-list-mobile-section-count">{{ visibleJoined.length }}</span>
            </div>
          </div>
          <div v-if="joinedOpen" class="participant-list-mobile-section-body">
            <div
              v-for="participant in visibleJoined"
              :key="participant.userId"
              class="participant-list-mobile-row"
              :class="{ 'is-tappable': hasActions(participant) }"
              :role="hasActions(participant) ? 'button' : undefined"
              :tabindex="hasActions(participant) ? 0 : undefined"
              @click="openMemberSheet(participant)"
            >
              <TUIAvatar :size="32" :src="participant.avatarUrl" :alt="displayName(participant)" />
              <div class="participant-list-mobile-info">
                <div class="participant-list-mobile-name">
                  <span class="participant-list-mobile-name-text">{{ displayName(participant) }}</span>
                  <span v-if="isLocal(participant)" class="participant-list-mobile-tag is-self">{{ t('Participants.Me') }}</span>
                  <span v-if="participant.role === RoomParticipantRole.Owner" class="participant-list-mobile-tag is-owner">
                    {{ t('Participants.Owner') }}
                  </span>
                  <span v-else-if="participant.role === RoomParticipantRole.Admin" class="participant-list-mobile-tag is-admin">
                    {{ t('Participants.Admin') }}
                  </span>
                  <span v-if="participant.screenShareStatus === DeviceStatus.On" class="participant-list-mobile-tag is-sharing">
                    <IconShare :size="10" />
                    {{ t('Participants.Sharing') }}
                  </span>
                </div>
              </div>
              <div class="participant-list-mobile-icons">
                <span class="participant-list-mobile-status">
                  <IconMic v-if="participant.microphoneStatus === DeviceStatus.On" :size="14" />
                  <IconMicOff v-else :size="14" />
                </span>
                <span class="participant-list-mobile-status">
                  <IconCam v-if="participant.cameraStatus === DeviceStatus.On" :size="14" />
                  <IconCamOff v-else :size="14" />
                </span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="query.trim() ? visiblePending.length > 0 : true" class="participant-list-mobile-section">
          <div class="participant-list-mobile-section-bar">
            <div
              class="participant-list-mobile-section-toggle"
              role="button"
              tabindex="0"
              :aria-expanded="pendingOpen"
              @click="pendingOpen = !pendingOpen"
            >
              <IconChevron class="participant-list-mobile-section-chev" :class="{ 'is-collapsed': !pendingOpen }" :size="12" />
              <span>{{ t('Participants.Pending') }}</span>
              <span class="participant-list-mobile-section-count">{{ visiblePending.length }}</span>
            </div>
            <div
              v-if="visiblePending.length"
              class="participant-list-mobile-call-all"
              :class="{ 'is-disabled': idlePendingIds.length === 0 }"
              role="button"
              tabindex="0"
              @click="callAll"
            >
              {{ t('Participants.CallAll') }}
            </div>
          </div>
          <div v-if="pendingOpen" class="participant-list-mobile-section-body">
            <div v-if="visiblePending.length === 0" class="participant-list-mobile-section-empty">
              {{ t('Participants.WaitingEmpty') }}
            </div>
            <div
              v-for="participant in visiblePending"
              :key="participant.userId"
              class="participant-list-mobile-row"
            >
              <TUIAvatar :size="32" :src="participant.avatarUrl" :alt="displayName(participant)" />
              <div class="participant-list-mobile-info">
                <div class="participant-list-mobile-name">
                  <span class="participant-list-mobile-name-text">{{ displayName(participant) }}</span>
                </div>
              </div>
              <div class="participant-list-mobile-wait">
                <span v-if="failedCallIds.has(participant.userId)" class="participant-list-mobile-wait-failed">
                  {{ t('Participants.NoAnswer') }}
                </span>
                <span
                  v-else-if="participant.roomStatus === RoomParticipantStatus.InCalling"
                  class="participant-list-mobile-wait-call is-calling"
                >
                  <IconPhone class="participant-list-mobile-wait-pulse" :size="14" />
                  <span>{{ t('Participants.Calling') }}</span>
                </span>
                <div
                  v-else
                  class="participant-list-mobile-wait-call"
                  role="button"
                  tabindex="0"
                  :aria-label="t('Participants.Call')"
                  @click="callUsers([participant])"
                >
                  <IconPhone :size="14" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <footer v-if="canManageMembers" class="participant-list-mobile-footer">
      <div
        class="participant-list-mobile-footer-btn"
        :class="{ 'is-on': isAllMicrophoneDisabled }"
        role="button"
        tabindex="0"
        @click="toggleAllDevice(DeviceType.Microphone)"
      >
        {{ isAllMicrophoneDisabled ? t('Participants.UnmuteAll') : t('Participants.MuteAll') }}
      </div>
      <div
        class="participant-list-mobile-footer-btn"
        :class="{ 'is-on': isAllCameraDisabled }"
        role="button"
        tabindex="0"
        @click="toggleAllDevice(DeviceType.Camera)"
      >
        {{ isAllCameraDisabled ? t('Participants.CamOnAll') : t('Participants.CamOffAll') }}
      </div>
      <div class="participant-list-mobile-footer-btn" role="button" tabindex="0" @click="hostSheetOpen = true">
        {{ t('Room.More') }}
      </div>
    </footer>

    <ParticipantActionSheet v-model:open="memberSheetOpen" :groups="memberGroups" @select="runMemberAction" />
    <ParticipantActionSheet v-model:open="hostSheetOpen" :groups="hostGroups" split @select="runHostAction" />

    <TUIDialog
      :open="renameOpen"
      :title="t('Participants.Rename')"
      :closable="false"
      :confirm-text="t('Participants.Confirm')"
      :cancel-text="t('Participants.Cancel')"
      :confirm-disabled="!renameValue.trim()"
      @update:open="renameOpen = $event"
      @confirm="submitRename"
    >
      <p class="participant-list-mobile-rename-desc">
        {{ t('Participants.RenameDesc') }}
      </p>
      <TUIInput
        v-model="renameValue"
        :placeholder="t('Participants.RenamePlaceholder')"
        :maxlength="10"
        @enter="submitRename"
      />
    </TUIDialog>

    <UserPickerMobile v-model:open="inviteOpen" :occupied-ids="occupiedIds" @confirm="inviteContacts" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  DeviceStatus,
  DeviceType,
  RoomCallResult,
  RoomEvent,
  RoomParticipantRole,
  RoomParticipantStatus,
  useDeviceState,
  useLoginState,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import type { RoomCall, RoomInfo, RoomParticipant } from 'tuikit-atomicx-vue3/room';
import {
  IconCam,
  IconCamOff,
  IconChat,
  IconChatOff,
  IconChevron,
  IconKick,
  IconMic,
  IconMicOff,
  IconPhone,
  IconRename,
  IconRevokeAdmin,
  IconSearch,
  IconSetAdmin,
  IconShare,
  IconTransferOwner,
  IconUserPlus,
  TUIAvatar,
  TUIDialog,
  TUIInput,
  TUIMessageBox,
  TUIToast,
  t,
} from '../../../base';
import UserPickerMobile from '../UserPickerMobile/UserPickerMobile.vue';
import type { PickedContactMobile } from '../UserPickerMobile/UserPickerMobile.vue';
import ParticipantActionSheet from './ParticipantActionSheet.vue';
import type { ParticipantActionItem } from './ParticipantActionSheet.vue';

/** The TUIErrorCode re-exported by atomicx has no admin-limit member, so the engine code is used directly. */
const ERROR_CODE_ADMIN_COUNT_LIMIT = 100020;
const CALL_TIMEOUT_SECONDS = 60;
const CALL_FAILED_HOLD_MS = 2000;

const { currentRoom, callUserToRoom, subscribeEvent, unsubscribeEvent } = useRoomState();
const { loginUserInfo } = useLoginState();
const {
  participantList,
  pendingParticipantList,
  localParticipant,
  getParticipantList,
  kickUser,
  setAdmin,
  revokeAdmin,
  transferOwner,
  closeParticipantDevice,
  inviteToOpenDevice,
  disableUserMessage,
  disableAllDevices,
  updateParticipantNameCard,
  unmuteMicrophone,
} = useRoomParticipantState();
const { openLocalMicrophone, closeLocalMicrophone, openLocalCamera, closeLocalCamera } = useDeviceState();

const query = ref('');
const joinedOpen = ref(true);
const pendingOpen = ref(true);
const inviteOpen = ref(false);
const hostSheetOpen = ref(false);
const memberSheetOpen = ref(false);
const targetUserId = ref('');
const renameOpen = ref(false);
const renameValue = ref('');
const failedCallIds = ref(new Set<string>());
const isBusy = ref(false);

const localUserId = computed(() => loginUserInfo.value?.userId || '');
const isRoomOwner = computed(() => Boolean(localUserId.value) && currentRoom.value?.roomOwner?.userId === localUserId.value);
const canManageMembers = computed(() => (
  isRoomOwner.value || localParticipant.value?.role === RoomParticipantRole.Admin
));
const isAllMicrophoneDisabled = computed(() => Boolean(currentRoom.value?.isAllMicrophoneDisabled));
const isAllCameraDisabled = computed(() => Boolean(currentRoom.value?.isAllCameraDisabled));
const isAllScreenShareDisabled = computed(() => Boolean(currentRoom.value?.isAllScreenShareDisabled));

function displayName(participant: RoomParticipant): string {
  return (participant.nameCard || participant.userName || participant.userId).trim();
}

function isLocal(participant: RoomParticipant): boolean {
  return Boolean(localUserId.value) && participant.userId === localUserId.value;
}

function canManage(participant: RoomParticipant): boolean {
  if (isLocal(participant) || !canManageMembers.value) {
    return false;
  }
  if (isRoomOwner.value) {
    return participant.role !== RoomParticipantRole.Owner;
  }
  return participant.role === RoomParticipantRole.GeneralUser;
}

function matchesQuery(participant: RoomParticipant): boolean {
  const keyword = query.value.trim().toLowerCase();
  return !keyword || displayName(participant).toLowerCase().includes(keyword);
}

/** Sharer first, then owner, self, admin; general members order by live media. */
function rank(participant: RoomParticipant): number[] {
  const micOn = participant.microphoneStatus === DeviceStatus.On;
  const camOn = participant.cameraStatus === DeviceStatus.On;
  let role = 3;
  if (participant.screenShareStatus === DeviceStatus.On) {
    role = -1;
  } else if (participant.role === RoomParticipantRole.Owner) {
    role = 0;
  } else if (isLocal(participant)) {
    role = 1;
  } else if (participant.role === RoomParticipantRole.Admin) {
    role = 2;
  }
  let media = 3;
  if (micOn && camOn) {
    media = 0;
  } else if (camOn) {
    media = 1;
  } else if (micOn) {
    media = 2;
  }
  return [role, role === 3 ? media : 0];
}

const visibleJoined = computed(() => participantList.value
  .filter(matchesQuery)
  .map(participant => ({ participant, order: rank(participant) }))
  .sort((a, b) => (a.order[0] - b.order[0]) || (a.order[1] - b.order[1])
    || displayName(a.participant).localeCompare(displayName(b.participant)))
  .map(item => item.participant));

const visiblePending = computed(() => (
  currentRoom.value?.roomId ? pendingParticipantList.value.filter(matchesQuery) : []
));

const idlePendingIds = computed(() => visiblePending.value
  .filter(item => item.roomStatus !== RoomParticipantStatus.InCalling && !failedCallIds.value.has(item.userId))
  .map(item => item.userId));

const isSearchEmpty = computed(() => (
  Boolean(query.value.trim()) && visibleJoined.value.length === 0 && visiblePending.value.length === 0
));

const searchEmptyDesc = computed(() => {
  const marker = '\u0000';
  const [before = '', after = ''] = t('Participants.SearchEmptyDesc', { query: marker }).split(marker);
  return [before, after];
});

const occupiedIds = computed(() => [
  ...participantList.value.map(item => item.userId),
  ...pendingParticipantList.value
    .filter(item => item.roomStatus === RoomParticipantStatus.InCalling)
    .map(item => item.userId),
]);

const target = computed(() => participantList.value.find(item => item.userId === targetUserId.value) ?? null);

function memberGroupsFor(participant: RoomParticipant): ParticipantActionItem[][] {
  const micOn = participant.microphoneStatus === DeviceStatus.On;
  const camOn = participant.cameraStatus === DeviceStatus.On;
  if (isLocal(participant)) {
    return [[
      { key: 'local-mic', label: t(micOn ? 'Participants.MicClose' : 'Participants.MicOpen'), icon: micOn ? IconMic : IconMicOff },
      { key: 'local-cam', label: t(camOn ? 'Participants.CamClose' : 'Participants.CamOpen'), icon: camOn ? IconCam : IconCamOff },
      { key: 'rename', label: t('Participants.Rename'), icon: IconRename },
    ]];
  }
  const manageable = canManage(participant);
  const identity: ParticipantActionItem[] = [];
  if (manageable) {
    identity.push({ key: 'rename', label: t('Participants.Rename'), icon: IconRename });
  }
  if (isRoomOwner.value) {
    identity.push({ key: 'transfer', label: t('Participants.TransferOwner'), icon: IconTransferOwner });
    if (participant.role === RoomParticipantRole.GeneralUser) {
      identity.push({ key: 'set-admin', label: t('Participants.SetAdmin'), icon: IconSetAdmin });
    } else if (participant.role === RoomParticipantRole.Admin) {
      identity.push({ key: 'revoke-admin', label: t('Participants.RevokeAdmin'), icon: IconRevokeAdmin });
    }
  }
  if (!manageable) {
    return identity.length ? [identity] : [];
  }
  const media: ParticipantActionItem[] = [
    { key: micOn ? 'mic-close' : 'mic-invite', label: t(micOn ? 'Participants.AudioDisable' : 'Participants.AudioAllow'), icon: micOn ? IconMic : IconMicOff },
    { key: camOn ? 'cam-close' : 'cam-invite', label: t(camOn ? 'Participants.VideoDisable' : 'Participants.VideoAllow'), icon: camOn ? IconCam : IconCamOff },
    {
      key: 'chat',
      label: t(participant.isMessageDisabled ? 'Participants.ChatUnmute' : 'Participants.ChatMute'),
      icon: participant.isMessageDisabled ? IconChatOff : IconChat,
    },
  ];
  const danger: ParticipantActionItem[] = [{ key: 'kick', label: t('Participants.Kick'), icon: IconKick, danger: true }];
  return [identity, media, danger].filter(group => group.length > 0);
}

function hasActions(participant: RoomParticipant): boolean {
  return memberGroupsFor(participant).length > 0;
}

const memberGroups = computed(() => (target.value ? memberGroupsFor(target.value) : []));

const hostGroups = computed<ParticipantActionItem[][]>(() => [[
  {
    key: 'share-all',
    label: t(isAllScreenShareDisabled.value ? 'Participants.ShareEveryone' : 'Participants.ShareOwnerOnly'),
    active: isAllScreenShareDisabled.value,
  },
]]);

// The sheet's target can leave the room or lose its last action while the sheet is open.
watch(memberGroups, (groups) => {
  if (memberSheetOpen.value && groups.length === 0) {
    memberSheetOpen.value = false;
  }
});

function openMemberSheet(participant: RoomParticipant) {
  if (!hasActions(participant)) {
    return;
  }
  targetUserId.value = participant.userId;
  memberSheetOpen.value = true;
}

/** Runs one engine call at a time; returns the error so callers can pick the failure copy. */
async function run(action: () => Promise<unknown>): Promise<{ ok: boolean; error?: unknown }> {
  if (isBusy.value) {
    return { ok: false };
  }
  isBusy.value = true;
  try {
    await action();
    return { ok: true };
  } catch (error) {
    console.error('[RoomKit.participant] action failed:', error);
    return { ok: false, error };
  } finally {
    isBusy.value = false;
  }
}

function canOpenDespitePolicy(): boolean {
  const role = localParticipant.value?.role;
  return role === RoomParticipantRole.Owner || role === RoomParticipantRole.Admin;
}

async function runMemberAction(key: string) {
  const participant = target.value;
  memberSheetOpen.value = false;
  if (!participant) {
    return;
  }
  const name = displayName(participant);
  const { userId } = participant;

  if (key === 'rename') {
    renameValue.value = name;
    renameOpen.value = true;
    return;
  }
  if (key === 'local-mic') {
    const open = participant.microphoneStatus !== DeviceStatus.On;
    if (open && isAllMicrophoneDisabled.value && !canOpenDespitePolicy()) {
      TUIToast.warning(t('Device.AllMicDisabled'));
      return;
    }
    const result = await run(async () => {
      if (!open) {
        await closeLocalMicrophone();
        return;
      }
      await openLocalMicrophone();
      await unmuteMicrophone();
    });
    if (result.ok) {
      TUIToast.success(t(open ? 'Participants.MicOpened' : 'Participants.MicClosed'));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  if (key === 'local-cam') {
    const open = participant.cameraStatus !== DeviceStatus.On;
    if (open && isAllCameraDisabled.value && !canOpenDespitePolicy()) {
      TUIToast.warning(t('Device.AllCamDisabled'));
      return;
    }
    const result = await run(() => (open ? openLocalCamera() : closeLocalCamera()));
    if (result.ok) {
      TUIToast.success(t(open ? 'Participants.CamOpened' : 'Participants.CamClosed'));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  if (key === 'transfer') {
    const confirmed = await TUIMessageBox.confirm({
      title: t('Participants.TransferOwner'),
      message: t('Participants.TransferOwnerMessage', { name }),
      confirmText: t('Participants.TransferOwnerConfirm'),
      cancelText: t('Participants.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    const result = await run(() => transferOwner({ userId }));
    if (result.ok) {
      TUIToast.success(t('Participants.TransferOwnerDone', { name }));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  if (key === 'kick') {
    const confirmed = await TUIMessageBox.danger({
      title: t('Participants.Kick'),
      message: t('Participants.KickMessage', { name }),
      confirmText: t('Participants.KickConfirm'),
      cancelText: t('Participants.Cancel'),
    });
    if (!confirmed) {
      return;
    }
    const result = await run(() => kickUser({ userId }));
    if (result.ok) {
      TUIToast.success(t('Participants.KickDone', { name }));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  if (key === 'set-admin' || key === 'revoke-admin') {
    const result = await run(() => (key === 'set-admin' ? setAdmin({ userId }) : revokeAdmin({ userId })));
    if (result.ok) {
      TUIToast.success(t(key === 'set-admin' ? 'Participants.SetAdminDone' : 'Participants.RevokeAdminDone', { name }));
    } else if ((result.error as { code?: number } | undefined)?.code === ERROR_CODE_ADMIN_COUNT_LIMIT) {
      TUIToast.warning(t('Participants.ActionFailure.admin-limit'));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  if (key === 'chat') {
    const disable = !participant.isMessageDisabled;
    const result = await run(() => disableUserMessage({ userId, disable }));
    if (result.ok) {
      TUIToast.success(t(disable ? 'Participants.ChatMuted' : 'Participants.ChatUnmuted', { name }));
    } else if (result.error) {
      TUIToast.error(t('Participants.ActionFailure.failed'));
    }
    return;
  }
  const device = key.startsWith('mic') ? DeviceType.Microphone : DeviceType.Camera;
  const close = key.endsWith('close');
  const result = await run(() => (close
    ? closeParticipantDevice({ userId, deviceType: device })
    : inviteToOpenDevice({ userId, device, timeout: 30 })));
  if (result.ok) {
    const doneKeys = device === DeviceType.Microphone
      ? ['Participants.MuteDone', 'Participants.UnmuteRequested']
      : ['Participants.CamStopDone', 'Participants.CamRequested'];
    TUIToast.success(t(doneKeys[close ? 0 : 1], { name }));
  } else if (result.error) {
    TUIToast.error(t('Participants.ActionFailure.failed'));
  }
}

async function submitRename() {
  const participant = target.value;
  const nameCard = renameValue.value.trim();
  if (!participant || !nameCard) {
    return;
  }
  const result = await run(() => updateParticipantNameCard({ userId: participant.userId, nameCard }));
  if (result.ok) {
    renameOpen.value = false;
    TUIToast.success(t('Participants.RenameDone'));
  } else if (result.error) {
    TUIToast.error(t('Participants.ActionFailure.failed'));
  }
}

async function toggleAllDevice(deviceType: DeviceType.Microphone | DeviceType.Camera) {
  const isMic = deviceType === DeviceType.Microphone;
  const disable = !(isMic ? isAllMicrophoneDisabled.value : isAllCameraDisabled.value);
  const result = await run(() => disableAllDevices({ deviceType, disable }));
  if (result.ok) {
    const doneKeys = isMic
      ? ['Participants.MuteAllDone', 'Participants.UnmuteAllDone']
      : ['Participants.CamOffAllDone', 'Participants.CamOnAllDone'];
    TUIToast.success(t(doneKeys[disable ? 0 : 1]));
  } else if (result.error) {
    TUIToast.error(t('Participants.ActionFailure.failed'));
  }
}

async function runHostAction(key: string) {
  if (key !== 'share-all') {
    return;
  }
  const disable = !isAllScreenShareDisabled.value;
  const generalSharing = participantList.value.some(participant => (
    participant.screenShareStatus === DeviceStatus.On && participant.role === RoomParticipantRole.GeneralUser
  ));
  if (disable && generalSharing) {
    const confirmed = await TUIMessageBox.confirm({
      title: t('Participants.ShareOwnerOnlyTitle'),
      message: t('Participants.ShareOwnerOnlyMessage'),
      confirmText: t('Participants.Confirm'),
      cancelText: t('Participants.Cancel'),
    });
    if (!confirmed) {
      return;
    }
  }
  const result = await run(() => disableAllDevices({ deviceType: DeviceType.ScreenShare, disable }));
  if (result.ok) {
    TUIToast.success(t(disable ? 'Participants.ShareOwnerOnlyDone' : 'Participants.ShareEveryoneDone'));
  } else if (result.error) {
    TUIToast.error(t('Participants.ActionFailure.failed'));
  }
}

const failTimers = new Map<string, ReturnType<typeof setTimeout>>();

function markCallFailed(userId: string) {
  clearTimeout(failTimers.get(userId));
  failedCallIds.value = new Set(failedCallIds.value).add(userId);
  failTimers.set(userId, setTimeout(() => {
    failTimers.delete(userId);
    const next = new Set(failedCallIds.value);
    next.delete(userId);
    failedCallIds.value = next;
  }, CALL_FAILED_HOLD_MS));
}

function nameList(names: string[]): string {
  const shown = names.slice(0, 3).join(t('Participants.NameSeparator'));
  return names.length > 3 ? t('Participants.NameOverflow', { names: shown, count: names.length }) : shown;
}

async function callUsers(users: Array<{ userId: string; name: string }> | RoomParticipant[]) {
  const roomId = currentRoom.value?.roomId;
  if (!roomId) {
    TUIToast.warning(t('Participants.InviteFailure.no-room'));
    return false;
  }
  const list = users.map(user => ({
    userId: user.userId,
    name: 'name' in user ? user.name : displayName(user),
  }));
  if (list.length === 0) {
    TUIToast.warning(t('Participants.CallAllEmpty'));
    return false;
  }
  let results: Map<string, RoomCallResult> | undefined;
  const result = await run(async () => {
    results = await callUserToRoom({ roomId, userIdList: list.map(item => item.userId), timeout: CALL_TIMEOUT_SECONDS });
  });
  if (!result.ok) {
    if (result.error) {
      TUIToast.error(t('Participants.InviteFailure.failed'));
    }
    return false;
  }
  results?.forEach((callResult, userId) => {
    if (callResult === RoomCallResult.AlreadyInCalling) {
      markCallFailed(userId);
    }
  });
  TUIToast.success(t('Participants.CallStarted', { name: nameList(list.map(item => item.name)) }));
  return true;
}

function callAll() {
  const ids = new Set(idlePendingIds.value);
  void callUsers(visiblePending.value.filter(item => ids.has(item.userId)));
}

async function inviteContacts(contacts: PickedContactMobile[]) {
  const occupied = new Set(occupiedIds.value);
  const fresh = contacts.filter(contact => !occupied.has(contact.userId));
  if (await callUsers(fresh.map(contact => ({ userId: contact.userId, name: contact.userName })))) {
    inviteOpen.value = false;
  }
}

function onCallFailed({ roomInfo, call }: { roomInfo: RoomInfo; call: RoomCall }) {
  if (roomInfo.roomId === currentRoom.value?.roomId && call.caller.userId === localUserId.value) {
    markCallFailed(call.callee.userId);
  }
}

onMounted(() => {
  subscribeEvent(RoomEvent.onCallRejected, onCallFailed);
  subscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
  if (currentRoom.value?.roomId) {
    getParticipantList({ cursor: '' }).catch((error: unknown) => {
      console.error('[RoomKit.participant] Failed to load participants:', error);
    });
  }
});

onBeforeUnmount(() => {
  unsubscribeEvent(RoomEvent.onCallRejected, onCallFailed);
  unsubscribeEvent(RoomEvent.onCallTimeout, onCallFailed);
  failTimers.forEach(timer => clearTimeout(timer));
  failTimers.clear();
});
</script>

<style scoped lang="scss">
.participant-list-mobile {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.participant-list-mobile-body {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
  padding: 0 16px 8px;
  overflow: hidden auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.participant-list-mobile-toolbar {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

/* TUIInput root: the only place this package restyles a base component. */
.participant-list-mobile-toolbar .participant-list-mobile-search {
  box-sizing: border-box;
  flex: 1;
  gap: 6px;
  min-width: 0;
  height: 32px;
  min-height: 32px;
  padding: 0 10px;
  font-size: var(--rk-fs-sm);
  background: var(--rk-bg-surface);
  border-color: var(--rk-border);
  border-radius: 999px;
}

.participant-list-mobile-search :deep(.rk-input-addon),
.participant-list-mobile-search :deep(.rk-input-field) {
  padding: 0;
}

.participant-list-mobile-toolbar .participant-list-mobile-search:focus-within {
  border-color: var(--rk-border-strong);
}

.participant-list-mobile-search-icon {
  color: var(--rk-text-tertiary);
}

.participant-list-mobile-invite {
  box-sizing: border-box;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 50%;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-invite:active {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
  transform: scale(0.96);
}

.participant-list-mobile-section {
  flex-shrink: 0;
  padding-top: 8px;
  margin-top: 10px;
  border-top: 1px solid var(--rk-border);
}

.participant-list-mobile-section:first-of-type {
  padding-top: 0;
  margin-top: 0;
  border-top: 0;
}

.participant-list-mobile-section-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  padding: 0 0 4px 8px;
}

.participant-list-mobile-section-toggle {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  font-size: var(--rk-fs-sm);
  min-height: 28px;
  font-weight: 600;
  color: var(--rk-text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-section-chev {
  color: var(--rk-text-tertiary);
  transition: transform 0.16s ease;
}

.participant-list-mobile-section-chev.is-collapsed {
  transform: rotate(-90deg);
}

.participant-list-mobile-section-count {
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-tertiary);
}

.participant-list-mobile-call-all {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding-left: 8px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  color: var(--rk-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-call-all:active {
  transform: scale(0.96);
}

.participant-list-mobile-call-all.is-disabled {
  pointer-events: none;
  opacity: 0.45;
}

.participant-list-mobile-section-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.participant-list-mobile-section-empty {
  padding: 18px 16px 22px;
  font-size: var(--rk-fs-sm);
  line-height: 1.4;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.participant-list-mobile-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 8px 0;
}

.participant-list-mobile-row.is-tappable {
  padding: 8px 16px;
  margin: 0 -16px;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-row.is-tappable:active,
.participant-list-mobile-row.is-tappable:focus-visible {
  background: var(--rk-bg-hover);
}

.participant-list-mobile-info {
  flex: 1;
  min-width: 0;
}

.participant-list-mobile-name {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  line-height: 18px;
  color: var(--rk-text-primary);
}

.participant-list-mobile-name-text {
  flex: 0 1 auto;
  min-width: 1em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-list-mobile-tag {
  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  gap: 3px;
  align-items: center;
  justify-content: center;
  height: 18px;
  padding: 0 6px;
  font-size: var(--rk-fs-xs);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  white-space: nowrap;
  border-radius: 999px;
}

.participant-list-mobile-tag.is-owner,
.participant-list-mobile-tag.is-sharing {
  color: color-mix(in srgb, var(--rk-brand) 78%, #000);
  background: color-mix(in srgb, var(--rk-brand) 20%, var(--rk-bg-surface));
}

.participant-list-mobile-tag.is-admin {
  color: color-mix(in srgb, var(--rk-warning) 58%, #000);
  background: color-mix(in srgb, var(--rk-warning) 20%, var(--rk-bg-surface));
}

.rk-root[data-rk-theme='dark'] .participant-list-mobile-tag.is-owner,
.rk-root[data-rk-theme='dark'] .participant-list-mobile-tag.is-sharing {
  color: color-mix(in srgb, var(--rk-brand) 70%, #fff);
}

.rk-root[data-rk-theme='dark'] .participant-list-mobile-tag.is-admin {
  color: var(--rk-warning);
}

.participant-list-mobile-tag.is-self {
  color: var(--rk-text-secondary);
  background: color-mix(in srgb, var(--rk-text-primary) 10%, var(--rk-bg-surface));
}

.participant-list-mobile-icons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.participant-list-mobile-status {
  display: inline-flex;
  flex: 0 0 26px;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--rk-text-tertiary);
}

.participant-list-mobile-wait {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  min-width: 36px;
}

.participant-list-mobile-wait-call {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  color: var(--rk-on-accent);
  cursor: pointer;
  background: var(--rk-success);
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-wait-call:active {
  transform: scale(0.96);
}

.participant-list-mobile-wait-call.is-calling {
  width: auto;
  padding-right: 2px;
  font-weight: 500;
  color: var(--rk-success);
  cursor: default;
  background: transparent;
  border-radius: 0;
}

.participant-list-mobile-wait-pulse {
  animation: participant-list-mobile-pulse 1.5s ease-in-out infinite;
}

.participant-list-mobile-wait-failed {
  max-width: 120px;
  padding: 0 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  line-height: 1.25;
  color: var(--rk-text-tertiary);
  text-align: right;
}

@keyframes participant-list-mobile-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.45;
    transform: scale(0.85);
  }
}

.participant-list-mobile-empty {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px 20px 40px;
  color: var(--rk-text-tertiary);
  text-align: center;
  animation: participant-list-mobile-empty-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.participant-list-mobile-empty-art {
  display: block;
  width: 80px;
  height: 64px;
  margin-bottom: 14px;
  overflow: visible;

  .art-card {
    fill: color-mix(in srgb, var(--rk-text-primary) 4%, var(--rk-bg-surface));
    stroke: color-mix(in srgb, var(--rk-text-primary) 10%, transparent);
    stroke-width: 1;
  }

  .art-dim {
    fill: color-mix(in srgb, var(--rk-text-primary) 13%, transparent);
  }

  .art-faint {
    fill: color-mix(in srgb, var(--rk-text-primary) 7%, transparent);
  }

  .art-lens {
    fill: color-mix(in srgb, var(--rk-brand) 10%, var(--rk-bg-surface));
    stroke: var(--rk-brand);
    stroke-width: 3;
  }

  .art-handle {
    stroke: var(--rk-brand);
    stroke-linecap: round;
    stroke-width: 4;
  }

  .art-mark {
    opacity: 0.7;
    stroke: var(--rk-brand);
    stroke-linecap: round;
    stroke-width: 2.2;
  }
}

.participant-list-mobile-empty-title {
  font-size: var(--rk-fs-md);
  font-weight: 600;
  line-height: 1.4;
  color: var(--rk-text-primary);
}

.participant-list-mobile-empty-desc {
  max-width: 240px;
  margin-top: 4px;
  font-size: var(--rk-fs-sm);
  line-height: 1.5;
  overflow-wrap: anywhere;

  mark {
    padding: 0;
    font-weight: 500;
    color: var(--rk-text-primary);
    background: none;
  }
}

.participant-list-mobile-empty-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.participant-list-mobile-empty-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  height: 34px;
  padding: 0 18px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-empty-btn:active {
  transform: scale(0.97);
}

.participant-list-mobile-empty-btn.is-primary {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-color: transparent;
}

@keyframes participant-list-mobile-empty-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.participant-list-mobile-footer {
  position: relative;
  z-index: 2;
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  padding: 10px 16px 14px;
  background: var(--rk-bg-surface);
}

.participant-list-mobile-footer-btn {
  box-sizing: border-box;
  display: inline-flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 34px;
  padding: 0 8px;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}

.participant-list-mobile-footer-btn:active {
  background: var(--rk-bg-hover);
}

.participant-list-mobile-footer-btn.is-on {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-color: color-mix(in srgb, var(--rk-brand) 28%, transparent);
}

.participant-list-mobile-rename-desc {
  margin: 0 0 16px;
  font-size: var(--rk-fs-md);
  line-height: 1.45;
  color: var(--rk-text-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .participant-list-mobile-wait-pulse,
  .participant-list-mobile-empty {
    animation: none;
  }
}
</style>
