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
          @enter="pickOnly"
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
          <p v-if="!hits.length" class="preclass-member-empty">
            {{ t('Schedule.AttendeeEmpty') }}
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
        </div>
      </template>
    </TUIPopover>

    <div v-if="modelValue" class="preclass-member-chips">
      <span class="preclass-member-chip">
        <TUIAvatar :size="18" :src="avatarOf(modelValue.userId)" :alt="modelValue.userName" />
        <b>{{ modelValue.userName }}</b>
        <button
          type="button"
          class="preclass-member-remove"
          :aria-label="t('Schedule.RemoveParticipant', { userId: modelValue.userName })"
          @click="emit('update:modelValue', undefined)"
        >
          <IconClose :size="10" />
        </button>
      </span>
      <span class="preclass-member-count">{{ t('Schedule.AttendeeCount', { count: 1 }) }}</span>
    </div>

    <UserPickerPC
      v-model:open="pickerOpen"
      mode="schedule"
      :selected-ids="modelValue ? [modelValue.userId] : []"
      @confirm="onPicked"
    />
    <TUIDialog
      v-model:open="oneMemberOpen"
      width="380px"
      :title="t('Preclass.OneMemberTitle')"
      :confirm-text="t('Preclass.GotIt')"
      cancel-text=""
      @confirm="oneMemberOpen = false"
    >
      {{ t('Preclass.OneMember') }}
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
  UserPickerPC,
  t,
  useResolvedContacts,
} from '@tencentcloud/roomkit-web-vue3';
import type { PickedContact, PickerContact } from '@tencentcloud/roomkit-web-vue3';

const props = defineProps<{
  /** A 1v1 class takes exactly one student. */
  modelValue?: PickedContact;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: PickedContact | undefined];
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

const hits = computed<PickerContact[]>(() => {
  const keyword = query.value.trim().toLowerCase();
  if (!keyword) return [];
  return contacts.value.filter(item => item.userId !== props.modelValue?.userId
    && (item.userName.toLowerCase().includes(keyword)
      || item.userId.toLowerCase().includes(keyword)));
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
  emit('update:modelValue', { userId: contact.userId, userName: contact.userName });
  query.value = '';
  menuOpen.value = false;
}

function pickOnly() {
  if (hits.value.length === 1) pick(hits.value[0]);
}

function openPicker() {
  menuOpen.value = false;
  pickerOpen.value = true;
}

function onPicked(users: PickedContact[]) {
  if (users.length > 1) {
    oneMemberOpen.value = true;
    return;
  }
  emit('update:modelValue', users[0]);
  pickerOpen.value = false;
}
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
