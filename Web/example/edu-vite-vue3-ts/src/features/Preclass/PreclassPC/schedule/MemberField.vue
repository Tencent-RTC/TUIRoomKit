<template>
  <div class="preclass-member">
    <TUIPopover
      :open="menuOpen"
      placement="bottom-start"
      :offset="4"
      :padded="false"
      @update:open="onMenuToggle"
    >
      <div ref="fieldRef" class="preclass-member-field">
        <TUIInput
          v-model="query"
          class="preclass-member-input"
          type="text"
          clearable
          :placeholder="t('Schedule.ParticipantsPlaceholder')"
          :aria-label="t('Preclass.Members')"
          @input="openMenu"
          @focus="openMenu"
          @enter="onEnter"
        >
          <template #suffix>
            <TUIButton
              class="preclass-member-add"
              variant="ghost"
              size="sm"
              :title="t('Schedule.PickContacts')"
              :aria-label="t('Schedule.PickContacts')"
              @click.stop="openPicker"
            >
              <IconUserPlus :size="16" />
            </TUIButton>
          </template>
        </TUIInput>
      </div>
      <template #content>
        <div class="preclass-member-menu" :style="{ width: `${menuWidth}px` }">
          <p v-if="!hits.length && !canAddTypedUserId" class="preclass-member-empty">
            {{ emptyText }}
          </p>
          <button
            v-for="hit in hits"
            :key="hit.userId"
            type="button"
            class="preclass-member-hit"
            @click="pick(hit)"
          >
            <TUIAvatar :size="20" :src="hit.avatarUrl" :alt="hit.userName" />
            <b>{{ hit.userName }}</b>
          </button>
          <template v-if="canAddTypedUserId">
            <div v-if="hits.length" class="preclass-member-uid-sep" />
            <p v-else class="preclass-member-uid-hint">
              {{ t('UserPicker.UserIdNotInContacts', { id: typedUserId }) }}
            </p>
            <button type="button" class="preclass-member-hit preclass-member-uid-action" @click="addTypedUserId">
              <span class="preclass-member-uid-icon"><IconUserPlus :size="18" /></span>
              <span class="preclass-member-uid-text">
                <span class="preclass-member-uid-title">
                  {{ t('UserPicker.UserIdAddTitle') }}<code>{{ typedUserId }}</code>
                </span>
                <span class="preclass-member-uid-desc">{{ t('UserPicker.UserIdAddDesc') }}</span>
              </span>
              <span class="preclass-member-uid-btn">{{ t('UserPicker.UserIdAdd') }}</span>
            </button>
          </template>
        </div>
      </template>
    </TUIPopover>

    <div v-if="modelValue.length" class="preclass-member-chips">
      <span v-for="user in modelValue" :key="user.userId" class="preclass-member-chip">
        <TUIAvatar :size="18" :src="avatarOf(user.userId)" :alt="user.userName" />
        <b>{{ user.userName }}</b>
        <button
          type="button"
          class="preclass-member-remove"
          :aria-label="t('Schedule.RemoveParticipant', { userId: user.userName })"
          @click="remove(user.userId)"
        >
          <IconClose :size="10" />
        </button>
      </span>
      <span class="preclass-member-count">{{ t('Schedule.AttendeeCount', { count: modelValue.length }) }}</span>
    </div>

    <UserPickerPC
      v-model:open="pickerOpen"
      mode="schedule"
      can-add-by-user-id
      :selected-ids="modelValue.map(user => user.userId)"
      @confirm="onPicked"
    />
    <TUIDialog
      v-model:open="oneMemberOpen"
      width="380px"
      :title="t(isSmallLimit ? 'Preclass.SmallMemberTitle' : 'Preclass.OneMemberTitle')"
      :confirm-text="t('Preclass.GotIt')"
      cancel-text=""
      @confirm="oneMemberOpen = false"
    >
      {{ t(isSmallLimit ? 'Preclass.SmallMember' : 'Preclass.OneMember') }}
    </TUIDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useLoginState } from 'tuikit-atomicx-vue3/room';
import {
  IconClose,
  IconUserPlus,
  TUIAvatar,
  TUIButton,
  TUIDialog,
  TUIInput,
  TUIPopover,
  TUIToast,
  UserPickerPC,
  t,
  useResolvedContacts,
  useUserIdLookup,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact, PickerContact } from '@tencentcloud/roomkit-web-vue3';
import { CLASS_MODES } from '../../classMode';

const props = defineProps<{
  modelValue: PickedContact[];
  /** Unset means no limit. The search field ignores it; the contact picker still enforces it. */
  maxCount?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PickedContact[]];
}>();

const { loginUserInfo } = useLoginState();
const excludeIds = computed(() => {
  const userId = loginUserInfo.value?.userId;
  return userId ? [userId] : [];
});
const { contacts, refreshContacts } = useResolvedContacts([], excludeIds);

const fieldRef = ref<HTMLElement | null>(null);
const query = ref('');
const menuOpen = ref(false);
const menuWidth = ref(0);
const pickerOpen = ref(false);
const oneMemberOpen = ref(false);
const isSmallLimit = computed(() => props.maxCount === CLASS_MODES.small.maxMembers);

const hits = computed<PickerContact[]>(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return [];
  return contacts.value.filter(item => !props.modelValue.some(user => user.userId === item.userId)
    && (item.userName.toLowerCase().includes(keyword)
      || item.userId.toLowerCase().includes(keyword)));
});

