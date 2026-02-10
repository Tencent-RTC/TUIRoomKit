<template>
  <Teleport :to="`#room-invitation-h5-container`">
    <Transition name="room-invitation-h5" appear>
      <div v-if="visible" class="invitation-container">
        <div
          class="background-blur"
          :style="{ backgroundImage: `url(${inviterAvatar})` }"
        />
        <div class="background-mask" />

        <div class="content">
          <div class="room-info-container">
            <div class="avatar-wrapper">
              <Avatar
                :src="inviterAvatar"
                :size="60"
                class="avatar"
              />
            </div>

            <div class="invite-text">
              {{ t('RoomInvitation.InviteText', { name: inviterName }) }}
            </div>

            <div class="room-info">
              <div class="room-title">
                {{ roomName }}
              </div>
              <div class="room-details">
                <span class="detail">{{ t('RoomInvitation.Host') }}{{ hostName }}</span>
                <span class="divider">|</span>
                <span class="detail">
                  {{ t('RoomInvitation.Participants') }}{{ participantCount }}{{ t('RoomInvitation.ParticipantsUnit') }}
                </span>
              </div>
            </div>
          </div>

          <div class="actions">
            <div class="action-item" @click="handleCancel">
              <span class="reject-button">
                <IconClose size="18" class="reject-button-icon" />
              </span>
              <span class="reject-button-text">{{ t('RoomInvitation.NotJoin') }}</span>
            </div>
            <div class="action-item" @click="handleAccept">
              <span class="accept-button">
                <IconArrowStrokeUp size="18" class="accept-button-icon" />
              </span>
              <span class="accept-button-text">{{ t('RoomInvitation.JoinMeeting') }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { IconArrowStrokeUp, useUIKit, IconClose } from '@tencentcloud/uikit-base-component-vue3';
import { Avatar } from 'tuikit-atomicx-vue3/room';

export interface RoomInvitationH5Options {
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
  options: RoomInvitationH5Options;
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

<style lang="scss" scoped>
@mixin ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
.invitation-container {
  height: 101%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  color: var(--text-color-button);

  .background-blur {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(5px);
    transform: scale(1.1);
  }

  .background-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-color-mask);
    opacity: 0.8;
    z-index: 1;
  }

  .content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }
}

.room-info-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex: 2;

  .avatar-wrapper {
    margin-bottom: 12px;
    position: relative;
  }

  .invite-text {
    font-size: 14px;
    font-weight: 400;
    text-align: center;
    @include ellipsis;
    max-width: 90%;
  }

  .room-info {
    text-align: center;
    max-width: 100%;
    margin-top: 32px;
    padding: 0 20px;
    box-sizing: border-box;

    .room-title {
      font-size: 24px;
      font-weight: 500;
      @include ellipsis;
    }

    .room-details {
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 400;
      gap: 8px;
      flex-wrap: wrap;

      .detail {
        @include ellipsis;
        max-width: 50%;
      }
    }
  }
}

.actions {
  flex: 1;
  width: 66%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  font-size: 16px;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    justify-content: center;

    .accept-button,
    .reject-button {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .accept-button {
      background-color: var(--text-color-success);
      transform: rotate(90deg);
    }

    .reject-button {
      background-color: var(--text-color-error);
    }
  }
}

// Animation effects
:global(.room-invitation-h5-enter-active),
:global(.room-invitation-h5-leave-active) {
  transition: opacity 0.3s ease;
}

:global(.room-invitation-h5-enter-from),
:global(.room-invitation-h5-leave-to) {
  opacity: 0;
}

:global(.room-invitation-h5-enter-active) {
  .content {
    animation: slideUp 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
