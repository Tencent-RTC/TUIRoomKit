<template>
  <div class="participant-panel">
    <div class="participant-panel-toolbar">
      <TUIInput
        v-model="query"
        class="participant-panel-search"
        type="text"
        size="sm"
        :placeholder="t('Participants.SearchPlaceholder')"
        clearable
      >
        <template #prefix>
          <IconSearch :size="14" />
        </template>
      </TUIInput>
      <TUIButton
        class="participant-panel-invite"
        variant="ghost"
        size="sm"
        :title="t('Participants.Invite')"
        :aria-label="t('Participants.Invite')"
        @click="inviteOpen = true"
      >
        <IconUserPlus :size="16" />
      </TUIButton>
    </div>

    <div
      ref="bodyRef"
      class="participant-panel-body"
      :class="{ 'is-both-tall': isBothTall }"
    >
      <section
        ref="joinedSectionRef"
        class="participant-panel-section"
        :class="{ 'is-fill': isJoinedFill }"
      >
        <header class="participant-panel-heading">
          <button
            class="participant-panel-toggle"
            type="button"
            :aria-expanded="!joinedCollapsed"
            :title="joinedCollapsed ? t('Participants.Expand') : t('Participants.Collapse')"
            @click="joinedCollapsed = !joinedCollapsed"
          >
            <IconChevron :size="12" :class="{ 'is-collapsed': joinedCollapsed }" />
            <span class="participant-panel-title">{{ t('Participants.Joined') }}</span>
            <span class="participant-panel-count">{{ joinedParticipants.length }}</span>
          </button>
        </header>
        <div v-if="!joinedCollapsed" class="participant-panel-rows">
          <div v-if="visibleJoined.length === 0" class="participant-panel-empty">
            {{ t('Participants.Empty') }}
          </div>
          <ParticipantRow
            v-for="participant in visibleJoined"
            :key="participant.userId"
            :participant="participant"
          />
        </div>
      </section>

      <section
        v-if="showPending"
        ref="pendingSectionRef"
        class="participant-panel-section"
        :class="{ 'is-fill': isPendingFill }"
      >
        <header class="participant-panel-heading">
          <button
            class="participant-panel-toggle"
            type="button"
            :aria-expanded="!pendingCollapsed"
            :title="pendingCollapsed ? t('Participants.Expand') : t('Participants.Collapse')"
            @click="pendingCollapsed = !pendingCollapsed"
          >
            <IconChevron :size="12" :class="{ 'is-collapsed': pendingCollapsed }" />
            <span class="participant-panel-title">{{ t('Participants.Pending') }}</span>
            <span class="participant-panel-count">{{ pendingParticipants.length }}</span>
          </button>
          <button
            class="participant-panel-call-all"
            type="button"
            :disabled="idlePending.length === 0"
            :title="t('Participants.CallAllTip')"
            @click.stop="callAll"
          >
            {{ t('Participants.CallAll') }}
          </button>
        </header>
        <div v-if="!pendingCollapsed" class="participant-panel-rows">
          <div v-if="visiblePending.length === 0" class="participant-panel-empty">
            {{ t('Participants.Empty') }}
          </div>
          <PendingRow
            v-for="participant in visiblePending"
            :key="participant.userId"
            :participant="participant"
          />
        </div>
      </section>
    </div>

    <footer v-if="canManageMembers" class="participant-panel-footer">
      <button
        class="participant-panel-footer-btn"
        type="button"
        :class="{ 'is-on': isAllMicrophoneDisabled }"
        @click="toggleAllMic"
      >
        {{ isAllMicrophoneDisabled ? t('Participants.UnmuteAll') : t('Participants.MuteAll') }}
      </button>
      <button
        class="participant-panel-footer-btn"
        type="button"
        :class="{ 'is-on': isAllCameraDisabled }"
        @click="toggleAllCam"
      >
        {{ isAllCameraDisabled ? t('Participants.CamOnAll') : t('Participants.CamOffAll') }}
      </button>
      <TUIDropdown
        trigger="click"
        placement="top-end"
        @update:open="moreOpen = $event"
        @command="handleMore"
      >
        <button
          class="participant-panel-footer-btn"
          type="button"
          :class="{ 'is-open': moreOpen }"
        >
          {{ t('Participants.More') }}
        </button>
        <template #menu>
          <div class="participant-panel-menu">
            <TUIDropdownItem
              command="share"
              :class="{ 'is-on': isAllScreenShareDisabled }"
            >
              {{ isAllScreenShareDisabled ? t('Participants.ShareEveryone') : t('Participants.ShareOwnerOnly') }}
            </TUIDropdownItem>
          </div>
        </template>
      </TUIDropdown>
    </footer>

    <InviteDialog v-model:open="inviteOpen" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  DeviceStatus,
  DeviceType,
  RoomParticipantRole,
} from 'tuikit-atomicx-vue3/room';
import {
  TUIButton,
  TUIDropdown,
  TUIDropdownItem,
  TUIInput,
  IconChevron,
  IconSearch,
  IconUserPlus,
  TUIMessageBox,
  TUIToast,
  t,
} from '../../../base';
import InviteDialog from './InviteDialog.vue';
import ParticipantRow from './ParticipantRow.vue';
import PendingRow from './PendingRow.vue';
import { formatNameList, participantDisplayName, useParticipantActions, useParticipantList } from './useParticipant';
import { useInvitation } from './useInvitation';
import type { ParticipantFailure } from './useParticipant';
import type { InvitationFailure } from './useInvitation';
import type { RoomParticipant } from 'tuikit-atomicx-vue3/room';

