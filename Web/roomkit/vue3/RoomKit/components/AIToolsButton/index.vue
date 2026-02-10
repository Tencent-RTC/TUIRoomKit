<template>
  <div>
    <Dropdown
      trigger="click"
      placement="top"
      :teleported="false"
    >
      <IconButton :title="t('AITools.Title')">
        <IconAIIcon :size="24" />
      </IconButton>
      <template #dropdown>
        <div class="operate-list">
          <div class="operate-item" @click="subtitlesVisible = !subtitlesVisible">
            <IconAISubtitles :size="18" />
            <span class="operate-item-text">{{ subtitlesVisible ? t('AITools.SubtitlesClose') : t('AITools.SubtitlesOpen') }}</span>
          </div>
          <div class="operate-item" @click="toggleSidePanel(RoomTabKey.AIToolsRealtimeMessageList)">
            <IconAITranscription :size="18" />
            <span class="operate-item-text">{{ activeTab === RoomTabKey.AIToolsRealtimeMessageList ? t('AITools.RealtimeMessageListClose') : t('AITools.RealtimeMessageListOpen') }}</span>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
  <Teleport to="body">
    <Subtitle v-if="subtitlesVisible" />
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Dropdown, IconAIIcon, IconAISubtitles, IconAITranscription, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Subtitle } from 'tuikit-atomicx-vue3/room';
import { RoomTabKey, useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import IconButton from '../base/IconButton.vue';

const { t } = useUIKit();
const { activeTab, toggleSidePanel } = useRoomSidePanel();

const subtitlesVisible = ref(false);
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
