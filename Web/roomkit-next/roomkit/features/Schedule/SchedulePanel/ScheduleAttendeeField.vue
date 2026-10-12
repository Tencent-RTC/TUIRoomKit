<template>
  <div class="sch-field">
    <label
      class="sch-label"
      :for="participantId"
    >{{ t('Schedule.Participants') }}</label>
    <div class="sch-attendee">
      <div class="sch-attendee-field">
        <TUIInput
          :id="participantId"
          v-model="participant"
          class="sch-participant-input"
          type="text"
          clearable
          autocomplete="off"
          :placeholder="t('Schedule.ParticipantsPlaceholder')"
          :aria-label="t('Schedule.ParticipantsLabel')"
          @input="onAttendeeInput"
          @focus="onAttendeeInput"
          @enter="onEnter"
        >
          <template #suffix>
            <TUIButton
              class="sch-attendee-add"
              variant="ghost"
              size="sm"
              :title="t('Schedule.PickContacts')"
              :aria-label="t('Schedule.PickContacts')"
              @click="openContacts"
            >
              <IconUserPlus :size="16" />
            </TUIButton>
          </template>
        </TUIInput>
        <div
          v-if="attendeeMenuOpen"
          class="sch-attendee-menu is-open"
          @click.stop
        >
          <div
            v-if="!attendeeHits.length"
            class="sch-attendee-empty"
          >
            {{ t('Schedule.AttendeeEmpty') }}
          </div>
          <template v-else>
            <div
              v-for="hit in attendeeHits"
              :key="hit.userId"
              class="sch-attendee-hit"
              @click="pickAttendee(hit.userId)"
            >
              <TUIAvatar
                class="sch-attendee-hit-av"
                :size="15"
                :src="hit.avatarUrl"
                :alt="hit.displayName"
              />
              <span class="sch-attendee-hit-name">{{ hit.displayName }}</span>
            </div>
          </template>
        </div>
      </div>
      <div
        v-if="modelValue.length"
        class="sch-attendee-chips"
      >
        <span
          v-for="userId in modelValue"
          :key="userId"
          class="sch-attendee-chip"
        >
          <TUIAvatar
            class="sch-attendee-chip-av"
            :size="20"
            :src="attendeeAvatar(userId)"
            :alt="attendeeLabel(userId)"
          />
          <span class="sch-attendee-chip-name">{{ attendeeLabel(userId) }}</span>
          <TUIButton
            class="sch-attendee-chip-x"
            variant="ghost"
            size="sm"
            :aria-label="t('Schedule.RemoveParticipant', { userId: attendeeLabel(userId) })"
            @click="removeParticipant(userId)"
          >
            <IconClose :size="10" />
          </TUIButton>
        </span>
        <span class="sch-attendee-count">{{ t('Schedule.AttendeeCount', { count: modelValue.length }) }}</span>
      </div>
    </div>
  </div>
  <UserPicker
    v-model:open="contactsOpen"
    :selected-ids="modelValue"
    @confirm="applyContacts"
  />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import { IconClose, IconUserPlus, TUIAvatar, TUIButton, TUIInput } from '../../../base';
import { t } from '../../../i18n';
import UserPicker from '../../Participants/UserPicker/UserPicker.vue';
import type { PickedContact } from '../../Participants/UserPicker/contactPicker';
import { useResolvedContacts } from '../../Participants/UserPicker/useResolvedContacts';
import { attendeeChipLabel, attendeeSearchHits, uniqueParticipantIds } from './scheduleForm';
import type { AttendeeHit } from './scheduleForm';
import { pinOverlayMenu } from './scheduleOverlay';

const props = withDefaults(defineProps<{
  modelValue: string[];
  knownNames?: Record<string, string>;
}>(), {
  knownNames: () => ({}),
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const instanceUid = getCurrentInstance()?.uid;
const participantId = `meeting-participant-${instanceUid}`;
const participant = ref('');
const attendeeMenuOpen = ref(false);
const attendeeHits = ref<AttendeeHit[]>([]);
const contactsOpen = ref(false);
const attendeeNames = ref(new Map<string, string>());
const { loginUserInfo } = useLoginState();
const excludeIds = computed(() => {
  const userId = loginUserInfo.value?.userId;
  return userId ? [userId] : [];
});
const { contacts, refreshContacts } = useResolvedContacts([], excludeIds);

defineExpose({
  flushInput,
});

onMounted(() => {
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('scroll', onRepositionMenus, true);
  window.addEventListener('resize', onRepositionMenus);
  void refreshContacts();
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true);
  document.removeEventListener('scroll', onRepositionMenus, true);
  window.removeEventListener('resize', onRepositionMenus);
});

function pinOpenMenus() {
  document.querySelectorAll<HTMLElement>('.sch-attendee-menu.is-open').forEach(pinOverlayMenu);
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target?.closest('.sch-attendee')) {
    attendeeMenuOpen.value = false;
  }
}

function onRepositionMenus() {
  if (!attendeeMenuOpen.value) {
    return;
  }
  pinOpenMenus();
}

