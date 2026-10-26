<template>
  <TUIDialog
    :open="open"
    width="340px"
    :closable="false"
    :close-on-overlay="false"
    :close-on-esc="false"
    :confirm-text="''"
    :cancel-text="''"
  >
    <template #header>
      <div class="room-invitation-head">
        <span class="room-invitation-avatar">
          <TUIAvatar
            :src="invitation?.inviterAvatar"
            :alt="invitation?.inviterName"
            :size="46"
          />
        </span>
        <div class="room-invitation-who">
          <div class="room-invitation-name">
            {{ invitation?.inviterName }}
          </div>
          <div class="room-invitation-sub">
            {{ t('RoomInvitation.Subtitle') }}
          </div>
        </div>
      </div>
    </template>
    <div class="room-invitation-meta">
      <div class="room-invitation-row">
        <span>{{ t('RoomInvitation.Topic') }}</span>
        <b>{{ invitation?.roomName }}</b>
      </div>
      <div class="room-invitation-row">
        <span>{{ t('RoomInvitation.Id') }}</span>
        <b>{{ formattedRoomId }}</b>
      </div>
    </div>
    <template #footer>
      <TUIButton
        class="room-invitation-reject"
        variant="secondary"
        @click="reject"
      >
        {{ t('RoomInvitation.Reject') }}
        <span
          v-if="countdown > 0"
          class="room-invitation-cd"
        > ({{ countdown }}s)</span>
      </TUIButton>
      <TUIButton
        class="room-invitation-accept"
        variant="primary"
        @click="accept"
      >
        {{ t('RoomInvitation.Accept') }}
      </TUIButton>
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIAvatar, TUIButton, TUIDialog, t } from '@tencentcloud/roomkit-web-vue3';
import { useRoomInvitation } from './useRoomInvitation';
import type { AcceptCallParams } from './useRoomInvitation';

const emit = defineEmits<{
  accept: [params: AcceptCallParams];
}>();

const { incoming: invitation, countdown, accept, reject } = useRoomInvitation({
  onAcceptCall: params => emit('accept', params),
});

const open = computed(() => Boolean(invitation.value));
const formattedRoomId = computed(() => formatRoomId(invitation.value?.roomId ?? ''));

function formatRoomId(roomId: string) {
  return roomId.replace(/(\d{3})(?=\d)/g, '$1 ');
}
</script>

<style scoped lang="scss">
.room-invitation-head {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.room-invitation-avatar {
  position: relative;
  flex: none;
  width: 46px;
  height: 46px;
}

.room-invitation-avatar::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  border: 2px solid var(--rk-brand);
  border-radius: 50%;
  animation: room-invitation-ring 1.8s ease-out infinite;
}

.room-invitation-who {
  min-width: 0;
}

.room-invitation-name {
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.room-invitation-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--rk-text-secondary);
}

.room-invitation-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 12px;
  background: var(--rk-bg-hover);
  border-radius: 12px;
}

.room-invitation-row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.room-invitation-row span {
  flex: none;
  color: var(--rk-text-secondary);
}

.room-invitation-row b {
  overflow: hidden;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-primary);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-invitation-cd {
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-secondary);
}

@keyframes room-invitation-ring {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }

  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}
</style>

<!-- Dialog chrome is teleported; :has() targets this card without changing TUIDialog. -->
<style lang="scss">
.rk-dialog:has(.room-invitation-head) {
  padding: 22px 22px 18px;
  overflow: visible;
  border: none;
}

.rk-dialog:has(.room-invitation-head) .rk-dialog-header {
  margin-bottom: 0;
}

.rk-dialog:has(.room-invitation-head) .rk-dialog-body {
  overflow: visible;
  color: inherit;
}

.rk-dialog:has(.room-invitation-head) .rk-dialog-footer .rk-btn.room-invitation-reject,
.rk-dialog:has(.room-invitation-head) .rk-dialog-footer .rk-btn.room-invitation-accept {
  height: 42px;
  padding: 0 20px;
  font-size: 13px;
  border-radius: 12px;
}

.rk-dialog:has(.room-invitation-head) .rk-dialog-footer .rk-btn.room-invitation-reject {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
  border-color: transparent;
}

.rk-dialog:has(.room-invitation-head) .rk-dialog-footer .rk-btn.room-invitation-reject:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rk-text-primary) 14%, transparent);
}
</style>
