<template>
  <section class="join-card">
    <div class="action-buttons">
      <button
        type="button"
        class="action-btn primary"
        @click="emit('create')"
      >
        <span class="action-icon"><IconCam :size="18" /></span>
        <span class="action-body">
          <strong>{{ t('Preconference.CreateTitle') }}</strong>
          <small>{{ t('Preconference.CreateSub') }}</small>
        </span>
        <span class="action-arrow"><IconArrowRight :size="16" /></span>
      </button>
      <button
        type="button"
        class="action-btn"
        @click="emit('schedule')"
      >
        <span class="action-icon"><IconCalendar :size="18" /></span>
        <span class="action-body">
          <strong>{{ t('Preconference.ScheduleTitle') }}</strong>
          <small>{{ t('Preconference.ScheduleSub') }}</small>
        </span>
        <span class="action-arrow"><IconArrowRight :size="16" /></span>
      </button>
    </div>
    <div class="divider-text">
      {{ t('Preconference.OrJoin') }}
    </div>
    <form class="join-form" @submit.prevent="join">
      <TUIInput
        v-model="roomInput"
        type="number"
        class="join-input-row"
        :aria-label="t('Preconference.RoomIdLabel')"
        :placeholder="t('Preconference.RoomIdPlaceholder')"
        :maxlength="6"
      >
        <template #prefix>
          <span class="prefix-icon" aria-hidden="true">
            <IconHash :size="16" />
          </span>
        </template>
        <template #suffix>
          <TUIButton
            class="join-submit"
            :class="{ 'is-enabled': canJoin }"
            :variant="canJoin ? 'primary' : 'secondary'"
            size="sm"
            native-type="submit"
            :disabled="!canJoin"
            :aria-label="t('Preconference.Join')"
          >
            <IconArrowRight class="join-arrow" :size="16" />
          </TUIButton>
        </template>
      </TUIInput>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IconArrowRight,
  IconCalendar,
  IconCam,
  IconHash,
  TUIButton,
  TUIInput,
  t,
} from '@tencentcloud/roomkit-web-vue3';

const roomInput = defineModel<string>('roomId', { default: '' });

const emit = defineEmits<{
  create: [];
  schedule: [];
  join: [roomId: string];
}>();

const canJoin = computed(() => Boolean(roomInput.value));

function join() {
  const id = roomInput.value == null ? '' : String(roomInput.value).trim();
  if (!id) {
    return;
  }
  emit('join', id);
}
</script>

<style scoped lang="scss">
button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

input:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 3px;
}

.join-card {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px 18px;
  background: var(--rk-bg-surface);
  border-radius: var(--rk-radius-xl);
  container-type: inline-size;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  min-width: 0;
  min-height: 68px;
  padding: 14px 16px;
  color: var(--rk-text-primary);
  text-align: left;
  background: var(--rk-bg-surface);
  border: 1.5px solid var(--rk-border);
  border-radius: 14px;
  transition:
    background-color var(--rk-duration) var(--rk-ease),
    border-color var(--rk-duration) var(--rk-ease),
    color var(--rk-duration) var(--rk-ease),
    filter var(--rk-duration) var(--rk-ease);
}

.action-btn:disabled {
  opacity: 0.5;
}

.action-btn:focus,
.action-btn:focus-visible {
  outline: none;
}

.action-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rk-brand) 6%, var(--rk-bg-surface));
}

.action-btn.primary {
  color: var(--rk-on-accent);
  background: var(--rk-brand);
  border-color: transparent;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--rk-brand);
  filter: brightness(1.06);
}

.action-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
  border-radius: 10px;
}

.action-btn.primary .action-icon {
  color: var(--rk-on-accent);
  background: rgb(255 255 255 / 22%);
}

.action-body {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
}

.action-body strong,
.action-body small {
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-body strong {
  display: block;
  font-size: var(--rk-fs-md);
  font-weight: 600;
}

.action-body small {
  display: block;
  margin-top: 2px;
  font-size: var(--rk-fs-sm);
  opacity: 0.75;
}

.action-arrow {
  flex: none;
  color: currentcolor;
  opacity: 0;
  transition:
    opacity var(--rk-duration) var(--rk-ease),
    transform var(--rk-duration) var(--rk-ease);
  transform: translateX(-6px);
}

.action-arrow :deep(svg) {
  display: block;
}

.action-btn.primary .action-arrow {
  opacity: 0.7;
  transform: translateX(0);
}

.action-btn:hover:not(:disabled) .action-arrow {
  opacity: 0.8;
  transform: translateX(0);
}

.action-btn.primary:hover:not(:disabled) .action-arrow {
  opacity: 1;
  transform: translateX(3px);
}

.divider-text {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 8px 0 4px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-text-tertiary);
  letter-spacing: 0.06em;
}

.divider-text::before,
.divider-text::after {
  flex: 1;
  height: 1px;
  content: '';
  background: var(--rk-border);
}

.join-form {
  --join-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  display: block;
}

.join-form .join-input-row {
  gap: 6px;
  min-height: 0;
  padding: 5px 5px 5px 8px;
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: 14px;
  transition: all 0.2s var(--rk-ease);
}

.join-form .join-input-row:focus-within {
  background: var(--rk-bg-raised);
  border-color: var(--rk-border);
  box-shadow: 0 0 0 3px var(--rk-brand-soft);
}

.join-form .join-input-row :deep(.rk-input-addon) {
  padding: 0;
}

.join-form .join-input-row :deep(.rk-input-field) {
  height: 40px;
  padding: 0 8px;
  font-size: var(--rk-fs-md);
  font-weight: 500;
}

.join-form .join-input-row :deep(.rk-input-field::placeholder) {
  font-weight: 400;
}

.prefix-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--rk-text-tertiary);
  border-radius: 8px;
  transition: color 0.15s;
}

.join-form .join-input-row:focus-within .prefix-icon {
  color: var(--rk-brand);
}

.join-form .join-submit {
  position: relative;
  flex: none;
  width: 38px;
  min-width: 38px;
  height: 38px;
  padding: 0;
  overflow: hidden;
  border-radius: 10px;
  transition: all 0.25s var(--join-spring);
}

.join-form .join-submit:disabled {
  color: var(--rk-text-tertiary);
  cursor: not-allowed;
  background: #eceef4;
  border-color: transparent;
  opacity: 1;
}

.join-form .join-submit.is-enabled {
  animation: join-submit-ready 0.5s var(--join-spring);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--rk-brand) 35%, transparent);
}

.join-form .join-submit.is-enabled:hover {
  background: var(--rk-brand-hover);
  border-color: var(--rk-brand-hover);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--rk-brand) 45%, transparent);
}

.join-form .join-submit.is-enabled:active {
  transform: scale(0.95);
}

.join-form .join-submit.is-enabled::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border-radius: 10px;
  background: radial-gradient(circle at 50% 100%, rgb(255 255 255 / 30%), transparent 70%);
}

.join-arrow {
  transition: transform 0.25s var(--join-spring);
}

.join-form .join-submit.is-enabled:hover .join-arrow {
  transform: translateX(2px);
}

@keyframes join-submit-ready {
  0% {
    transform: scale(0.85);
    opacity: 0.6;
  }

  60% {
    transform: scale(1.08);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@container (width < 410px) {
  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    min-height: 60px;
  }
}

@media (width <= 520px) {
  .join-card {
    padding: 16px;
  }

  .action-arrow {
    display: none;
  }
}
</style>