function onAttendeeInput() {
  const query = participant.value.trim();
  if (!query) {
    attendeeMenuOpen.value = false;
    attendeeHits.value = [];
    return;
  }
  attendeeMenuOpen.value = true;
  attendeeHits.value = attendeeSearchHits(query, props.modelValue, contacts.value);
  void nextTick(() => pinOpenMenus());
}

function openContacts() {
  attendeeMenuOpen.value = false;
  contactsOpen.value = true;
}

function attendeeLabel(userId: string): string {
  const contactName = contacts.value.find(item => item.userId === userId)?.userName ?? '';
  return attendeeChipLabel(userId, [
    attendeeNames.value.get(userId) ?? '',
    props.knownNames[userId] ?? '',
    contactName,
  ]);
}

function attendeeAvatar(userId: string): string {
  return contacts.value.find(item => item.userId === userId)?.avatarUrl ?? '';
}

function rememberAttendees(users: readonly PickedContact[]) {
  const next = new Map(attendeeNames.value);
  for (const user of users) {
    const name = user.userName.trim();
    next.set(user.userId, name || user.userId);
  }
  attendeeNames.value = next;
}

function applyContacts(users: PickedContact[]) {
  const ids = uniqueParticipantIds(users.map(user => user.userId));
  const kept = new Set(ids);
  attendeeNames.value = new Map();
  rememberAttendees(users.filter(user => kept.has(user.userId)));
  emit('update:modelValue', ids);
  contactsOpen.value = false;
}

function pickAttendee(userId: string) {
  const hit = attendeeHits.value.find(item => item.userId === userId);
  if (hit) {
    rememberAttendees([{ userId, userName: hit.displayName }]);
  }
  commitAttendee(userId);
}

function removeParticipant(userId: string) {
  const next = new Map(attendeeNames.value);
  next.delete(userId);
  attendeeNames.value = next;
  emit('update:modelValue', props.modelValue.filter(item => item !== userId));
}

function resolveContactId(userId: string): string | undefined {
  if (contacts.value.some(item => item.userId === userId)) {
    return userId;
  }
  if (attendeeHits.value.length === 1) {
    return attendeeHits.value[0].userId;
  }
  return undefined;
}

function commitAttendee(userId: string) {
  if (!props.modelValue.includes(userId)) {
    emit('update:modelValue', [...props.modelValue, userId]);
  }
  participant.value = '';
  attendeeMenuOpen.value = false;
  attendeeHits.value = [];
}

function onEnter() {
  const userId = participant.value.trim();
  if (!userId) {
    attendeeMenuOpen.value = false;
    return;
  }
  const contactId = resolveContactId(userId);
  if (!contactId) {
    attendeeMenuOpen.value = true;
    attendeeHits.value = [];
    return;
  }
  commitAttendee(contactId);
}

function flushInput(): boolean {
  const userId = participant.value.trim();
  if (!userId) {
    attendeeMenuOpen.value = false;
    return true;
  }
  const contactId = resolveContactId(userId);
  if (contactId) {
    commitAttendee(contactId);
    return true;
  }
  /* Unmatched search leftover is not a pending attendee. */
  participant.value = '';
  attendeeMenuOpen.value = false;
  attendeeHits.value = [];
  return true;
}
</script>

<style scoped lang="scss">
@mixin hide-scrollbar {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

.sch-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 16px;
  align-items: start;
  min-width: 0;
}

.sch-label {
  font-size: 14px;
  font-weight: 400;
  line-height: 40px;
  color: var(--rk-text-primary);
}

.sch-participant-input {
  box-sizing: border-box;
  height: 40px;
  min-height: 40px;
  background: var(--rk-bg-raised, var(--rk-bg-surface));
  border: 1px solid var(--rk-border);
  border-radius: 12px;
}

.sch-attendee-field .sch-participant-input:focus-within {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 1px var(--rk-brand);
}

.sch-attendee {
  min-width: 0;
}

.sch-attendee-field {
  position: relative;
}

.sch-attendee-add {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-secondary);
  background: transparent;
  border: 0;
  border-radius: 6px;
}

.sch-attendee-add:hover {
  color: var(--rk-brand);
  background: var(--rk-bg-muted);
}

.sch-attendee-menu {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 80;
  max-height: 240px;
  padding: 6px;
  overflow-y: auto;
  visibility: hidden;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 8px;
  box-shadow: var(--rk-shadow-dialog);

  @include hide-scrollbar;
}

.sch-attendee-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--rk-text-tertiary);
}

.sch-attendee-hit {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 8px;
}

.sch-attendee-hit:hover {
  background: var(--rk-bg-muted);
}

.sch-attendee-hit-av,
.sch-attendee-chip-av {
  flex: none;
}

.sch-attendee-hit-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sch-attendee-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  min-width: 0;
  margin-top: 8px;
}

.sch-attendee-chip {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 28px;
  padding: 0 4px;
  background: var(--rk-bg-muted);
  border-radius: 999px;
}

.sch-attendee-chip-name {
  max-width: 120px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sch-attendee-chip-x {
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  color: var(--rk-text-tertiary);
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.sch-attendee-count {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-radius: 999px;
}

@media (width <= 520px) {
  .sch-field {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }

  .sch-label {
    line-height: 22px;
  }
}
</style>
