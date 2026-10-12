<template>
  <div class="sch-policy">
    <div class="sch-field sch-field-opts">
      <span class="sch-label">{{ t('Schedule.Security') }}</span>
      <div class="sch-check-col">
        <div
          class="sch-check"
          :class="{ 'is-on': passwordProtected }"
          @click="togglePassword"
        >
          <span
            class="sch-check-box"
            aria-hidden="true"
          />
          <span>{{ t('Schedule.RoomPassword') }}</span>
        </div>
        <div
          v-if="passwordProtected"
          class="sch-pw-wrap"
        >
          <TUIInput
            class="sch-pw-field"
            :model-value="password"
            type="password"
            show-password
            :status="passwordError ? 'error' : 'default'"
            :maxlength="PASSWORD_LENGTH"
            :placeholder="t('Schedule.PasswordPlaceholder', { length: PASSWORD_LENGTH })"
            @update:model-value="onPasswordInput"
          />
          <div
            v-if="passwordError"
            class="sch-pw-hint is-on"
          >
            {{ t('Schedule.Error.Password', { length: PASSWORD_LENGTH }) }}
          </div>
        </div>
      </div>
    </div>

    <div class="sch-field sch-field-opts">
      <span class="sch-label">{{ t('Schedule.Members') }}</span>
      <div class="sch-check-col">
        <div
          class="sch-check"
          :class="{ 'is-on': isAllMicrophoneDisabled }"
          @click="$emit('update:isAllMicrophoneDisabled', !isAllMicrophoneDisabled)"
        >
          <span
            class="sch-check-box"
            aria-hidden="true"
          />
          <span>{{ t('Schedule.OptionMuteAll') }}</span>
        </div>
        <div
          class="sch-check"
          :class="{ 'is-on': isAllCameraDisabled }"
          @click="$emit('update:isAllCameraDisabled', !isAllCameraDisabled)"
        >
          <span
            class="sch-check-box"
            aria-hidden="true"
          />
          <span>{{ t('Schedule.MuteVideo') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TUIInput } from '../../../base';
import { t } from '../../../i18n';
import {
  PASSWORD_LENGTH,
  isPasswordComplete,
  randomPassword,
  sanitizePassword,
} from './scheduleForm';

const props = defineProps<{
  passwordProtected: boolean;
  password: string;
  passwordVisible: boolean;
  passwordError: boolean;
  isAllMicrophoneDisabled: boolean;
  isAllCameraDisabled: boolean;
}>();

const emit = defineEmits<{
  'update:passwordProtected': [value: boolean];
  'update:password': [value: string];
  'update:passwordVisible': [value: boolean];
  'update:passwordError': [value: boolean];
  'update:isAllMicrophoneDisabled': [value: boolean];
  'update:isAllCameraDisabled': [value: boolean];
}>();

function togglePassword() {
  const next = !props.passwordProtected;
  emit('update:passwordProtected', next);
  emit('update:passwordError', false);
  if (next && !props.password) {
    emit('update:password', randomPassword());
  }
  if (!next) {
    emit('update:passwordVisible', false);
  }
}

function onPasswordInput(value: string | number | null) {
  const next = sanitizePassword(String(value ?? ''));
  emit('update:password', next);
  if (isPasswordComplete(next)) {
    emit('update:passwordError', false);
  }
}
</script>

<style scoped lang="scss">
.sch-policy {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.sch-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px 16px;
  align-items: start;
  min-width: 0;
}

.sch-label {
  padding-top: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: var(--rk-text-secondary);
}

.sch-check-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.sch-check {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 0;
  font-size: 14px;
  line-height: 22px;
  color: var(--rk-text-secondary);
  cursor: pointer;
}

.sch-check-box {
  display: grid;
  flex: none;
  place-items: center;
  width: 16px;
  height: 16px;
  background: var(--rk-bg-surface);
  border: 1.5px solid var(--rk-border-strong);
  border-radius: 4px;
}

.sch-check.is-on .sch-check-box {
  background: var(--rk-brand);
  border-color: var(--rk-brand);
}

.sch-check.is-on .sch-check-box::after {
  width: 8px;
  height: 4px;
  margin-top: -1px;
  content: '';
  border: 1.6px solid #fff;
  border-top: 0;
  border-right: 0;
  transform: rotate(-45deg);
}

.sch-pw-wrap {
  width: 100%;
}

.sch-pw-field {
  box-sizing: border-box;
  height: 40px;
  min-height: 40px;
  background: var(--rk-bg-raised, var(--rk-bg-surface));
  border: 1px solid var(--rk-border);
  border-radius: 12px;
}

.sch-pw-wrap .sch-pw-field:focus-within {
  border-color: var(--rk-brand);
  box-shadow: 0 0 0 1px var(--rk-brand);
}

.sch-pw-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--rk-danger);
}

@media (width <= 520px) {
  .sch-field {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
  }
}
</style>
