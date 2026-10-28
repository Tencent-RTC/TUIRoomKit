<template>
  <div class="participant-list-mobile">
    <div class="participant-list-mobile-body">
      <div class="participant-list-mobile-toolbar">
        <TUIInput
          v-model="searchKeyword"
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
          @click="openInvitePicker"
          @keydown.enter.prevent="openInvitePicker"
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
          {{ searchEmptyParts.before }}<mark>{{ searchEmptyParts.query }}</mark>{{ searchEmptyParts.after }}
        </div>
        <div class="participant-list-mobile-empty-actions">
          <div class="participant-list-mobile-empty-btn" role="button" tabindex="0" @click="searchKeyword = ''">
            {{ t('Participants.ClearSearch') }}
          </div>
          <div class="participant-list-mobile-empty-btn is-primary" role="button" tabindex="0" @click="openInvitePicker">
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
              :aria-expanded="joinedExpanded"
              @click="joinedExpanded = !joinedExpanded"
            >
              <IconChevron class="participant-list-mobile-section-chev" :class="{ 'is-collapsed': !joinedExpanded }" :size="12" />
              <span>{{ t('Participants.Joined') }}</span>
              <span class="participant-list-mobile-section-count">{{ joinedCount }}</span>
            </div>
          </div>
          <div v-if="joinedExpanded" class="participant-list-mobile-section-body">
            <ParticipantRow v-for="row in joinedRows" :key="row.userId" :row="row" @select="openMemberSheet" />
          </div>
        </section>

        <section v-if="!isSearching || pendingRows.length > 0" class="participant-list-mobile-section">
          <div class="participant-list-mobile-section-bar">
            <div
              class="participant-list-mobile-section-toggle"
              role="button"
              tabindex="0"
              :aria-expanded="pendingExpanded"
              @click="pendingExpanded = !pendingExpanded"
            >
              <IconChevron class="participant-list-mobile-section-chev" :class="{ 'is-collapsed': !pendingExpanded }" :size="12" />
              <span>{{ t('Participants.Pending') }}</span>
              <span class="participant-list-mobile-section-count">{{ pendingCount }}</span>
            </div>
            <div
              v-if="pendingRows.length"
              class="participant-list-mobile-call-all"
              :class="{ 'is-disabled': !canCallAll }"
              role="button"
              tabindex="0"
              @click="callAll"
            >
              {{ t('Participants.CallAll') }}
            </div>
          </div>
          <div v-if="pendingExpanded" class="participant-list-mobile-section-body">
            <div v-if="pendingRows.length === 0" class="participant-list-mobile-section-empty">
              {{ t('Participants.WaitingEmpty') }}
            </div>
            <PendingRow v-for="row in pendingRows" :key="row.userId" :row="row" />
          </div>
        </section>
      </template>
    </div>

    <footer v-if="canManageMembers" class="participant-list-mobile-footer">
      <div
        class="participant-list-mobile-footer-btn"
        :class="{ 'is-on': microphoneControl.active }"
        role="button"
        tabindex="0"
        @click="toggleAllMicrophone"
      >
        {{ microphoneControl.label }}
      </div>
      <div
        class="participant-list-mobile-footer-btn"
        :class="{ 'is-on': cameraControl.active }"
        role="button"
        tabindex="0"
        @click="toggleAllCamera"
      >
        {{ cameraControl.label }}
      </div>
      <div class="participant-list-mobile-footer-btn" role="button" tabindex="0" @click="moreSheetOpen = true">
        {{ t('Room.More') }}
      </div>
    </footer>

    <ParticipantMemberSheet v-model:open="memberSheetOpen" :user-id="selectedUserId" />
    <ParticipantActionSheet
      v-model:open="moreSheetOpen"
      :groups="[[screenShareControl]]"
      split
      @select="toggleAllScreenShare"
    />

    <UserPickerMobile v-model:open="invitePickerOpen" :occupied-ids="occupiedIds" @confirm="inviteContacts" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IconChevron,
  IconSearch,
  IconUserPlus,
  TUIInput,
  t,
} from '../../../base';
import { useParticipantCall, useRoomControlActions } from '../participantActions';
import { useParticipantAutoLoad, useParticipantList, useRoomControls } from '../participantData';
import UserPickerMobile from '../UserPickerMobile/UserPickerMobile.vue';
import ParticipantActionSheet from './ParticipantActionSheet.vue';
import ParticipantMemberSheet from './ParticipantMemberSheet.vue';
import ParticipantRow from './ParticipantRow.vue';
import PendingRow from './PendingRow.vue';

const joinedExpanded = ref(true);
const pendingExpanded = ref(true);
const moreSheetOpen = ref(false);
const memberSheetOpen = ref(false);
const selectedUserId = ref('');

useParticipantAutoLoad();
const {
  searchKeyword,
  isSearching,
  isSearchEmpty,
  searchEmptyParts,
  joinedRows,
  pendingRows,
  joinedCount,
  pendingCount,
  canCallAll,
  occupiedIds,
} = useParticipantList();
const { canManageMembers, microphoneControl, cameraControl, screenShareControl } = useRoomControls();
const { toggleAllMicrophone, toggleAllCamera, toggleAllScreenShare } = useRoomControlActions();
const { invitePickerOpen, openInvitePicker, callAll, inviteContacts } = useParticipantCall();

function openMemberSheet(userId: string) {
  selectedUserId.value = userId;
  memberSheetOpen.value = true;
}
</script>

<style scoped lang="scss" src="./ParticipantListMobile.scss"></style>
