<template>
  <div class="sch-field">
    <label
      class="sch-label"
      :for="participantId"
    >{{ t('Schedule.Participants') }}</label>
    <div class="sch-attendee">
      <div ref="fieldRef" class="sch-attendee-field">
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
      </div>
      <Teleport v-if="host && attendeeMenuOpen" :to="host">
        <div
          ref="menuRef"
          class="rk-float sch-attendee-menu"
          :style="{ left: `${x}px`, top: `${y}px`, zIndex, width: `${menuWidth}px` }"
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
      </Teleport>
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
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconClose,
  IconUserPlus,
  TUIAvatar,
  TUIButton,
  TUIInput,
  t,
  useFloating,
  useOverlay,
} from '../../../base';
import UserPicker from '../../Participants/UserPickerPC/UserPickerPC.vue';
import { useResolvedContacts } from '../../Participants/contactData';
import type { PickedContact } from '../../Participants/contactData';
import { attendeeChipLabel, attendeeSearchHits, uniqueParticipantIds } from './scheduleForm';
import type { AttendeeHit } from './scheduleForm';

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

const fieldRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const menuWidth = ref(0);
const { host, zIndex } = useOverlay({
  lane: 'dropdown',
  open: attendeeMenuOpen,
  onClose: () => {
    attendeeMenuOpen.value = false;
  },
}, [fieldRef, menuRef]);
const { x, y } = useFloating({
  reference: fieldRef,
  floating: menuRef,
  placement: 'bottom-start',
  offset: 4,
  enabled: attendeeMenuOpen,
});

defineExpose({
  flushInput,
});

watch(attendeeMenuOpen, (open) => {
  if (open) {
    menuWidth.value = fieldRef.value?.offsetWidth ?? 0;
  }
});

onMounted(() => {
  void refreshContacts();
});

function onAttendeeInput() {
  const query = participant.value.trim();
  if (!query) {
    attendeeMenuOpen.value = false;
    attendeeHits.value = [];
    return;
  }
  attendeeMenuOpen.value = true;
  attendeeHits.value = attendeeSearchHits(query, props.modelValue, contacts.value);
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
.sch-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 16px;
  align-items: start;
  min-width: 0;
}

.sch-label {
  font-size: var(--rk-fs-md);
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
}

.sch-attendee-field .sch-participant-input:focus-within {
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
  border: 0;
  border-radius: 6px;
}

.sch-attendee-add:hover {
  color: var(--rk-brand);
  background: var(--rk-bg-muted);
}

.sch-attendee-menu {
  max-height: 240px;
  padding: 6px;
  overflow-y: auto;
  scrollbar-width: none;
  border-radius: 8px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sch-attendee-empty {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 10px;
  font-size: var(--rk-fs-md);
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
  font-size: var(--rk-fs-md);
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
  font-size: var(--rk-fs-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sch-attendee-chip-x {
  width: 18px;
  min-width: 18px;
  height: 18px;
  padding: 0;
  color: var(--rk-text-tertiary);
  border: 0;
  border-radius: 50%;
}

.sch-attendee-count {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  font-size: var(--rk-fs-sm);
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