const typedUserId = computed(() => query.value.trim());
const isTypedUserIdTaken = computed(() => props.modelValue.some(user => user.userId === typedUserId.value)
  || contacts.value.some(item => item.userId === typedUserId.value));
const userIdLookupStatus = useUserIdLookup(() => (isTypedUserIdTaken.value ? '' : typedUserId.value));
const canAddTypedUserId = computed(() => userIdLookupStatus.value === 'found');
/* A missing userId falls through to the plain "not found" text. */
const emptyText = computed(() => {
  if (userIdLookupStatus.value === 'invalid') return t('UserPicker.UserIdInvalid');
  if (userIdLookupStatus.value === 'checking') return t('Schedule.AttendeeSearch');
  return t('Schedule.AttendeeEmpty');
});

onMounted(() => {
  refreshContacts();
});

function avatarOf(userId: string) {
  return contacts.value.find(item => item.userId === userId)?.avatarUrl ?? '';
}

function openMenu() {
  if (!query.value.trim()) {
    menuOpen.value = false;
    return;
  }
  menuWidth.value = fieldRef.value?.offsetWidth ?? 0;
  menuOpen.value = true;
}

// Clicks on the anchor toggle the popover; only typing opens it, so accept closes only.
function onMenuToggle(open: boolean) {
  if (!open) menuOpen.value = false;
}

function pick(contact: PickerContact) {
  const user = { userId: contact.userId, userName: contact.userName };
  emit('update:modelValue', [...props.modelValue, user]);
  query.value = '';
  menuOpen.value = false;
}

// Enter adds a member and never submits the booking form.
function onEnter(event: KeyboardEvent) {
  event.preventDefault();
  if (canAddTypedUserId.value) {
    addTypedUserId();
    return;
  }
  if (hits.value.length === 1) pick(hits.value[0]);
}

function addTypedUserId() {
  const userId = typedUserId.value;
  emit('update:modelValue', [...props.modelValue, { userId, userName: userId }]);
  TUIToast.success(t('UserPicker.UserIdAdded', { name: userId }));
  query.value = '';
  menuOpen.value = false;
}

function openPicker() {
  menuOpen.value = false;
  pickerOpen.value = true;
}

function remove(userId: string) {
  emit('update:modelValue', props.modelValue.filter(user => user.userId !== userId));
}

function onPicked(users: PickedContact[]) {
  if (props.maxCount !== undefined && users.length > props.maxCount) {
    oneMemberOpen.value = true;
    return;
  }
  emit('update:modelValue', users);
  pickerOpen.value = false;
}

function showMemberLimit() {
  oneMemberOpen.value = true;
}

defineExpose({ showMemberLimit });
</script>

<style scoped lang="scss">
.preclass-member {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.preclass-member :deep(.rk-popover-anchor) {
  display: block;
}

.rk-input.preclass-member-input {
  box-sizing: border-box;
  height: 36px;
  min-height: 36px;
  font-size: 13px;
  color: var(--rk-text-primary);
  background: var(--pre-fill, var(--rk-bg-raised));
  border: 1px solid transparent;
  border-radius: 10px;
}

.rk-input.preclass-member-input:focus-within {
  border-color: color-mix(in srgb, var(--rk-brand) 60%, transparent);
}

.preclass-member-add {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  color: var(--rk-text-tertiary);
  border: 0;
  border-radius: 8px;
}

.preclass-member-add:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.preclass-member-menu {
  box-sizing: border-box;
  max-height: 240px;
  padding: 6px;
  overflow-y: auto;
}

.preclass-member-empty {
  margin: 0;
  padding: 14px 8px;
  font-size: 13px;
  color: var(--rk-text-tertiary);
  text-align: center;
}

.preclass-member-hit {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 36px;
  padding: 0 8px;
  font: inherit;
  font-size: 13px;
  color: var(--rk-text-primary);
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.preclass-member-hit:hover {
  background: var(--rk-bg-hover);
}

.preclass-member-hit b {
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-member-uid-hint {
  margin: 0;
  padding: 6px 8px 4px;
  overflow: hidden;
  font-size: 12px;
  color: var(--rk-text-tertiary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-member-uid-sep {
  height: 1px;
  margin: 4px 8px;
  background: var(--rk-border);
}

.preclass-member-hit.preclass-member-uid-action {
  gap: 12px;
  min-height: 56px;
  padding: 10px 8px;
}

.preclass-member-uid-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 16%, transparent);
  border-radius: 10px;
}

.preclass-member-uid-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.preclass-member-uid-title,
.preclass-member-uid-desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-member-uid-title {
  font-size: 13px;
  line-height: 20px;
  color: var(--rk-text-secondary);
}

.preclass-member-uid-title code {
  font: inherit;
  font-weight: 500;
  color: var(--rk-text-primary);
}

.preclass-member-uid-desc {
  font-size: 12px;
  line-height: 16px;
  color: var(--rk-text-tertiary);
}

.preclass-member-uid-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--rk-on-accent);
  background: var(--rk-brand);
  border-radius: 8px;
}

.preclass-member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.preclass-member-chip {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  max-width: 160px;
  height: 28px;
  padding: 0 6px 0 4px;
  font-size: 12px;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-brand) 12%, var(--rk-bg-raised));
  border-radius: 999px;
}

.preclass-member-chip b {
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preclass-member-remove {
  display: grid;
  flex: none;
  place-items: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
}

.preclass-member-remove:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.preclass-member-count {
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
</style>
