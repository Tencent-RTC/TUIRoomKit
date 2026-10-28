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
          v-model="searchKeyword"
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
              sel: contact.occupied || isPicked(contact.userId),
              disabled: contact.occupied,
            }"
            @click="togglePick(contact.userId)"
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
            {{ emptyText }}
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
              @click="togglePick(contact.userId)"
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
import type { PickedContact } from '../contactData';

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

const pickedRef = ref<HTMLElement | null>(null);
const {
  contacts,
  searchKeyword,
  visibleContacts,
  picked,
  pickedCount,
  emptyText,
  isPicked,
  toggle,
  reset,
  pickedContacts,
} = useContactPicker(() => props.occupiedIds);

const confirmText = computed(() => (
  pickedCount.value ? t('Participants.ConfirmCount', { count: pickedCount.value }) : t('Participants.Confirm')
));

watch(() => props.open, (open) => {
  if (open) {
    reset(props.selectedIds);
  }
});

/* Chips wrap downwards, so keep the row that was just added in view. */
function togglePick(userId: string) {
  toggle(userId);
  void nextTick(() => {
    const element = pickedRef.value;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  });
}

function confirm() {
  emit('confirm', pickedContacts());
}
</script>

<style scoped lang="scss" src="./UserPickerPC.scss"></style>

<!-- The dialog shell is teleported, so its panel chrome has to be matched from outside the scope. -->
<style lang="scss" src="./UserPickerPC.global.scss"></style>