const query = ref('');
const inviteOpen = ref(false);
const moreOpen = ref(false);
const joinedCollapsed = ref(false);
const pendingCollapsed = ref(false);
const bodyRef = ref<HTMLElement | null>(null);
const joinedSectionRef = ref<HTMLElement | null>(null);
const pendingSectionRef = ref<HTMLElement | null>(null);
const joinedTall = ref(false);
const pendingTall = ref(false);

const {
  canManageMembers,
  isAllMicrophoneDisabled,
  isAllCameraDisabled,
  isAllScreenShareDisabled,
  setAllDevicesDisabled,
} = useParticipantActions();
const { joinedParticipants, pendingParticipants, refreshParticipants } = useParticipantList();
const { idlePending, callAllPending } = useInvitation();

const isJoinedFill = computed(() => joinedTall.value);
const isPendingFill = computed(() => pendingTall.value);
const isBothTall = computed(() => joinedTall.value && pendingTall.value);

function sectionContentHeight(section: HTMLElement | null): number {
  if (!section) {
    return 0;
  }
  const heading = section.querySelector('.participant-panel-heading');
  const rows = section.querySelector('.participant-panel-rows');
  const styles = getComputedStyle(section);
  return Number.parseFloat(styles.paddingTop)
    + Number.parseFloat(styles.borderTopWidth)
    + (heading instanceof HTMLElement ? heading.offsetHeight : 0)
    + (rows instanceof HTMLElement ? rows.scrollHeight : 0);
}

function syncSectionFlex() {
  const body = bodyRef.value;
  if (!body) {
    return;
  }
  // A group is "tall" when its natural content would exceed half the body.
  const cap = body.clientHeight / 2;
  joinedTall.value = sectionContentHeight(joinedSectionRef.value) > cap;
  pendingTall.value = sectionContentHeight(pendingSectionRef.value) > cap;
}

let resizeObserver: ResizeObserver | null = null;

function observeSections() {
  resizeObserver?.disconnect();
  if (!resizeObserver) {
    return;
  }
  if (bodyRef.value) {
    resizeObserver.observe(bodyRef.value);
  }
  if (joinedSectionRef.value) {
    resizeObserver.observe(joinedSectionRef.value);
  }
  if (pendingSectionRef.value) {
    resizeObserver.observe(pendingSectionRef.value);
  }
  syncSectionFlex();
}

