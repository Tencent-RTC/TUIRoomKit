<template>
  <TUIDialog
    :open="open"
    :title="t('UserPicker.Title')"
    width="min(640px, calc(100% - 32px))"
    :confirm-text="confirmText"
    :confirm-disabled="isMeeting && !picked.length"
    :cancel-text="t('Participants.Cancel')"
    closable
    @update:open="emit('update:open', $event)"
    @confirm="emit('confirm', pickedContacts())"
  >
    <div class="user-picker-pc">
      <div ref="mainRef" class="user-picker-pc-main">
        <TUIInput
          v-model="searchKeyword"
          class="user-picker-pc-search"
          type="text"
          size="sm"
          clearable
          :placeholder="t('Participants.SearchPlaceholder')"
        >
          <template #prefix>
            <IconSearch :size="14" />
          </template>
        </TUIInput>

        <div
          class="user-picker-pc-list"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="t('UserPicker.Title')"
        >
          <div
            v-for="contact in visibleContacts"
            :key="contact.userId"
            class="user-picker-pc-row"
            :class="{
              'is-selected': isPicked(contact.userId),
              'is-disabled': contact.occupied,
            }"
            role="option"
            :aria-selected="isPicked(contact.userId)"
            :aria-disabled="contact.occupied || undefined"
            :tabindex="contact.occupied ? -1 : 0"
            @click="pick(contact)"
            @keydown.enter.prevent="pick(contact)"
            @keydown.space.prevent="pick(contact)"
          >
            <TUIAvatar
              class="user-picker-pc-avatar"
              :size="32"
              :src="contact.avatarUrl"
              :alt="contact.userName"
            />
            <div class="user-picker-pc-meta">
              <div class="user-picker-pc-name">{{ contact.userName }}</div>
              <div v-if="contact.occupied" class="user-picker-pc-sub">{{ t('Participants.ContactInvited') }}</div>
            </div>
            <div class="user-picker-pc-check">
              <IconCheck :size="10" />
            </div>
          </div>
          <div v-if="visibleContacts.length === 0" class="user-picker-pc-empty">
            {{ emptyText }}
          </div>
        </div>
      </div>

      <div class="user-picker-pc-side">
        <div class="user-picker-pc-side-head">
          <span class="user-picker-pc-side-count">{{ t('UserPicker.SelectedCount', { count: picked.length }) }}</span>
          <TUIButton
            class="user-picker-pc-clear"
            variant="ghost"
            size="sm"
            :disabled="!picked.length"
            @click="clear"
          >
            {{ t('UserPicker.Clear') }}
          </TUIButton>
        </div>
        <div ref="sideListRef" class="user-picker-pc-side-list">
          <div v-for="contact in picked" :key="contact.userId" class="user-picker-pc-side-row">
            <TUIAvatar
              class="user-picker-pc-avatar"
              :size="32"
              :src="contact.avatarUrl"
              :alt="contact.userName"
            />
            <div class="user-picker-pc-name">{{ contact.userName }}</div>
            <TUIButton
              class="user-picker-pc-remove"
              variant="ghost"
              size="sm"
              :aria-label="t('Participants.ContactDeselect', { name: contact.userName })"
              @click="toggle(contact.userId)"
            >
              <IconClose :size="10" />
            </TUIButton>
          </div>
        </div>
        <div v-if="!picked.length" class="user-picker-pc-side-empty">
          {{ t('UserPicker.PickedEmpty') }}
        </div>
      </div>
    </div>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  IconCheck,
  IconClose,
  IconSearch,
  t,
} from '../../../base';
import { useContactPicker } from '../contactData';
import type { PickedContact, PickerContact } from '../contactData';

const props = withDefaults(defineProps<{
  open: boolean;
  /** `meeting` invites into the room; `schedule` collects attendees and may confirm an empty pick. */
  mode?: 'meeting' | 'schedule';
  occupiedIds?: string[];
  selectedIds?: string[];
}>(), {
  mode: 'meeting',
  occupiedIds: () => [],
  selectedIds: () => [],
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [users: PickedContact[]];
}>();

const mainRef = ref<HTMLElement | null>(null);
const sideListRef = ref<HTMLElement | null>(null);
const {
  searchKeyword,
  visibleContacts,
  picked,
  emptyText,
  isPicked,
  toggle,
  reset,
  clear,
  pickedContacts,
} = useContactPicker(() => props.occupiedIds);

const isMeeting = computed(() => props.mode === 'meeting');
const confirmText = computed(() => {
  if (!isMeeting.value) {
    return t('Participants.Confirm');
  }
  return picked.value.length ? t('UserPicker.InviteCount', { count: picked.value.length }) : t('UserPicker.Invite');
});

watch(() => props.open, (open) => {
  if (open) {
    reset(props.selectedIds);
    focusSearch();
  }
});

/* The dialog focuses its panel one frame after opening; take focus back on the frame after. */
function focusSearch() {
  void nextTick(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    mainRef.value?.querySelector<HTMLInputElement>('.user-picker-pc-search input')?.focus();
  })));
}

function pick(contact: PickerContact) {
  if (contact.occupied) {
    return;
  }
  const adding = !isPicked(contact.userId);
  toggle(contact.userId);
  if (adding) {
    void nextTick(() => {
      const element = sideListRef.value;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
</script>

<style scoped lang="scss" src="./UserPickerPC.scss"></style>

<!-- The dialog shell is teleported, so its panel chrome has to be matched from outside the scope. -->
<style lang="scss" src="./UserPickerPC.global.scss"></style>
