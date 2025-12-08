<template>
  <Teleport :to="`#room-invitation-container`">
    <Transition name="room-invitation" appear>
      <div v-if="visible" :class="$style.invitationContainer">
        <!-- Header: Avatar and invitation info -->
        <div :class="$style.header">
          <Avatar
            :src="inviterAvatar"
            :size="40"
            :class="$style.avatar"
          />
          <div :class="$style.inviteText">
            <span :class="$style.inviteTextContent">{{ t('RoomInvitation.InviteText', { name: inviterName }) }}</span>
          </div>
        </div>

        <!-- Room information -->
        <div :class="$style.roomInfo">
          <h3 :class="$style.roomTitle">
            {{ roomName }}
          </h3>
          <div :class="$style.roomDetails">
            <span :class="$style.detail">{{ t('RoomInvitation.Host') }}{{ hostName }}</span>
            <span :class="$style.divider">|</span>
            <span :class="$style.detail">{{ t('RoomInvitation.Participants') }}{{ participantCount }}{{ t('RoomInvitation.ParticipantsUnit') }}</span>
          </div>
        </div>

        <!-- Divider line -->
        <div :class="$style.dividerLine" />

        <!-- Action buttons -->
        <div :class="$style.actions">
          <TUIButton
            type="default"
            color="gray"
            size="big"
            @click="handleCancel"
          >
            <span :class="$style.cancelText">
              {{ t('RoomInvitation.NotJoin') }}
              <span v-if="countdown > 0" :class="$style.countdown">
                ({{ countdown }}s)
              </span>
            </span>
          </TUIButton>
          <TUIButton
            type="primary"
            size="big"
            @click="handleAccept"
          >
            <span :class="$style.acceptText">
              <IconEnterRoom class="icon-button" />
              {{ t('RoomInvitation.JoinMeeting') }}
            </span>
          </TUIButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { IconEnterRoom, TUIButton, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from 'tuikit-atomicx-vue3/room';

export interface RoomInvitationOptions {
  inviterName: string;
  inviterAvatar: string;
  roomName: string;
  hostName: string;
  participantCount: number;
  duration?: number;
  onCancel?: () => void;
  onAccept?: () => void;
  onTimeout?: () => void;
}

interface Props {
  options: RoomInvitationOptions;
}

const { t } = useUIKit();
const props = defineProps<Props>();

const visible = ref(false);
const countdown = ref(0);
let countdownTimer: number | null = null;

const inviterName = computed(() => props.options.inviterName);
const inviterAvatar = computed(() => props.options.inviterAvatar);
const roomName = computed(() => props.options.roomName);
const hostName = computed(() => props.options.hostName);
const participantCount = computed(() => props.options.participantCount);
const duration = computed(() => props.options.duration || 30);

const hide = () => {
  visible.value = false;
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const handleCancel = () => {
  props.options.onCancel?.();
  hide();
};

const handleAccept = () => {
  props.options.onAccept?.();
  hide();
};

const handleTimeout = () => {
  props.options.onTimeout?.();
  hide();
};

const startCountdown = () => {
  countdown.value = duration.value;
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
      handleTimeout();
    }
  }, 1000);
};

onMounted(() => {
  visible.value = true;
  startCountdown();
});

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});
</script>

<style module lang="scss">
.invitationContainer {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 10000;
  pointer-events: auto;
  background: var(--bg-color-dialog);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 12px 24px var(--shadow-color);
  max-width: 320px;
  min-width: 280px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.avatar {
  margin-right: 12px;
}

.inviteText {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  color: var(--text-color-primary);
  font-weight: 500;
  line-height: 1.4;
  flex: 1;
  min-width: 0;
}

.inviteTextContent {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inviterName {
  color: var(--text-color-link);
  font-weight: 600;
}

.roomInfo {
  margin-bottom: 20px;
}

.roomTitle {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.roomDetails {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-color-secondary);
  gap: 8px;
}

.detail {
  font-weight: 500;
}

.divider {
  color: var(--text-color-tertiary);
}

.dividerLine {
  height: 1px;
  background: var(--stroke-color-primary);
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.cancelText {
  color: var(--text-color-secondary);
  font-weight: 500;
  font-size: 14px;
}

.countdown {
  color: var(--text-color-tertiary);
  font-weight: 400;
}

.acceptText {
  color: var(--text-color-button);
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.joinIcon {
  width: 14px;
  height: 14px;
}

// Animation effects
:global(.room-invitation-enter-active),
:global(.room-invitation-leave-active) {
  transition: all 0.3s ease;
}

:global(.room-invitation-enter-from) {
  opacity: 0;
  transform: translateX(100%);
}

:global(.room-invitation-leave-to) {
  opacity: 0;
  transform: translateX(100%);
}

// Responsive design
@media (max-width: 640px) {
  .invitationContainer {
    top: 20px;
    right: 16px;
    left: 16px;
    margin: 0;
    padding: 24px;
    min-width: auto;
    max-width: none;
  }

  .actions {
    flex-direction: column;
    gap: 12px;
  }

  .cancelButton,
  .acceptButton {
    width: 100%;
  }

  .roomTitle {
    font-size: 20px;
  }

  .inviteText {
    font-size: 18px;
  }
}
</style>
