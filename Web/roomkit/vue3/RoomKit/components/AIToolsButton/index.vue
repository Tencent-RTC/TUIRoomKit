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
          <div class="operate-item" @click="isSubtitlesVisible = !isSubtitlesVisible">
            <IconAISubtitles :size="18" />
            <span class="operate-item-text">{{ isSubtitlesVisible ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen') }}</span>
          </div>
          <div class="operate-item" @click="props.togglePanel?.()">
            <IconAITranscription :size="18" />
            <span class="operate-item-text">{{ activeWidgetId === BuiltinWidget.AIToolsWidget ? t('AITools.RealtimeMessageListClose') : t('AITools.RealtimeMessageListOpen') }}</span>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
  <Teleport to="body">
    <Subtitle v-if="isSubtitlesVisible" />
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Dropdown, IconAIIcon, IconAISubtitles, IconAITranscription, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Subtitle } from 'tuikit-atomicx-vue3/room';
import { BuiltinWidget } from '../../adapter/type';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import IconButton from '../base/IconButton.vue';

interface Props {
  togglePanel?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  togglePanel: undefined,
});

const { t } = useUIKit();
const { activeWidgetId } = useRoomSidePanel();

const isSubtitlesVisible = ref(false);
</script>

<style lang="scss" scoped>
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
