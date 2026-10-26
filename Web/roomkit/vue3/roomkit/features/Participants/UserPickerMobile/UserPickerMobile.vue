<template>
  <TUIPopup :open="open" height="84%" :closable="false" @update:open="emit('update:open', $event)">
    <template #header>
      <div class="user-picker-mobile-header" :class="{ 'is-picked-view': pickedView }">
        <div class="user-picker-mobile-bar" :aria-hidden="pickedView">
          <div
            class="user-picker-mobile-bar-btn is-start"
            role="button"
            tabindex="0"
            @click="emit('update:open', false)"
          >
            {{ t('Participants.Cancel') }}
          </div>
          <span class="user-picker-mobile-bar-title">{{ t('UserPicker.Title') }}</span>
          <div
            class="user-picker-mobile-bar-btn is-end is-primary"
            :class="{ 'is-disabled': picked.length === 0 }"
            role="button"
            :tabindex="picked.length ? 0 : -1"
            :aria-disabled="picked.length === 0"
            @click="confirm"
          >
            {{ picked.length ? t('UserPicker.InviteCount', { count: picked.length }) : t('UserPicker.Invite') }}
          </div>
        </div>
        <div class="user-picker-mobile-bar is-picked" :aria-hidden="!pickedView">
          <div class="user-picker-mobile-bar-btn is-start" role="button" tabindex="0" @click="pickedView = false">
            <IconChevron class="user-picker-mobile-back-chev" :size="16" />
            <span>{{ t('UserPicker.Back') }}</span>
          </div>
          <span class="user-picker-mobile-bar-title">
            {{ t('UserPicker.SelectedCount', { count: picked.length }) }}
          </span>
        </div>
      </div>
    </template>

    <div class="user-picker-mobile" :class="{ 'is-picked-view': pickedView }">
      <div class="user-picker-mobile-page" :aria-hidden="pickedView">
        <div class="user-picker-mobile-toolbar">
          <TUIInput
            v-model="query"
            class="user-picker-mobile-search"
            size="sm"
            :placeholder="t('Participants.SearchPlaceholder')"
          >
            <template #prefix>
              <IconSearch class="user-picker-mobile-search-icon" :size="14" />
            </template>
          </TUIInput>
        </div>

        <div
          v-if="picked.length"
          class="user-picker-mobile-selected"
          role="button"
          tabindex="0"
          @click="pickedView = true"
        >
          <span class="user-picker-mobile-selected-count">
            {{ t('UserPicker.SelectedCount', { count: picked.length }) }}
          </span>
          <div
            ref="facesRef"
            class="user-picker-mobile-selected-faces"
            :class="{ 'is-scrolled': facesScrolled }"
            @scroll.passive="syncFacesEdge"
          >
            <TUIAvatar
              v-for="contact in picked"
              :key="contact.userId"
              class="user-picker-mobile-selected-avatar"
              :size="28"
              :src="contact.avatarUrl"
              :alt="contact.userName"
            />
          </div>
          <IconChevron class="user-picker-mobile-selected-chev" :size="16" />
        </div>

        <div class="user-picker-mobile-list">
          <div
            v-for="contact in visibleContacts"
            :key="contact.userId"
            class="user-picker-mobile-row"
            :class="{ 'is-occupied': occupiedIdSet.has(contact.userId) }"
            role="checkbox"
            :aria-checked="pickedIds.has(contact.userId)"
            :aria-disabled="occupiedIdSet.has(contact.userId)"
            tabindex="0"
            @click="toggle(contact.userId)"
          >
            <TUIAvatar :size="32" :src="contact.avatarUrl" :alt="contact.userName" />
            <div class="user-picker-mobile-info">
              <span class="user-picker-mobile-name">{{ contact.userName }}</span>
              <span v-if="occupiedIdSet.has(contact.userId)" class="user-picker-mobile-sub">
                {{ t('Participants.ContactInvited') }}
              </span>
            </div>
            <span
              class="user-picker-mobile-check"
              :class="{ 'is-checked': pickedIds.has(contact.userId) || occupiedIdSet.has(contact.userId) }"
            >
              <IconCheck v-if="pickedIds.has(contact.userId) || occupiedIdSet.has(contact.userId)" :size="12" />
            </span>
          </div>
          <div v-if="visibleContacts.length === 0" class="user-picker-mobile-empty">
            {{ query.trim() ? t('Participants.ContactNotFound') : t('Participants.ContactEmpty') }}
          </div>
        </div>
      </div>

      <div class="user-picker-mobile-page is-picked" :aria-hidden="!pickedView">
        <div class="user-picker-mobile-list">
          <div v-for="contact in picked" :key="contact.userId" class="user-picker-mobile-row is-static">
            <TUIAvatar :size="32" :src="contact.avatarUrl" :alt="contact.userName" />
            <div class="user-picker-mobile-info">
              <span class="user-picker-mobile-name">{{ contact.userName }}</span>
            </div>
            <div class="user-picker-mobile-remove" role="button" tabindex="0" @click="toggle(contact.userId)">
              {{ t('UserPicker.Remove') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useContactListState, useContactStore } from 'tuikit-atomicx-vue3/chat';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconCheck,
  IconChevron,
  IconSearch,
  TUIAvatar,
  TUIInput,
  TUIPopup,
  loadContactList,
  t,
} from '../../../base';
import type { RoomKitContact } from '../../../base';

