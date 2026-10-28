<template>
  <div class="participant-panel">
    <div class="participant-panel-toolbar">
      <TUIInput
        v-model="searchKeyword"
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
        @click="openInvitePicker"
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
        :class="{ 'is-fill': joinedTall }"
      >
        <header class="participant-panel-heading">
          <button
            class="participant-panel-toggle"
            type="button"
            :aria-expanded="joinedExpanded"
            :title="joinedExpanded ? t('Participants.Collapse') : t('Participants.Expand')"
            @click="joinedExpanded = !joinedExpanded"
          >
            <IconChevron :size="12" :class="{ 'is-collapsed': !joinedExpanded }" />
            <span class="participant-panel-title">{{ t('Participants.Joined') }}</span>
            <span class="participant-panel-count">{{ joinedCount }}</span>
          </button>
        </header>
        <div v-if="joinedExpanded" class="participant-panel-rows">
          <div v-if="joinedRows.length === 0" class="participant-panel-empty">
            {{ t('Participants.Empty') }}
          </div>
          <ParticipantRow v-for="row in joinedRows" :key="row.userId" :row="row" />
        </div>
      </section>

      <section
        v-if="hasPending"
        ref="pendingSectionRef"
        class="participant-panel-section"
        :class="{ 'is-fill': pendingTall }"
      >
        <header class="participant-panel-heading">
          <button
            class="participant-panel-toggle"
            type="button"
            :aria-expanded="pendingExpanded"
            :title="pendingExpanded ? t('Participants.Collapse') : t('Participants.Expand')"
            @click="pendingExpanded = !pendingExpanded"
          >
            <IconChevron :size="12" :class="{ 'is-collapsed': !pendingExpanded }" />
            <span class="participant-panel-title">{{ t('Participants.Pending') }}</span>
            <span class="participant-panel-count">{{ pendingCount }}</span>
          </button>
          <button
            class="participant-panel-call-all"
            type="button"
            :disabled="!canCallAll"
            :title="t('Participants.CallAllTip')"
            @click.stop="callAll"
          >
            {{ t('Participants.CallAll') }}
          </button>
        </header>
        <div v-if="pendingExpanded" class="participant-panel-rows">
          <div v-if="pendingRows.length === 0" class="participant-panel-empty">
            {{ t('Participants.Empty') }}
          </div>
          <PendingRow v-for="row in pendingRows" :key="row.userId" :row="row" />
        </div>
      </section>
    </div>

    <footer v-if="canManageMembers" class="participant-panel-footer">
      <button
        class="participant-panel-footer-btn"
        type="button"
        :class="{ 'is-on': microphoneControl.active }"
        @click="toggleAllMicrophone"
      >
        {{ microphoneControl.label }}
      </button>
      <button
        class="participant-panel-footer-btn"
        type="button"
        :class="{ 'is-on': cameraControl.active }"
        @click="toggleAllCamera"
      >
        {{ cameraControl.label }}
      </button>
      <TUIDropdown
        trigger="click"
        placement="top-end"
        @update:open="moreMenuOpen = $event"
        @command="toggleAllScreenShare"
      >
        <button
          class="participant-panel-footer-btn"
          type="button"
          :class="{ 'is-open': moreMenuOpen }"
        >
          {{ t('Participants.More') }}
        </button>
        <template #menu>
          <div class="participant-panel-menu">
            <TUIDropdownItem
              :command="screenShareControl.key"
              :class="{ 'is-on': screenShareControl.active }"
            >
              {{ screenShareControl.label }}
            </TUIDropdownItem>
          </div>
        </template>
      </TUIDropdown>
    </footer>

    <UserPickerPC v-model:open="invitePickerOpen" :occupied-ids="occupiedIds" @confirm="inviteContacts" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  TUIButton,
  TUIDropdown,
  TUIDropdownItem,
  TUIInput,
  IconChevron,
  IconSearch,
  IconUserPlus,
  t,
} from '../../../base';
import { useParticipantCall, useRoomControlActions } from '../participantActions';
import { useParticipantAutoLoad, useParticipantList, useRoomControls } from '../participantData';
import UserPickerPC from '../UserPickerPC/UserPickerPC.vue';
import ParticipantRow from './ParticipantRow.vue';
import PendingRow from './PendingRow.vue';
import { useSectionFlex } from './useSectionFlex';

const joinedExpanded = ref(true);
const pendingExpanded = ref(true);
const moreMenuOpen = ref(false);

useParticipantAutoLoad();
const {
  searchKeyword,
  joinedRows,
  pendingRows,
  joinedCount,
  pendingCount,
  hasPending,
  canCallAll,
  occupiedIds,
} = useParticipantList();
const { canManageMembers, microphoneControl, cameraControl, screenShareControl } = useRoomControls();
const { toggleAllMicrophone, toggleAllCamera, toggleAllScreenShare } = useRoomControlActions();
const { invitePickerOpen, openInvitePicker, callAll, inviteContacts } = useParticipantCall();
const { bodyRef, joinedSectionRef, pendingSectionRef, joinedTall, pendingTall, isBothTall } = useSectionFlex(
  () => [joinedRows.value.length, pendingRows.value.length, joinedExpanded.value, pendingExpanded.value, hasPending.value],
);
</script>

<style scoped lang="scss" src="./ParticipantListPC.scss"></style>
