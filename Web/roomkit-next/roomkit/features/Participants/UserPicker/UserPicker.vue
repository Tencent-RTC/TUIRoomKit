<template>
  <div class="invite-dialog">
    <TUIDialog
      :open="open"
      :title="t('Participants.ContactsTitle', { count: contacts.length })"
      width="420px"
      :confirm-text="confirmText"
      :cancel-text="t('Participants.Cancel')"
      closable
      @update:open="$emit('update:open', $event)"
      @confirm="confirm"
    >
      <div class="invite-dialog-content">
        <TUIInput
          v-model="query"
          class="invite-dialog-search"
          type="text"
          size="sm"
          clearable
          :placeholder="t('Participants.SearchPlaceholder')"
        >
          <template #prefix>
            <IconSearch :size="14" />
          </template>
        </TUIInput>

        <div class="invite-dialog-list">
          <div
            v-for="contact in visibleContacts"
            :key="contact.userId"
            class="invite-dialog-row"
            :class="{
              sel: contact.occupied || pickedIds.has(contact.userId),
              disabled: contact.occupied,
            }"
            @click="toggle(contact.userId)"
          >
            <TUIAvatar
              class="invite-dialog-avatar"
              :size="32"
              :src="contact.avatarUrl"
              :alt="contact.userName"
            />
            <span class="invite-dialog-meta">
              <span class="invite-dialog-name">{{ contact.userName }}</span>
              <span v-if="contact.occupied" class="invite-dialog-sub">{{ t('Participants.ContactInvited') }}</span>
            </span>
            <span class="invite-dialog-check">
              <span class="invite-dialog-check-icon">
                <IconCheck :size="11" />
              </span>
            </span>
          </div>
          <div v-if="visibleContacts.length === 0" class="invite-dialog-empty">
            {{ query.trim() ? t('Participants.ContactNotFound') : t('Participants.ContactEmpty') }}
          </div>
        </div>

        <div ref="pickedRef" class="invite-dialog-picked">
          <span v-for="contact in picked" :key="contact.userId" class="invite-dialog-chip">
            <TUIAvatar
              class="invite-dialog-chip-av"
              :size="20"
              :src="contact.avatarUrl"
              :alt="contact.userName"
            />
            <span class="invite-dialog-chip-name">{{ contact.userName }}</span>
            <TUIButton
              class="invite-dialog-chip-close"
              variant="ghost"
              size="sm"
              :aria-label="t('Participants.ContactDeselect', { name: contact.userName })"
              @click="toggle(contact.userId)"
            >
              <IconClose :size="10" />
            </TUIButton>
          </span>
        </div>
      </div>
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { TUIAvatar, TUIButton, TUIDialog, TUIInput, IconCheck, IconClose, IconSearch } from '../../../base';
import { t } from '../../../i18n';
import { filterContacts, pickedContacts, selectedContacts, toggleSelectedId } from './contactPicker';
import type { PickedContact } from './contactPicker';
import { useResolvedContacts } from './useResolvedContacts';

const props = withDefaults(defineProps<{
  open: boolean;
  occupiedIds?: string[];
  selectedIds?: string[];
}>(), {
  occupiedIds: () => [],
  selectedIds: () => [],
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [users: PickedContact[]];
}>();

const query = ref('');
const pickedIds = ref(new Set<string>());
const pickedRef = ref<HTMLElement | null>(null);
const { loginUserInfo } = useLoginState();
const occupiedIdSet = computed(() => new Set(props.occupiedIds));
const excludeIds = computed(() => {
  const userId = loginUserInfo.value?.userId;
  return userId ? [userId] : [];
});
const { contacts, refreshContacts } = useResolvedContacts(occupiedIdSet, excludeIds);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    query.value = '';
    pickedIds.value = new Set(props.selectedIds);
    void refreshContacts();
  },
);

const visibleContacts = computed(() => filterContacts(contacts.value, query.value));

const picked = computed(() => selectedContacts(pickedIds.value, contacts.value));

const confirmText = computed(() => (
  pickedIds.value.size
    ? t('Participants.ConfirmCount', { count: pickedIds.value.size })
    : t('Participants.Confirm')
));

