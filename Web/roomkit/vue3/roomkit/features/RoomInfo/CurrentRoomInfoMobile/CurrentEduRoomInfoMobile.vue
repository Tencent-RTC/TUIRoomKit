<template>
  <!-- Landscape drops the classroom card under the name. Portrait uses the sheet. -->
  <TUIPopover
    v-if="orientation === Orientation.Landscape"
    v-model:open="isOpen"
    placement="bottom-start"
    :offset="5"
    :padded="false"
  >
    <div
      class="current-room-info-mobile is-landscape"
      :class="{ 'is-open': isOpen }"
      role="button"
      tabindex="0"
      :aria-label="t('Education.Info.Sheet')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @keydown.enter.prevent="pressChip"
      @keydown.space.prevent="pressChip"
    >
      <span class="current-room-info-mobile-title">{{ displayRoomName }}</span>
      <span v-if="duration" class="current-room-info-mobile-time">{{ duration }}</span>
      <IconChevron class="current-room-info-mobile-caret" :size="12" />
    </div>
    <template #content>
      <EduRoomInfoCard :room-name="roomName" :invite-url="inviteUrl" />
    </template>
  </TUIPopover>

  <template v-else>
    <div
      class="current-room-info-mobile"
      :class="{ 'is-open': isOpen }"
      role="button"
      tabindex="0"
      :aria-label="t('Education.Info.Sheet')"
      aria-haspopup="dialog"
      :aria-expanded="isOpen"
      @click="toggleOpen"
      @keydown.enter.prevent="toggleOpen"
      @keydown.space.prevent="toggleOpen"
    >
      <span class="current-room-info-mobile-title">{{ displayRoomName }}</span>
      <span v-if="duration" class="current-room-info-mobile-time">{{ duration }}</span>
      <IconChevron class="current-room-info-mobile-caret" :size="12" />
    </div>

    <TUIPopup v-model:open="isOpen" height="auto">
      <template #header>
        <div class="edu-room-info-sheet-title">
          {{ t('Education.Info.Sheet') }}
        </div>
      </template>
      <EduRoomInfoCard plain :room-name="roomName" :invite-url="inviteUrl" />
    </TUIPopup>
  </template>
</template>

<script setup lang="ts">
import { ref, toRef, watch } from 'vue';
import { IconChevron, Orientation, TUIPopover, TUIPopup, t } from '../../../base';
import { useRoomIdentity } from '../CurrentRoomInfoPC/useRoomInfo';
import { useEduClassTimer } from '../CurrentRoomInfoPC/useEduClassTimer';
import EduRoomInfoCard from '../CurrentRoomInfoPC/EduRoomInfoCard.vue';

/**
 * Education H5 classroom chip. Landscape opens the classroom card under the name.
 * Portrait opens the classroom sheet. The meeting chip stays `CurrentRoomInfoMobile`.
 */
const props = defineProps<{
  roomName?: string;
  inviteUrl?: string;
  orientation?: Orientation;
}>();

const isOpen = ref(false);
const { roomId, displayRoomName } = useRoomIdentity(
  toRef(props, 'roomName'),
  toRef(props, 'inviteUrl'),
);

/* Class timer shared with the PC chip: a booked class counts from the booked
   start, so an early entry shows no timer until the booked time arrives. */
const duration = useEduClassTimer();

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function pressChip(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement).click();
}

watch(() => props.orientation, () => {
  isOpen.value = false;
});

watch(roomId, () => {
  isOpen.value = false;
});
</script>

<style scoped lang="scss">
/* H5 classroom chip: 36px, 11px type, no plate. Both orientations keep the divider and caret. */
.current-room-info-mobile {
  display: inline-flex;
  flex: 0 1 auto;
  gap: 6px;
  align-items: center;
  min-width: 0;
  height: 36px;
  padding: 0 2px;
  color: var(--rk-text-primary);
  cursor: pointer;
  user-select: none;
  background: transparent;
  outline: none;
}

.current-room-info-mobile:active {
  opacity: 0.88;
}

.current-room-info-mobile.is-open {
  opacity: 1;
}

.current-room-info-mobile-title {
  min-width: 0;
  max-width: 200px;
  overflow: hidden;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  text-overflow: ellipsis;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.current-room-info-mobile.is-landscape .current-room-info-mobile-title {
  max-width: min(42vw, 280px);
}

.current-room-info-mobile-time {
  flex-shrink: 0;
  padding-left: 10px;
  margin-left: 2px;
  font-size: var(--rk-fs-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rk-text-primary);
  letter-spacing: 0.02em;
  border-left: 1px solid var(--rk-border-strong);
}

.current-room-info-mobile-caret {
  flex-shrink: 0;
  margin-left: 2px;
  color: var(--rk-text-tertiary);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.current-room-info-mobile.is-open .current-room-info-mobile-caret {
  color: var(--rk-brand-hover);
  transform: rotate(180deg);
}

.rk-root[data-rk-theme='light'] .current-room-info-mobile.is-open .current-room-info-mobile-caret {
  color: var(--rk-brand);
}

/* Popup head is 4px + 30px + 10px, the design's 44px centered title. */
.edu-room-info-sheet-title {
  width: 100%;
  height: 30px;
  font-size: var(--rk-fs-lg);
  font-weight: 600;
  line-height: 30px;
  color: var(--rk-text-primary);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .current-room-info-mobile-caret {
    transition: none;
  }
}
</style>
