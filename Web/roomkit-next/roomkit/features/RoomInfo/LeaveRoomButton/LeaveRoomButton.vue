<template>
  <div
    class="leave-room-button"
    :class="{ 'is-open': isMenuOpen }"
  >
    <TUIDropdown
      trigger="click"
      placement="top-end"
      :offset="14"
      :disabled="!canEndRoom"
      show-arrow
      @update:open="isMenuOpen = $event"
      @command="handleCommand"
    >
      <div
        class="leave-room-trigger"
        :aria-label="isMenuOpen ? t('Room.Cancel') : t('Room.Leave')"
        :aria-haspopup="canEndRoom ? 'menu' : undefined"
        :aria-expanded="canEndRoom ? isMenuOpen : undefined"
        @click="handleTriggerClick"
      >
        <IconPhone
          v-if="!isMenuOpen"
          :size="22"
          class="leave-room-hangup"
        />
        <span v-else class="leave-room-cancel">{{ t('Room.Cancel') }}</span>
      </div>

      <template #menu>
        <div class="leave-room-menu">
          <TUIDropdownItem command="end" danger>
            {{ t('Room.End') }}
          </TUIDropdownItem>
          <TUIDropdownItem command="leave">
            {{ t('Room.Leave') }}
          </TUIDropdownItem>
        </div>
      </template>
    </TUIDropdown>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IconPhone, TUIDropdown, TUIDropdownItem } from '../../../base';
import { t } from '../../../i18n';
import { useRoomExit } from './useRoomExit';

const { canEndRoom, leaveRoom, endRoom } = useRoomExit();

const isMenuOpen = ref(false);

/** Owners get the menu, so the dropdown anchor owns the click; everyone else leaves right away. */
function handleTriggerClick() {
  if (canEndRoom.value) return;
  void leaveRoom();
}

function handleCommand(command: string | number) {
  void (command === 'end' ? endRoom() : leaveRoom());
}
</script>

<style scoped lang="scss">
.leave-room-button {
  /* Locked so the toolbar never shifts between the hangup icon and the cancel
     label. 70px matches the icon-only box (22px padding + 26px icon + 22px)
     and still fits the widest label, en-US "Cancel" at 47px. */
  --leave-room-width: 70px;

  position: relative;
  display: inline-flex;
  align-items: center;
  align-self: center;
}

.leave-room-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--leave-room-width);
  height: 44px;
  padding: 0;
  color: var(--rk-on-accent);
  cursor: pointer;
  user-select: none;
  background: var(--rk-danger);
  border-radius: var(--rk-radius-pill);
  transition: background 0.15s;
}

.leave-room-trigger:hover {
  background: var(--rk-danger);
  filter: brightness(0.94);
}

.leave-room-hangup {
  flex: none;
  transform: rotate(135deg) scale(0.78);
}

.leave-room-cancel {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Open state: drop the red fill and swap the icon for a cancel label. */
.leave-room-button.is-open .leave-room-trigger {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
  filter: none;
}

.leave-room-button.is-open .leave-room-trigger:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 20%, transparent);
}
</style>

<style lang="scss">
/* Teleported into the overlay host, so these rules cannot be scoped. */
.rk-float.rk-dropdown:has(.leave-room-menu) {
  min-width: 200px;
  padding: 8px;
  border-radius: 14px;
}

.leave-room-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leave-room-menu .rk-dropdown-item {
  justify-content: center;
  height: 40px;
  min-height: 40px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--rk-text-primary);
  letter-spacing: -0.005em;
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
  border-radius: 10px;
}

.leave-room-menu .rk-dropdown-item:hover,
.leave-room-menu .rk-dropdown-item[data-highlighted='true'] {
  background: var(--rk-bg-hover);
}

.leave-room-menu .rk-dropdown-item[data-danger='true'] {
  color: var(--rk-on-accent);
  background: var(--rk-danger);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--rk-danger) 28%, transparent);
}

.leave-room-menu .rk-dropdown-item[data-danger='true']:hover,
.leave-room-menu .rk-dropdown-item[data-danger='true'][data-highlighted='true'] {
  background: var(--rk-danger);
}
</style>
