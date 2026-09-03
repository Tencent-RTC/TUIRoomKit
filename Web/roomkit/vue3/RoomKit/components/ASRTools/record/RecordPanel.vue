<template>
  <div
    :class="[
      'rec-panel',
      `rec-panel--${layout}`,
    ]"
  >
    <template v-if="showRecordList">
      <div
        v-click-outside="collapseOverlays"
        class="rec-panel__chrome"
      >
        <div class="rec-panel__bar">
          <RecordSearchBar
            v-if="isSearchOpen"
            ref="searchBarRef"
            v-model="keyword"
            class="rec-panel__search"
            :layout="layout"
            @escape="closeSearch"
          />
          <div v-else class="rec-panel__status">
            <svg
              class="rec-panel__wave"
              :class="{ 'rec-panel__wave--paused': !asrOn }"
              viewBox="0 0 20 12"
              aria-hidden="true"
            >
              <rect
                x="0"
                y="4"
                width="1.6"
                height="4"
                rx="0.8"
              />
              <rect
                x="3.1"
                y="2"
                width="1.6"
                height="8"
                rx="0.8"
              />
              <rect
                x="6.2"
                y="0.5"
                width="1.6"
                height="11"
                rx="0.8"
              />
              <rect
                x="9.3"
                y="3"
                width="1.6"
                height="6"
                rx="0.8"
              />
              <rect
                x="12.4"
                y="1.5"
                width="1.6"
                height="9"
                rx="0.8"
              />
              <rect
                x="15.5"
                y="3.5"
                width="1.6"
                height="5"
                rx="0.8"
              />
              <rect
                x="18.4"
                y="4.5"
                width="1.6"
                height="3"
                rx="0.8"
              />
            </svg>
            <span class="rec-panel__status-text">{{ statusText }}</span>
            <button
              v-if="canManageASR && asrOn"
              class="rec-panel__ctl rec-panel__stop"
              type="button"
              :data-tooltip="t('AITools.TranscriptionStop')"
              :aria-label="t('AITools.TranscriptionStop')"
              @click="confirmStopASR"
            >
              <span class="rec-panel__glyph" aria-hidden="true" />
            </button>
            <button
              v-else-if="canManageASR"
              class="rec-panel__ctl rec-panel__start"
              type="button"
              :data-tooltip="t('AITools.TranscriptionStart')"
              :aria-label="t('AITools.TranscriptionStart')"
              @click="confirmStartASR('record')"
            >
              <span class="rec-panel__glyph" aria-hidden="true">
                <svg viewBox="0 0 8 10">
                  <path d="M1 0.5v9L7.5 5z" />
                </svg>
              </span>
            </button>
          </div>
          <div class="rec-panel__actions">
            <button
              v-show="!isSearchOpen"
              class="rec-panel__action"
              type="button"
              :class="{ 'is-active': Boolean(keyword) }"
              :data-tooltip="t('AITools.Search')"
              :aria-label="t('AITools.Search')"
              @click.stop="openSearch"
            >
              <IconSearch :size="layout === 'h5' ? 18 : 16" />
            </button>
            <!--
              Click-outside must wrap the gear and the popover, not the status
              bar. A chrome-level listener treats a status click as inside and
              leaves settings open.
            -->
            <div
              v-click-outside="closePcSettings"
              class="rec-panel__settings"
            >
              <button
                class="rec-panel__action"
                type="button"
                :class="{ 'is-active': isSettingsOpen }"
                :data-tooltip="t('AITools.Settings')"
                :aria-label="t('AITools.Settings')"
                :aria-pressed="isSettingsOpen"
                @click.stop="toggleSettings"
              >
                <IconSettings :size="layout === 'h5' ? 18 : 16" />
              </button>
              <SubtitleSettingsPopover
                v-if="isPc && isSettingsOpen"
                host="panel"
                :show-caption-group="false"
              />
            </div>
          </div>
        </div>
      </div>
      <RealtimeMessageList
        :target-language="targetLanguage"
        :caption-mode="captionDisplayMode"
        :keyword="keyword"
        :layout="layout"
        @pointerdown="collapseOverlays"
      />
    </template>
    <SubtitleEmptyCard
      v-else
      class="rec-panel__empty"
      :variant="asrEmptyVariant"
      @start="confirmStartASR('record')"
    />
  </div>
  <!-- H5 stacks a second bottom sheet so the transcript stays underneath. -->
  <SubtitleSettingsSheetH5
    v-if="!isPc && isSettingsOpen"
    :show-caption-group="false"
    @close="isSettingsOpen = false"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { IconSearch, IconSettings, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useAITranscriberState } from 'tuikit-atomicx-vue3/room';
import vClickOutside from '../../base/vClickOutside';
import RealtimeMessageList from './RealtimeMessageList.vue';
import RecordSearchBar from './RecordSearchBar.vue';
import SubtitleEmptyCard from '../SubtitleEmptyCard.vue';
import SubtitleSettingsPopover from '../settings/SubtitleSettingsPopover.vue';
import SubtitleSettingsSheetH5 from '../settings/SubtitleSettingsSheetH5.vue';
import { useASRToolsState } from '../useASRToolsState';

