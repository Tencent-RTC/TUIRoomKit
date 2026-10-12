<template>
  <TUIPopover v-model:open="isOpen" placement="bottom-start" :offset="6" :padded="false">
    <div
      class="current-room-info"
      :class="{ 'is-open': isOpen, 'is-narrow': narrow }"
      role="button"
      tabindex="0"
      :aria-label="t('RoomInfo.Details')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
    >
      <span class="current-room-info-title" :title="displayRoomName">{{
        displayRoomName
      }}</span>
      <span class="current-room-info-time" :title="t('RoomInfo.Duration')">{{
        duration
      }}</span>
      <IconChevron class="current-room-info-caret" :size="12" />
    </div>
    <template #content>
      <section
        class="room-info-card"
        :class="{ 'is-narrow': narrow }"
        role="dialog"
        :aria-label="t('RoomInfo.Details')"
      >
        <header class="room-info-card-header">
          <h2 :title="displayRoomName">
            {{ displayRoomName }}
          </h2>
          <button
            class="room-info-card-close"
            type="button"
            :aria-label="t('RoomInfo.Close')"
            @click="isOpen = false"
          >
            <IconClose :size="12" />
          </button>
        </header>
        <div class="room-info-card-body">
          <div class="room-info-card-fields">
            <div
              v-for="field in fields"
              :key="field.key"
              class="room-info-card-field"
            >
              <span class="room-info-card-label">{{ field.label }}</span>
              <span
                class="room-info-card-value"
                :class="field.key === 'link' ? 'link' : 'num'"
                :title="field.raw"
              >{{ field.value || '—' }}</span>
              <button
                v-if="field.raw"
                class="room-info-card-icon"
                :class="{ copied: copiedFields[field.key] }"
                type="button"
                :aria-label="t('RoomInfo.Copy', { field: field.label })"
                :title="t('RoomInfo.Copy', { field: field.label })"
                @click="copy(field.key)"
              >
                <IconCheck
                  v-if="copiedFields[field.key]"
                  :key="`check-${field.key}`"
                  class="room-info-card-check"
                  :size="12"
                />
                <IconCopy v-else :key="`copy-${field.key}`" :size="12" />
              </button>
            </div>
          </div>
          <div class="room-info-card-host">
            <span class="room-info-card-avatar">
              <img v-if="owner?.avatarUrl" :src="owner.avatarUrl" alt="">
              <span v-else>{{ ownerInitial }}</span>
            </span>
            <div class="room-info-card-host-info">
              <div class="room-info-card-host-name" :title="ownerName">
                {{ ownerName }}
              </div>
              <div class="room-info-card-host-label">
                {{ t('RoomInfo.Host') }}
              </div>
            </div>
          </div>
          <button
            class="room-info-card-copy"
            :class="{ copied: copiedFields.invitation }"
            type="button"
            :disabled="!roomId"
            @click="copy('invitation')"
          >
            <IconCheck
              v-if="copiedFields.invitation"
              :key="'check-invitation'"
              class="room-info-card-check"
              :size="12"
            />
            <IconCopy v-else :key="'copy-invitation'" :size="12" />
            <span class="room-info-card-button-label">{{
              t(
                copiedFields.invitation
                  ? 'RoomInfo.Copied'
                  : 'RoomInfo.Invitation',
              )
            }}</span>
          </button>
          <p v-if="copyError" class="room-info-card-error" role="alert">
            {{ copyError }}
          </p>
          <span class="room-info-card-announcement" role="status">{{
            copied ? t('RoomInfo.Copied') : ''
          }}</span>
        </div>
      </section>
    </template>
  </TUIPopover>
</template>

<script setup lang="ts">
import { IconCheck, IconChevron, IconClose, IconCopy, TUIPopover } from '../../../base';
import { t } from '../../../i18n';
import { useCurrentRoomInfo } from './useCurrentRoomInfo';

const props = defineProps<{
  narrow?: boolean;
  roomName?: string;
  inviteUrl?: string;
}>();
const {
  isOpen,
  roomId,
  roomName: displayRoomName,
  owner,
  ownerName,
  ownerInitial,
  duration,
  fields,
  copied,
  copiedFields,
  copyError,
  copy,
} = useCurrentRoomInfo({
  roomName: () => props.roomName ?? '',
  inviteUrl: () => props.inviteUrl,
});
</script>

<style scoped lang="scss">
/* Light bar + compact card measured from pre-conference.html .info-chip / .info-card. */
.current-room-info {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: 460px;
  height: 24px;
  padding: 0 8px;
  color: var(--rk-text-primary);
  cursor: pointer;
  user-select: none;
  background: transparent;
  border: none;
  border-radius: 8px;
  outline: none;
  transition: background 0.15s;
}

.current-room-info:hover,
.current-room-info.is-open {
  background: var(--rk-bg-hover);
}

.current-room-info:active {
  background: var(--rk-option-hover);
}

.current-room-info-title {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.current-room-info-time {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-secondary);
  letter-spacing: 0.02em;
}

.current-room-info-caret {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--rk-text-tertiary);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.current-room-info.is-open .current-room-info-caret {
  color: var(--rk-brand-hover);
  transform: rotate(180deg);
}

.rk-root[data-rk-theme='light'] .current-room-info.is-open .current-room-info-caret {
  color: var(--rk-brand);
}

.current-room-info.is-narrow {
  gap: 8px;
  max-width: 210px;
  height: 32px;
  padding: 0 8px 0 10px;
}

