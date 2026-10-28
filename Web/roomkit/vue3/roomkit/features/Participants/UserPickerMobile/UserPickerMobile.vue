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
            v-model="searchKeyword"
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
            :class="{ 'is-occupied': contact.occupied }"
            role="checkbox"
            :aria-checked="isPicked(contact.userId)"
            :aria-disabled="contact.occupied"
            tabindex="0"
            @click="toggle(contact.userId)"
          >
            <TUIAvatar :size="32" :src="contact.avatarUrl" :alt="contact.userName" />
            <div class="user-picker-mobile-info">
              <span class="user-picker-mobile-name">{{ contact.userName }}</span>
              <span v-if="contact.occupied" class="user-picker-mobile-sub">
                {{ t('Participants.ContactInvited') }}
              </span>
            </div>
            <span
              class="user-picker-mobile-check"
              :class="{ 'is-checked': isPicked(contact.userId) || contact.occupied }"
            >
              <IconCheck v-if="isPicked(contact.userId) || contact.occupied" :size="12" />
            </span>
          </div>
          <div v-if="visibleContacts.length === 0" class="user-picker-mobile-empty">
            {{ emptyText }}
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
import { nextTick, ref, watch } from 'vue';
import {
  IconCheck,
  IconChevron,
  IconSearch,
  TUIAvatar,
  TUIInput,
  TUIPopup,
  t,
} from '../../../base';
import { useContactPicker } from '../contactData';
import type { PickedContact } from '../contactData';

const props = withDefaults(defineProps<{
  open: boolean;
  occupiedIds?: string[];
}>(), {
  occupiedIds: () => [],
});

const emit = defineEmits<{
  'update:open': [open: boolean];
  'confirm': [contacts: PickedContact[]];
}>();

const pickedView = ref(false);
const facesRef = ref<HTMLElement | null>(null);
const facesScrolled = ref(false);
const {
  searchKeyword,
  visibleContacts,
  picked,
  emptyText,
  isPicked,
  toggle,
  reset,
  pickedContacts,
} = useContactPicker(() => props.occupiedIds);

function syncFacesEdge() {
  facesScrolled.value = (facesRef.value?.scrollLeft ?? 0) > 0;
}

/* Keep the newest face in view at the end of the strip. */
watch(() => picked.value.length, async (count, previous = 0) => {
  if (count === 0) {
    pickedView.value = false;
  }
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
  pickedView.value = false;
  facesScrolled.value = false;
  reset();
});

function confirm() {
  if (picked.value.length > 0) {
    emit('confirm', pickedContacts());
  }
}
</script>

<style scoped lang="scss" src="./UserPickerMobile.scss"></style>
