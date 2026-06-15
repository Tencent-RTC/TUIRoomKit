<template>
  <div>
    <Dropdown
      trigger="click"
      placement="top"
      :teleported="true"
    >
      <IconButton :title="t('AITools.Title')">
        <IconAIIcon :size="24" />
      </IconButton>
      <template #dropdown>
        <div class="operate-list">
          <div class="operate-item" @click="toggleSubtitles">
            <IconAISubtitles :size="18" />
            <span class="operate-item-text">{{ isSubtitlesVisible ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen') }}</span>
          </div>
          <div class="operate-item" @click="toggleRealtimeMessageList">
            <IconAITranscription :size="18" />
            <span class="operate-item-text">{{ activeWidgetId === BuiltinWidget.AIToolsWidget ? t('AITools.RealtimeMessageListClose') : t('AITools.RealtimeMessageListOpen') }}</span>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
  <Teleport to="body">
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
import { Dropdown, IconAIIcon, IconAISubtitles, IconAITranscription, IconSettings, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import {
  RoomParticipantRole,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-vue3/room';
import { Subtitle } from '../ASRTools';
import { BuiltinWidget } from '../../adapter/type';
import { useASRToolsState } from '../../hooks/useASRToolsState';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import { useSubtitlesState } from '../../hooks/useSubtitlesState';
import IconButton from '../base/IconButton.vue';
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
const isOwner = computed(() => currentRoom.value?.roomOwner?.userId === localParticipant.value?.userId);
const {
  targetLanguage,
  subtitleDisplayMode,
  hasStartedASR,
  ensureASRStarted,
} = useASRToolsState();

async function toggleSubtitles() {
  if (!isSubtitlesVisible.value) {
    await ensureASRStarted();
  }

  isSubtitlesVisible.value = !isSubtitlesVisible.value;
}

async function toggleRealtimeMessageList() {
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

.operate-list {
  display: flex;
  align-items: center;
  flex-direction: column;
  font-size: 12px;
  font-weight: 400;
  color: var(--text-color-primary);
  text-align: initial;

  .operate-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 6px;
    gap: 6px;
    width: 100%;
    box-sizing: border-box;

    .operate-item-text {
      flex: 1;
      min-width: 0;
    }
  }
}

</style>