onMounted(() => {
  void refreshParticipants();
  resizeObserver = new ResizeObserver(() => {
    syncSectionFlex();
  });
  observeSections();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch([bodyRef, joinedSectionRef, pendingSectionRef], () => {
  observeSections();
});

function matchesQuery(participant: RoomParticipant): boolean {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  const name = participantDisplayName(participant).toLowerCase();
  return name.includes(keyword) || participant.userId.toLowerCase().includes(keyword);
}

const visibleJoined = computed(() => joinedParticipants.value.filter(matchesQuery));
const visiblePending = computed(() => pendingParticipants.value.filter(matchesQuery));
const showPending = computed(() => pendingParticipants.value.length > 0);

watch(
  [visibleJoined, visiblePending, joinedCollapsed, pendingCollapsed, showPending],
  () => {
    void nextTick(syncSectionFlex);
  },
);

const invitationFailureKey: Record<InvitationFailure, string> = {
  'no-room': 'Participants.InviteFailure.no-room',
  'empty': 'Participants.CallAllEmpty',
  'failed': 'Participants.InviteFailure.failed',
};

function notifyParticipant(failure?: ParticipantFailure) {
  if (!failure) {
    return false;
  }
  TUIToast[failure === 'failed' ? 'error' : 'warning'](t(`Participants.ActionFailure.${failure}`));
  return true;
}

function notifyInvitation(failure?: InvitationFailure) {
  if (!failure) {
    return false;
  }
  TUIToast[failure === 'failed' ? 'error' : 'warning'](t(invitationFailureKey[failure]));
  return true;
}

async function callAll() {
  const name = formatNameList(idlePending.value.map(participantDisplayName));
  if (notifyInvitation(await callAllPending())) {
    return;
  }
  TUIToast.success(t('Participants.CallAllStarted', { name }));
}

async function toggleAllMic() {
  const disable = !isAllMicrophoneDisabled.value;
  if (notifyParticipant(await setAllDevicesDisabled(DeviceType.Microphone, disable))) {
    return;
  }
  TUIToast.success(t(disable ? 'Participants.MuteAllDone' : 'Participants.UnmuteAllDone'));
}

async function toggleAllCam() {
  const disable = !isAllCameraDisabled.value;
  if (notifyParticipant(await setAllDevicesDisabled(DeviceType.Camera, disable))) {
    return;
  }
  TUIToast.success(t(disable ? 'Participants.CamOffAllDone' : 'Participants.CamOnAllDone'));
}

async function toggleAllShare() {
  const disable = !isAllScreenShareDisabled.value;
  if (disable) {
    const generalSharing = joinedParticipants.value.some(participant =>
      participant.screenShareStatus === DeviceStatus.On
      && participant.role === RoomParticipantRole.GeneralUser,
    );
    if (generalSharing) {
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
  }
  if (notifyParticipant(await setAllDevicesDisabled(DeviceType.ScreenShare, disable))) {
    return;
  }
  TUIToast.success(t(disable ? 'Participants.ShareOwnerOnlyDone' : 'Participants.ShareEveryoneDone'));
}

async function handleMore(command: string | number) {
  if (command === 'share') {
    await toggleAllShare();
  }
}
</script>

<style scoped lang="scss">
.participant-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.participant-panel-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 10px;
}

.participant-panel-toolbar .participant-panel-search {
  box-sizing: border-box;
  flex: 1;
  gap: 6px;
  width: auto;
  min-width: 0;
  height: 32px;
  min-height: 32px;
  padding: 0 10px;
  color: var(--rk-text-secondary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 999px;
}

.participant-panel-toolbar .participant-panel-search:focus-within {
  border-color: var(--rk-border-strong);
}

.participant-panel-search :deep(.rk-input-addon) {
  padding: 0;
}

.participant-panel-search :deep(.rk-icon) {
  flex: none;
  width: 14px;
  height: 14px;
  color: var(--rk-text-tertiary);
}

.participant-panel-search :deep(.rk-input-field) {
  padding: 0;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-primary);
}

.participant-panel-search :deep(.rk-input-field::placeholder) {
  color: var(--rk-text-tertiary);
}

.participant-panel-toolbar .participant-panel-invite.rk-btn {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  min-width: 32px;
  height: 32px;
  padding: 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 50%;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.08s ease;
}

.participant-panel-toolbar .participant-panel-invite.rk-btn:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-muted);
  border-color: var(--rk-border-strong);
}

.participant-panel-toolbar .participant-panel-invite.rk-btn:active {
  transform: scale(0.96);
}

.participant-panel-invite :deep(.rk-icon) {
  width: 16px;
  height: 16px;
}

.participant-panel-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 8px 8px;
  overflow: hidden;
}

/* Short groups stay content-sized. Tall groups grow with flex:1. */
.participant-panel-section {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  min-height: min-content;
  overflow: hidden;
}

.participant-panel-section.is-fill {
  flex: 1 1 auto;
  min-height: 0;
}