function toggle(userId: string) {
  const contact = contacts.value.find(item => item.userId === userId);
  if (!contact) {
    return;
  }
  pickedIds.value = toggleSelectedId(pickedIds.value, userId, contact.occupied);
  /* Chips wrap downwards, so keep the row that was just added in view. */
  void nextTick(() => {
    const element = pickedRef.value;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  });
}

function confirm() {
  emit('confirm', pickedContacts([...pickedIds.value], contacts.value));
}
</script>

<style scoped lang="scss">
.invite-dialog-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

/* Filled 36px pill. width:auto beats TUIInput's width:100% so 16px
   side margins do not overflow the dialog. */
.invite-dialog-content .invite-dialog-search {
  box-sizing: border-box;
  flex: none;
  align-self: stretch;
  width: auto;
  height: 36px;
  min-height: 36px;
  margin: 4px 16px 8px;
  background: var(--rk-bg-muted);
  border: 0;
  border-radius: 999px;
  box-shadow: none;
}

.invite-dialog-list {
  flex: 1;
  min-height: 0;
  padding: 4px 8px 8px;
  overflow: auto;
  scrollbar-width: none;
}

.invite-dialog-list::-webkit-scrollbar {
  display: none;
}

.invite-dialog-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 8px;
  text-align: left;
  cursor: pointer;
  border-radius: 10px;
}

.invite-dialog-row:hover:not(.disabled) {
  background: color-mix(in srgb, var(--rk-brand) 1.6%, var(--rk-bg-page));
}

.invite-dialog-row.disabled {
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.45;
}

.invite-dialog-avatar,
.invite-dialog-chip-av {
  flex: none;
}

.invite-dialog-meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.invite-dialog-name {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-dialog-sub {
  margin-top: 1px;
  font-size: 11px;
  color: var(--rk-text-tertiary);
}

.invite-dialog-check {
  box-sizing: border-box;
  display: grid;
  flex: none;
  place-items: center;
  width: 18px;
  height: 18px;
  margin-left: auto;
  color: var(--rk-on-accent);
  border: 1.5px solid var(--rk-border-strong);
  border-radius: 50%;
}

.invite-dialog-check-icon {
  display: grid;
  opacity: 0;
}

.invite-dialog-row.sel .invite-dialog-check {
  background: var(--rk-brand);
  border-color: var(--rk-brand);
}

.invite-dialog-row.sel .invite-dialog-check-icon {
  opacity: 1;
}

.invite-dialog-empty {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 160px;
  font-size: 13px;
  color: var(--rk-text-tertiary);
}

/* Keep three chip rows even when empty so selecting people cannot resize the dialog. */
.invite-dialog-picked {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
  max-height: 108px;
  padding: 8px 16px 4px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.invite-dialog-chip {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 6px;
  align-items: center;
  max-width: 160px;
  height: 28px;
  padding: 0 6px 0 4px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-muted);
  border-radius: 999px;
}

.invite-dialog-chip-name {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-dialog-chip-close {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  min-width: 16px;
  height: 16px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
}
</style>

<!-- The dialog shell is teleported, so its panel chrome has to be matched from outside the scope. -->
<style lang="scss">
/* Contacts is the prototype's panel modal: no shell padding, each section pads itself,
   and only the list scrolls. */
.rk-dialog-mask .rk-dialog:has(.invite-dialog-list) {
  height: min(560px, calc(100% - 48px));
  max-height: min(560px, calc(100% - 48px));
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
}

.rk-dialog-mask .rk-dialog:has(.invite-dialog-list) .rk-dialog-header {
  padding: 16px 16px 8px;
  margin-bottom: 0;
}

.rk-dialog-mask .rk-dialog:has(.invite-dialog-list) .rk-dialog-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--rk-text-primary);
}

.rk-dialog-mask .rk-dialog:has(.invite-dialog-list) .rk-dialog-footer {
  justify-content: flex-end;
  padding: 12px 16px 16px;
  margin-top: 0;
}

.rk-dialog-mask .rk-dialog:has(.invite-dialog-list) .rk-dialog-footer .rk-btn {
  flex: 0 0 auto;
  min-width: 80px;
  height: 32px;
  padding: 0 16px;
  border-radius: var(--rk-radius-pill);
}
</style>
