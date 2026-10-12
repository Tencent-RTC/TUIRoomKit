<template>
  <div
    v-if="showLoading"
    class="join-overlay"
    :aria-hidden="false"
  >
    <TUILoading
      variant="card"
      size="lg"
      :tip="loadingText"
    />
  </div>
  <TUIDialog
    :open="passwordOpen"
    :title="t('RoomEntry.PasswordTitle')"
    width="420px"
    :confirm-text="t('RoomEntry.Join')"
    :cancel-text="t('RoomEntry.Cancel')"
    :closable="false"
    :close-on-overlay="false"
    @update:open="onPasswordOpen"
    @confirm="onPasswordConfirm"
    @cancel="onPasswordCancel"
  >
    <TUIInput
      :model-value="password"
      type="password"
      show-password
      :maxlength="6"
      placeholder=""
      text-align="center"
      auto-focus
      :status="passwordError ? 'error' : 'default'"
      @update:model-value="onPasswordInput"
      @enter="onPasswordConfirm"
    />
    <p v-if="passwordError" class="join-overlay-password-error">
      {{ passwordError }}
    </p>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { TUIDialog, TUIInput, TUILoading } from '../../base';
import { t } from '../../i18n';
import { roomEntry } from '../../core/session';
import type { RoomEntryPhase } from '../../core/session';

const LOADING_TEXT_KEYS: Partial<Record<RoomEntryPhase, string>> = {
  login: 'RoomEntry.LoggingIn',
  profile: 'RoomEntry.Preparing',
  joining: 'RoomEntry.Joining',
};

const invalidPassword = ref(false);
const hideChallengeError = ref(false);
const password = ref('');

const isLoading = computed(() => (
  roomEntry.phase.value === 'login'
  || roomEntry.phase.value === 'profile'
  || roomEntry.phase.value === 'joining'
));
const showLoading = computed(() => isLoading.value);
const passwordOpen = computed(() => roomEntry.phase.value === 'password');
const loadingText = computed(() => t(LOADING_TEXT_KEYS[roomEntry.phase.value] ?? 'RoomEntry.Joining'));
const passwordError = computed(() => {
  if (invalidPassword.value) {
    return t('RoomEntry.InvalidPassword');
  }
  if (!hideChallengeError.value && roomEntry.passwordChallenge.value === 'incorrect') {
    return t('RoomEntry.WrongPassword');
  }
  return '';
});

function onPasswordInput(value: string | number | null) {
  password.value = String(value ?? '').replace(/\D/g, '').slice(0, 6);
  invalidPassword.value = false;
  hideChallengeError.value = true;
}

function onPasswordConfirm() {
  if (!/^\d{6}$/.test(password.value)) {
    invalidPassword.value = true;
    return;
  }
  invalidPassword.value = false;
  roomEntry.submitPassword(password.value);
}

function onPasswordCancel() {
  roomEntry.cancelPassword();
}

function onPasswordOpen(next: boolean) {
  if (!next && passwordOpen.value) {
    roomEntry.cancelPassword();
  }
}

watch(() => roomEntry.phase.value, (nextPhase) => {
  if (nextPhase === 'password') {
    password.value = '';
    invalidPassword.value = false;
    hideChallengeError.value = false;
  }
});
</script>

<style scoped lang="scss">
.join-overlay {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}

.join-overlay-password-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
  text-align: center;
}
</style>