const props = withDefaults(defineProps<{
  layout?: 'pc' | 'h5';
}>(), {
  layout: 'pc',
});

const isPc = computed(() => props.layout === 'pc');

const { t } = useUIKit();
const { realtimeMessageList } = useAITranscriberState();
const {
  targetLanguage,
  asrOn,
  canManageASR,
  captionDisplayMode,
  asrEmptyVariant,
  confirmStartASR,
  confirmStopASR,
} = useASRToolsState();

// Keep historical records visible after transcription stops. The empty card
// is only for rooms that have never produced a transcript in this session.
const showRecordList = computed(() => asrOn.value || realtimeMessageList.value.length > 0);

const statusText = computed(() => {
  if (asrOn.value) {
    return t('AITools.RecordStatusOn');
  }
  return t(canManageASR.value ? 'AITools.RecordStatusOff' : 'AITools.RecordStatusOffMember');
});

interface SearchBarHandle {
  focus: () => void;
}

const keyword = ref('');
const isSearchOpen = ref(false);
const isSettingsOpen = ref(false);
const searchBarRef = ref<SearchBarHandle>();

function closePcSettings() {
  // H5 settings are a stacked sheet; dismissing them is the sheet's job.
  if (isPc.value) {
    isSettingsOpen.value = false;
  }
}

function collapseOverlays() {
  isSearchOpen.value = false;
  closePcSettings();
}

function openSearch() {
  isSettingsOpen.value = false;
  isSearchOpen.value = true;
}

function closeSearch() {
  isSearchOpen.value = false;
}

function toggleSettings() {
  isSettingsOpen.value = !isSettingsOpen.value;
}

watch(isSearchOpen, async (open) => {
  if (!open) {
    return;
  }
  await nextTick();
  searchBarRef.value?.focus();
});

// Drop chrome state with the running session so the next start is a clean bar.
watch(asrOn, (on) => {
  if (on) {
    return;
  }
  keyword.value = '';
  isSearchOpen.value = false;
  isSettingsOpen.value = false;
});
</script>

<style lang="scss" scoped>
@import '../styles/asrTooltip';

.rec-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.rec-panel__chrome {
  position: relative;
  // Keep the hanging settings popover above the record list sibling.
  z-index: 2;
  flex: none;
}

.rec-panel__bar {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 6px 12px;

  .rec-panel--h5 & {
    min-height: 48px;
    padding: 8px 16px;
  }
}

.rec-panel__status {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.rec-panel__wave {
  display: block;
  flex: none;
  width: 18px;
  height: 12px;
  color: var(--text-color-secondary);
  fill: currentcolor;
}

.rec-panel__wave rect {
  transform-box: fill-box;
  transform-origin: center;
  animation: rec-wave 1s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(2) {
    animation-delay: 0.12s;
  }

  &:nth-child(3) {
    animation-delay: 0.24s;
  }

  &:nth-child(4) {
    animation-delay: 0.08s;
  }

  &:nth-child(5) {
    animation-delay: 0.2s;
  }

  &:nth-child(6) {
    animation-delay: 0.32s;
  }

  &:nth-child(7) {
    animation-delay: 0.16s;
  }
}

@keyframes rec-wave {
  0%,
  100% {
    transform: scaleY(0.4);
  }

  50% {
    transform: scaleY(1);
  }
}

.rec-panel__wave--paused rect {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .rec-panel__wave rect {
    animation: none;
  }
}

.rec-panel__status-text {
  min-width: 0;
  overflow: hidden;
  color: var(--text-color-primary);
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-panel__ctl {
  position: relative;
  @include asr-tooltip;

  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  appearance: none;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover,
  &:focus-visible {
    background: var(--button-color-secondary-hover);
  }

  .rec-panel--h5 & {
    width: 32px;
    height: 32px;
  }
}

.rec-panel__glyph {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;

  .rec-panel--h5 & {
    width: 24px;
    height: 24px;
  }
}

.rec-panel__stop .rec-panel__glyph {
  border: 2px solid var(--button-color-hangup);

  &::after {
    width: 8px;
    height: 8px;
    content: '';
    background: var(--button-color-hangup);
    border-radius: 1.5px;
  }
}

.rec-panel__start .rec-panel__glyph {
  color: var(--button-color-primary-default);
  border: 2px solid currentcolor;

  svg {
    display: block;
    width: 8px;
    height: 10px;
    margin-left: 1px;
    fill: currentcolor;
  }

  .rec-panel--h5 & svg {
    width: 9px;
    height: 11px;
  }
}

.rec-panel__actions {
  position: relative;
  display: flex;
  flex: none;
  gap: 2px;
  align-items: center;
}

.rec-panel__settings {
  position: relative;
}

.rec-panel__action {
  position: relative;
  @include asr-tooltip;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--text-color-secondary);
  cursor: pointer;
  appearance: none;
  background: transparent;
  border: none;
  border-radius: 6px;

  &:hover,
  &.is-active {
    color: var(--text-color-primary);
    background: var(--button-color-secondary-hover);
  }

  .rec-panel--h5 & {
    width: 32px;
    height: 32px;
  }
}

.rec-panel__search {
  flex: 1;
  min-width: 0;
}

.rec-panel__empty {
  flex: 1;
}
</style>
