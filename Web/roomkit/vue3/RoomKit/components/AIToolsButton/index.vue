<template>
  <div
    v-click-outside="closeMenu"
    class="ai-tools-button-wrapper"
  >
    <IconButton
      :title="t('AITools.Title')"
      :is-active="showMenu"
      @click-icon="toggleMenu"
    >
      <IconAIIcon :size="24" />
    </IconButton>
    <transition name="menu-fade">
      <div
        v-show="showMenu"
        class="dropdown-menu"
        @click.stop
      >
        <div class="dropdown-item" @click="handleToggleSubtitles">
          <IconAISubtitles :size="16" />
          <span class="dropdown-item-text">{{ isSubtitlesVisible ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen') }}</span>
        </div>
        <div class="dropdown-item" @click="handleToggleRealtimeMessageList">
          <IconAITranscription :size="16" />
          <span class="dropdown-item-text">{{ activeWidgetId === BuiltinWidget.AIToolsWidget ? t('AITools.RealtimeMessageListClose') : t('AITools.RealtimeMessageListOpen') }}</span>
        </div>
      </div>
    </transition>
  </div>
  <Teleport to="#roomPage">
    <div v-if="isSubtitlesVisible" class="ai-subtitle-pc">
      <Subtitle
        :target-language="targetLanguage"
        :display-mode="subtitleDisplayMode"
      >
        <template #actions>
          <IconSettings
            class="subtitle-settings-button"
            :size="16"
            @click="isSettingsDialogVisible = true"
          />
        </template>
      </Subtitle>
    </div>
  </Teleport>
  <AISettingsDialog
    v-if="isSettingsDialogVisible"
    :is-owner="isOwner"
    @close="isSettingsDialogVisible = false"
  />
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { IconAIIcon, IconAISubtitles, IconAITranscription, IconSettings, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { BuiltinWidget } from '../../adapter/type';
import { useASRToolsState } from '../../hooks/useASRToolsState';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { useSubtitlesState } from '../../hooks/useSubtitlesState';
import { Subtitle } from '../ASRTools';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';
import AISettingsDialog from './AISettingsDialog.vue';

interface Props {
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  togglePanel: undefined,
});

const { t } = useUIKit();
const { activeWidgetId } = useRoomSidePanel();
const { isSubtitlesVisible } = useSubtitlesState();
const { currentRoom } = useRoomState();
const { localParticipant } = useRoomParticipantState();
const isSettingsDialogVisible = ref(false);
const showMenu = ref(false);
const isOwner = computed(() => currentRoom.value?.roomOwner?.userId === localParticipant.value?.userId);
const {
  targetLanguage,
  subtitleDisplayMode,
  hasStartedASR,
  ensureASRStarted,
} = useASRToolsState();

function toggleMenu() {
  showMenu.value = !showMenu.value;
}

function closeMenu() {
  showMenu.value = false;
}

async function handleToggleSubtitles() {
  closeMenu();
  if (!isSubtitlesVisible.value) {
    await ensureASRStarted();
  }

  isSubtitlesVisible.value = !isSubtitlesVisible.value;
}

async function handleToggleRealtimeMessageList() {
  closeMenu();
  if (activeWidgetId.value !== BuiltinWidget.AIToolsWidget) {
    await ensureASRStarted();
  }

  props.togglePanel?.();
}

function closeASRRelatedUI() {
  isSubtitlesVisible.value = false;

  if (activeWidgetId.value === BuiltinWidget.AIToolsWidget) {
    props.togglePanel?.();
  }
}

watch(
  hasStartedASR,
  (started, previousStarted) => {
    if (previousStarted && !started) {
      closeASRRelatedUI();
    }
  },
);

watch(() => localParticipant.value?.role, (role, previousRole) => {
  if (role === RoomParticipantRole.Owner && previousRole !== role) {
    closeASRRelatedUI();
  }
});

</script>

<style lang="scss" scoped>
.ai-subtitle-pc {
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  width: 50%;
  display: flex;
  justify-content: center;
  pointer-events: none;
  text-align: initial;
}

.subtitle-settings-button {
  color: var(--text-color-button);
  cursor: pointer;
}

.ai-tools-button-wrapper {
  position: relative;
  flex-shrink: 0;
}

.dropdown-menu {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 1000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  white-space: nowrap;
  background: var(--bg-color-operate);
  border: 1px solid var(--stroke-color-primary);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--uikit-color-black-16);
  transform: translateX(-50%);
  text-align: initial;

  .dropdown-item {
    display: flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
    padding: 6px 8px;
    color: var(--text-color-primary);
    cursor: pointer;
    border-radius: 6px;

    &:hover {
      background: var(--button-color-secondary-hover);
    }

    .dropdown-item-text {
      font-size: 13px;
      line-height: 20px;
    }
  }
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.menu-fade-enter-to,
.menu-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

</style>