/* Force the list to use the flexed leftover and scroll inside it. */
.participant-panel-section.is-fill .participant-panel-rows {
  height: 0;
}

/* Only cap at half when both groups need more than half. */
.participant-panel-body.is-both-tall .participant-panel-section.is-fill {
  max-height: 50%;
}

/* Only the groups below the first one carry the separator. */
.participant-panel-section + .participant-panel-section {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--rk-border);
}

.participant-panel-heading {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  padding: 0 8px 4px;
}

.participant-panel-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--rk-text-secondary);
  font: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  cursor: pointer;
}

.participant-panel-toggle:hover {
  color: var(--rk-text-primary);
}

.participant-panel-toggle :deep(.rk-icon) {
  width: 12px;
  height: 12px;
  flex: none;
  color: var(--rk-text-tertiary);
  transition: transform 0.16s ease;
}

.participant-panel-toggle:hover :deep(.rk-icon) {
  color: var(--rk-text-secondary);
}

.participant-panel-toggle :deep(.is-collapsed) {
  transform: rotate(-90deg);
}

.participant-panel-title {
  line-height: 1;
}

.participant-panel-count {
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.participant-panel-rows {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-height: 0;
  overflow: auto;
  scrollbar-width: none;

  > * {
    flex-shrink: 0;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.participant-panel-call-all {
  display: inline-flex;
  align-items: center;
  height: 22px;
  flex: none;
  margin: 0;
  padding: 0 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--rk-text-secondary);
  font: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease, transform 0.08s ease;
}

.participant-panel-call-all:hover {
  color: var(--rk-text-primary);
}

.participant-panel-call-all:active {
  transform: scale(0.96);
}

.participant-panel-call-all:disabled {
  opacity: 0.45;
  cursor: default;
  pointer-events: none;
}

.participant-panel-empty {
  padding: 24px 8px;
  color: var(--rk-text-tertiary);
  font-size: var(--rk-fs-md);
  text-align: center;
}

.participant-panel-footer {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex: none;
  padding: 10px 12px 12px;
  /* The prototype keeps the footer border-free; the row list already ends the panel. */
  border-top: none;
}

.participant-panel-footer :deep(.rk-dropdown-anchor) {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
}

.participant-panel-footer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 34px;
  min-width: 0;
  flex: 1 1 0;
  margin: 0;
  padding: 0 8px;
  border: 1px solid var(--rk-border);
  border-radius: 999px;
  background: var(--rk-bg-surface);
  color: var(--rk-text-primary);
  font: inherit;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease, transform 0.08s ease;
}

.participant-panel-footer-btn:hover {
  background: var(--rk-bg-hover);
  border-color: var(--rk-border-strong);
}

.participant-panel-footer-btn:active {
  transform: scale(0.97);
}

.participant-panel-footer-btn.is-open {
  background: var(--rk-bg-hover);
  border-color: var(--rk-border-strong);
}

.participant-panel-footer-btn.is-on {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-color: color-mix(in srgb, var(--rk-brand) 28%, transparent);
}

.participant-panel-footer-btn.is-on:hover {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-color: color-mix(in srgb, var(--rk-brand) 28%, transparent);
}

.participant-panel-menu {
  width: 100%;
}

.participant-panel-menu :deep(.rk-dropdown-item) {
  min-height: 32px;
  padding: 6px 10px;
  font-size: var(--rk-fs-sm);
  line-height: 1.35;
  color: var(--rk-text-primary);
  text-align: left;
  overflow-wrap: break-word;
  white-space: normal;
  border-radius: 7px;
}

.participant-panel-menu :deep(.rk-dropdown-item:hover),
.participant-panel-menu :deep(.rk-dropdown-item[data-highlighted='true']) {
  background: var(--rk-bg-hover);
}

.participant-panel-menu :deep(.rk-dropdown-item.is-on) {
  color: var(--rk-brand);
}
</style>

<style lang="scss">
/* Teleported dropdown is outside this SFC tree, so the panel chrome is unscoped. */
.rk-dropdown:has(.participant-panel-menu) {
  box-sizing: border-box;
  width: max-content;
  min-width: 200px;
  max-width: 316px;
  padding: 6px;
  border-color: var(--rk-border-strong);
  border-radius: 10px;
  box-shadow: var(--rk-shadow-dialog);
}
</style>