export interface PickedContactMobile {
  userId: string;
  userName: string;
}

const props = withDefaults(defineProps<{
  open: boolean;
  occupiedIds?: string[];
}>(), {
  occupiedIds: () => [],
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [contacts: PickedContactMobile[]];
}>();

const { friendList } = useContactListState();
const { loadFriends } = useContactStore();
const { loginUserInfo } = useLoginState();

const query = ref('');
const pickedIds = ref(new Set<string>());
const pickedView = ref(false);

const occupiedIdSet = computed(() => new Set(props.occupiedIds));

/** Set when the host supplies `contactList`; those contacts bypass the IM friend list. */
const hostContacts = ref<RoomKitContact[] | null>(null);

const contacts = computed(() => {
  const selfId = loginUserInfo.value?.userId;
  if (hostContacts.value) {
    return hostContacts.value
      .filter(contact => contact.userId !== selfId)
      .map(contact => ({
        userId: contact.userId,
        userName: (contact.userName || contact.userId).trim(),
        avatarUrl: contact.avatarUrl || '',
      }));
  }
  return friendList.value
    .filter(friend => friend.userID && friend.userID !== selfId)
    .map(friend => ({
      userId: friend.userID,
      userName: (friend.remark || friend.nick || friend.userID).trim(),
      avatarUrl: friend.avatar || '',
    }));
});

const visibleContacts = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) {
    return contacts.value;
  }
  return contacts.value.filter(contact => (
    contact.userName.toLowerCase().includes(keyword) || contact.userId.toLowerCase().includes(keyword)
  ));
});

/** Selection order, so the newest face lands at the end of the strip. */
const picked = computed(() => {
  const byId = new Map(contacts.value.map(contact => [contact.userId, contact]));
  return [...pickedIds.value].flatMap((userId) => {
    const contact = byId.get(userId);
    return contact ? [contact] : [];
  });
});

const facesRef = ref<HTMLElement | null>(null);
const facesScrolled = ref(false);

function syncFacesEdge() {
  facesScrolled.value = (facesRef.value?.scrollLeft ?? 0) > 0;
}

watch(() => picked.value.length, async (count, previous = 0) => {
  if (count <= previous) {
    return;
  }
  await nextTick();
  const faces = facesRef.value;
  if (faces) {
    faces.scrollLeft = faces.scrollWidth;
    syncFacesEdge();
  }
});

watch(() => props.open, (open) => {
  if (!open) {
    return;
  }
  query.value = '';
  pickedIds.value = new Set();
  pickedView.value = false;
  facesScrolled.value = false;
  void loadContactList().then((provided) => {
    hostContacts.value = provided ?? null;
    if (provided) {
      return;
    }
    loadFriends().catch((error: unknown) => {
      console.error('[RoomKit.participant] Failed to load friends:', error);
    });
  });
});

watch(() => picked.value.length, (count) => {
  if (count === 0) {
    pickedView.value = false;
  }
});

function toggle(userId: string) {
  if (occupiedIdSet.value.has(userId)) {
    return;
  }
  const next = new Set(pickedIds.value);
  if (next.has(userId)) {
    next.delete(userId);
  } else {
    next.add(userId);
  }
  pickedIds.value = next;
}

function confirm() {
  if (picked.value.length === 0) {
    return;
  }
  emit('confirm', picked.value.map(({ userId, userName }) => ({ userId, userName })));
}
</script>

<style scoped lang="scss">
/* TUIPopup head adds 4px above and 10px below, so a 30px bar makes the 44px header. */
.user-picker-mobile-header {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 30px;
  overflow: hidden;
}

.user-picker-mobile-bar {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80px;
}

.user-picker-mobile-bar-title {
  overflow: hidden;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-picker-mobile-bar-btn {
  position: absolute;
  top: 0;
  display: inline-flex;
  gap: 2px;
  align-items: center;
  height: 30px;
  padding: 0 8px;
  margin: 0 -8px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: opacity 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.user-picker-mobile-bar-btn:active {
  opacity: 0.6;
}

.user-picker-mobile-bar-btn.is-start {
  left: 0;
}

.user-picker-mobile-bar-btn.is-end {
  right: 0;
}

.user-picker-mobile-bar-btn.is-primary {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rk-brand);
}

.user-picker-mobile-bar-btn.is-disabled {
  color: var(--rk-text-tertiary);
  cursor: default;
  opacity: 1;
}

.user-picker-mobile-back-chev {
  transform: rotate(90deg);
}

.user-picker-mobile {
  position: relative;
  height: 100%;
  margin: 0 -16px;
  overflow: hidden;
}

.user-picker-mobile-page {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--rk-bg-surface);
}

