<template>
  <!-- Offset 5 drops the card onto the topbar's bottom edge (34px chip in a 44px bar). -->
  <TUIPopover v-model:open="isOpen" placement="bottom-start" :offset="5" :padded="false">
    <div
      class="edu-room-info"
      :class="{ 'is-open': isOpen }"
      role="button"
      tabindex="0"
      :aria-label="t('Education.Info.Sheet')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
    >
      <IconInfo class="edu-room-info-mark" :size="14" />
      <span class="edu-room-info-title" :title="displayRoomName">{{
        displayRoomName
      }}</span>
      <span v-if="elapsed" class="edu-room-info-time" :title="t('RoomInfo.Duration')">{{
        elapsed
      }}</span>
      <IconChevron class="edu-room-info-caret" :size="12" />
    </div>

    <template #content>
      <EduRoomInfoCard :room-name="roomName" :invite-url="inviteUrl" />
    </template>
  </TUIPopover>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import {
  IconChevron,
  IconInfo,
  TUIPopover,
  t,
} from '../../../base';
import { useRoomIdentity } from './useRoomInfo';
import { useEduClassTimer } from './useEduClassTimer';
import EduRoomInfoCard from './EduRoomInfoCard.vue';

/**
 * Education classroom info chip and card: the chip carries an info mark and a
 * class timer, and the card shows the five class rows (title / time / length /
 * room id / room link) with hover copy buttons, per the design. The meeting
 * variant stays `CurrentRoomInfoPC`.
 */

const props = defineProps<{
  roomName?: string;
  inviteUrl?: string;
}>();

const isOpen = ref(false);
const { roomId, displayRoomName } = useRoomIdentity(
  toRef(props, 'roomName'),
  toRef(props, 'inviteUrl'),
);

/* Class timer shared with the Mobile chip: a booked class counts from the
   booked start, so an early entry shows no timer until the booked time
   arrives. */
const elapsed = useEduClassTimer();

watch(roomId, () => {
  isOpen.value = false;
});
</script>

<style scoped lang="scss">
/* Classroom chip: no hover plate, only a slight fade, per the design. */
.edu-room-info {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  max-width: min(460px, 42vw);
  height: 34px;
  padding: 0 4px;
  color: var(--rk-text-primary);
  cursor: pointer;
  user-select: none;
  background: transparent;
  outline: none;
  transition: opacity 0.15s;
}

.edu-room-info:hover {
  opacity: 0.88;
}

.edu-room-info.is-open {
  opacity: 1;
}

.edu-room-info-mark {
  flex-shrink: 0;
  color: var(--rk-brand);
}

.edu-room-info-title {
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.edu-room-info-time {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding-left: 10px;
  margin-left: 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-primary);
  letter-spacing: 0.02em;
  border-left: 1px solid var(--rk-border-strong);
}

.edu-room-info-caret {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--rk-text-tertiary);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.edu-room-info.is-open .edu-room-info-caret {
  color: var(--rk-brand-hover);
  transform: rotate(180deg);
}

.rk-root[data-rk-theme='light'] .edu-room-info.is-open .edu-room-info-caret {
  color: var(--rk-brand);
}

@media (prefers-reduced-motion: reduce) {
  .edu-room-info,
  .edu-room-info-caret {
    transition: none;
  }
}
</style>
