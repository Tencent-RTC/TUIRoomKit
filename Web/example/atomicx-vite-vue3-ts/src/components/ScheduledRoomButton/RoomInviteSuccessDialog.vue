<template>
  <TUIDialog v-model:visible="visible" :title="t('RoomShare.BookingSuccess')">
    <div class="room-invite-content">
      <div class="invite-item">
        <div class="invite-label">
          {{ t('RoomShare.RoomId') }}
        </div>
        <div class="invite-value">
          {{ roomId }}
          <IconCopy class="copy-icon" @click="() => copy(roomId)" />
        </div>
      </div>

      <div v-if="password" class="invite-item">
        <div class="invite-label">
          {{ t('RoomShare.Password') }}
        </div>
        <div class="invite-value">
          {{ password }}
          <IconCopy class="copy-icon" @click="() => copy(password || '')" />
        </div>
      </div>

      <div class="invite-item">
        <div class="invite-label">
          {{ t('RoomShare.RoomLink') }}
        </div>
        <div class="invite-value room-link">
          <span class="room-link-text">{{ roomLink }}</span>
          <IconCopy class="copy-icon" @click="() => copy(roomLink)" />
        </div>
      </div>

      <div class="invite-actions">
        <TUIButton
          type="primary"
          size="large"
          class="copy-button"
          @click="copyRoomIdAndLink"
        >
          {{ t('RoomShare.CopyMeetingIdAndLink') }}
        </TUIButton>
      </div>
    </div>
    <template #footer>
      <div />
    </template>
  </TUIDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TUIButton, TUIDialog, TUIToast, IconCopy, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useCopy } from '../../hooks/useCopy';
import { generateRoomLink } from '../../utils/utils';

const { t } = useUIKit();
const { copy } = useCopy();

interface Props {
  visible: boolean;
  roomId: string;
  password?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
});

const roomLink = computed(() => {
  if (!props.roomId) {
    return '';
  }
  return generateRoomLink(props.roomId, props.password);
});

const copyRoomIdAndLink = async () => {
  if (!props.roomId) {
    TUIToast.error({ message: t('RoomShare.NoRoomInfo') });
    return;
  }

  const roomInfoLines = [
    `${t('RoomShare.RoomId')}: ${props.roomId}`,
    props.password ? `${t('RoomShare.Password')}: ${props.password}` : null,
    `${t('RoomShare.RoomLink')}: ${roomLink.value}`,
  ].filter(Boolean);

  const roomInfoText = roomInfoLines.join('\n');

  await copy(roomInfoText);
};
</script>

<style lang="scss" scoped>
.room-invite-content {
  min-width: 400px;
  user-select: text;

  .invite-item {
    display: flex;
    margin-bottom: 16px;
    align-items: flex-start;

    .invite-label {
      min-width: 80px;
      color: var(--text-color-secondary);
      font-size: 14px;
      line-height: 22px;
      flex-shrink: 0;
    }

    .invite-value {
      flex: 1;
      color: var(--text-color-primary);
      font-size: 14px;
      line-height: 22px;
      display: flex;
      align-items: center;
      gap: 8px;
      word-break: break-all;

      &.room-link {
        color: var(--text-color-link);
        cursor: pointer;
        overflow: hidden;
        min-width: 0;

        &:hover {
          color: var(--text-color-link-hover);
        }

        .room-link-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
          min-width: 0;
        }
      }

      .copy-icon {
        cursor: pointer;
        color: var(--text-color-link);
        flex-shrink: 0;

        &:hover {
          color: var(--text-color-link-hover);
        }
      }
    }
  }

  .invite-actions {
    margin-top: 32px;
    display: flex;
    justify-content: center;

    .copy-button {
      min-width: 200px;
    }
  }
}
</style>