.current-room-info.is-narrow .current-room-info-title {
  max-width: 110px;
  font-size: 12px;
}

.current-room-info.is-narrow .current-room-info-time {
  font-size: 11px;
}

.room-info-card {
  display: flex;
  flex-direction: column;
  width: 256px;
  max-width: min(256px, calc(100vw - 40px));
  max-height: min(440px, calc(100vh - 140px));
  overflow: hidden;
  font-size: 16px;
  line-height: normal;
  color: var(--rk-text-primary);
  letter-spacing: -0.005em;
  pointer-events: auto;
  background: var(--rk-bg-surface);
  border: none;
  border-radius: var(--rk-radius-md);
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.32),
    0 2px 10px rgba(0, 0, 0, 0.18);
  transform-origin: top left;
  animation: room-info-enter 260ms cubic-bezier(0.22, 1.12, 0.36, 1);
}

.rk-root[data-rk-theme='light'] .room-info-card {
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.14),
    0 2px 8px var(--rk-border);
}

.room-info-card.is-narrow {
  width: 280px;
}

.room-info-card-header {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: flex-start;
  padding: 10px 10px 0;
}

.room-info-card h2 {
  display: -webkit-box;
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--rk-text-primary);
  -webkit-line-clamp: 2;
  letter-spacing: -0.012em;
  -webkit-box-orient: vertical;
}

.room-info-card-close {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  margin: -1px -6px 0 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
}

.room-info-card-close:hover {
  color: var(--rk-text-primary);
  background: var(--rk-option-hover);
}

.room-info-card-close:active {
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}

.room-info-card-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.room-info-card-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.room-info-card-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20px;
  gap: 2px 6px;
  align-items: center;
  min-width: 0;
}

.room-info-card-label {
  grid-area: 1 / 1;
  font-size: 10px;
  font-weight: 500;
  line-height: 13px;
  color: var(--rk-text-tertiary);
  letter-spacing: 0.01em;
}

.room-info-card-value {
  grid-area: 2 / 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-info-card-value.num {
  font-size: 12px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.room-info-card-value.link {
  font-family: inherit;
  font-size: 11px;
  font-weight: 400;
  color: var(--rk-text-secondary);
  letter-spacing: 0;
}

.room-info-card-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--rk-text-tertiary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 5px;
  transition:
    background 0.14s,
    color 0.14s,
    transform 0.1s;
}

.room-info-card-icon:hover {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.room-info-card-icon:active {
  transform: scale(0.88);
}

.room-info-card-icon:focus-visible {
  outline: 2px solid var(--rk-focus-ring);
  outline-offset: 2px;
}

.room-info-card-icon.copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 12%, transparent);
}

.room-info-card-field .room-info-card-icon {
  position: relative;
  z-index: 1;
  grid-area: 2 / 2;
  justify-self: end;
  margin: -4px 0;
  background: var(--rk-bg-surface);
}

.room-info-card-field:hover .room-info-card-icon {
  color: var(--rk-text-secondary);
}

.room-info-card-field:hover .room-info-card-icon.copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 12%, transparent);
}

.room-info-card-host {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 10px 0;
  margin: 10px -10px 0;
  border-top: 1px solid var(--rk-border);
}

.room-info-card-avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  color: var(--rk-avatar-fg);
  background: var(--rk-avatar-bg);
  border-radius: 50%;
}

.room-info-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.room-info-card-host-info {
  flex: 1;
  min-width: 0;
}

.room-info-card-host-name {
  overflow: hidden;
  font-size: 12px;
  font-weight: 500;
  line-height: 15px;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-info-card-host-label {
  font-size: 10px;
  font-weight: 400;
  line-height: 13px;
  color: var(--rk-text-tertiary);
}

.room-info-card-copy {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 28px;
  padding: 0;
  margin-top: 10px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--rk-brand) 82%, var(--rk-text-primary));
  letter-spacing: -0.005em;
  cursor: pointer;
  background: var(--rk-brand-soft);
  border: none;
  border-radius: 8px;
  transition:
    background 0.15s,
    transform 0.1s,
    color 0.15s;
}

.room-info-card-copy .room-info-card-button-label {
  min-width: 6em;
  text-align: center;
}

.room-info-card-copy:hover {
  background: color-mix(in srgb, var(--rk-brand) 22%, transparent);
}

.room-info-card-copy:active {
  transform: scale(0.985);
}

.room-info-card-copy.copied {
  color: color-mix(in srgb, var(--rk-success) 80%, var(--rk-text-primary));
  background: color-mix(in srgb, var(--rk-success) 14%, transparent);
}

.room-info-card-copy:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.room-info-card-close:focus-visible,
.room-info-card-copy:focus-visible {
  outline: 2px solid var(--rk-focus-ring);
  outline-offset: 2px;
}

.room-info-card-check {
  animation: ic-pop 0.26s cubic-bezier(0.22, 1.3, 0.36, 1);
}

.room-info-card-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--rk-danger);
}

.room-info-card-announcement {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

@keyframes ic-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes room-info-enter {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .room-info-card,
  .room-info-card-check {
    animation: none;
  }

  .current-room-info,
  .current-room-info-caret {
    transition: none;
  }

  .room-info-card-copy:active,
  .room-info-card-icon:active {
    transform: none;
  }
}
</style>

<style lang="scss">
/* TUIPopover teleports the card; strip the float chrome so the card owns the surface. */
.rk-float.rk-popover:has(> .room-info-card) {
  min-width: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
</style>