/* Header bars and body pages slide together: main view exits left, the picked view enters from the right. */
.user-picker-mobile-bar,
.user-picker-mobile-page {
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.28s ease,
    visibility 0s;
}

.user-picker-mobile-bar.is-picked,
.user-picker-mobile-page.is-picked {
  visibility: hidden;
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.28s ease,
    visibility 0s linear 0.28s;
  transform: translateX(100%);
}

.user-picker-mobile-header.is-picked-view .user-picker-mobile-bar.is-picked,
.user-picker-mobile.is-picked-view .user-picker-mobile-page.is-picked {
  visibility: visible;
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.28s ease,
    visibility 0s;
  transform: none;
}

.user-picker-mobile-header.is-picked-view .user-picker-mobile-bar:not(.is-picked),
.user-picker-mobile.is-picked-view .user-picker-mobile-page:not(.is-picked) {
  visibility: hidden;
  opacity: 0;
  transition:
    transform 0.28s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 0.28s ease,
    visibility 0s linear 0.28s;
  transform: translateX(-24%);
}

.user-picker-mobile-toolbar {
  flex-shrink: 0;
  padding: 4px 16px;
}

/* TUIInput root: the only place this package restyles a base component. */
.user-picker-mobile-toolbar .user-picker-mobile-search {
  box-sizing: border-box;
  gap: 6px;
  width: 100%;
  height: 32px;
  min-height: 32px;
  padding: 0 12px;
  font-size: var(--rk-fs-sm);
  background: var(--rk-bg-surface);
  border-color: var(--rk-border);
  border-radius: 999px;
}

.user-picker-mobile-search :deep(.rk-input-addon),
.user-picker-mobile-search :deep(.rk-input-field) {
  padding: 0;
}

.user-picker-mobile-toolbar .user-picker-mobile-search:focus-within {
  border-color: var(--rk-border-strong);
}

.user-picker-mobile-search-icon {
  color: var(--rk-text-tertiary);
}

.user-picker-mobile-selected {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  align-items: center;
  height: 52px;
  margin: 0 16px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-secondary);
  cursor: pointer;
  border-bottom: 1px solid var(--rk-border);
  -webkit-tap-highlight-color: transparent;
}

.user-picker-mobile-selected-count {
  flex-shrink: 0;
}

/* Right edge fades by default; the left edge fades only after the strip scrolls. */
.user-picker-mobile-selected-faces {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
  height: 100%;
  padding-right: 10px;
  margin-right: -10px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  mask-image: linear-gradient(to right, #000 calc(100% - 10px), transparent);

  &::-webkit-scrollbar {
    display: none;
  }
}

.user-picker-mobile-selected-faces.is-scrolled {
  mask-image: linear-gradient(to right, transparent, #000 10px, #000 calc(100% - 10px), transparent);
}

.user-picker-mobile-selected-avatar {
  flex: none;
}

.user-picker-mobile-selected-chev {
  flex: none;
  color: var(--rk-text-tertiary);
  transform: rotate(-90deg);
}

.user-picker-mobile-list {
  flex: 1;
  min-height: 0;
  padding: 4px 0 8px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.user-picker-mobile-row {
  box-sizing: border-box;
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 48px;
  padding: 8px 16px;
  cursor: pointer;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.user-picker-mobile-row:not(.is-static):active {
  background: var(--rk-bg-hover);
}

.user-picker-mobile-row.is-static {
  cursor: default;
}

.user-picker-mobile-row.is-occupied {
  cursor: default;
  opacity: 0.5;
}

.user-picker-mobile-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.user-picker-mobile-name {
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  line-height: 18px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-picker-mobile-sub {
  margin-top: 2px;
  font-size: var(--rk-fs-sm);
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.user-picker-mobile-check {
  box-sizing: border-box;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--rk-on-accent);
  border: 1.5px solid color-mix(in srgb, var(--rk-text-primary) 22%, transparent);
  border-radius: 50%;
}

.user-picker-mobile-check.is-checked {
  background: var(--rk-brand);
  border-color: var(--rk-brand);
}

.user-picker-mobile-empty {
  padding: 40px 16px;
  font-size: var(--rk-fs-md);
  color: var(--rk-text-tertiary);
  text-align: center;
}

.user-picker-mobile-remove {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  font-size: var(--rk-fs-sm);
  color: var(--rk-text-primary);
  cursor: pointer;
  background: var(--rk-bg-hover);
  border-radius: 999px;
  -webkit-tap-highlight-color: transparent;
}

.user-picker-mobile-remove:active {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .user-picker-mobile-bar,
  .user-picker-mobile-page {
    transition: none !important;
  }
}
</style>
