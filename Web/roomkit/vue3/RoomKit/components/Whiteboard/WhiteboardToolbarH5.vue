<template>
  <div class="whiteboard-toolbar-h5">
    <div class="toolbar-viewport">
      <div class="toolbar-scroll">
        <template
          v-for="item in TOOL_ITEMS"
          :key="item.tool"
        >
          <button
            :class="['tool-button', { active: isToolActive(item.tool) }]"
            :aria-label="t(item.labelKey)"
            :aria-pressed="isToolActive(item.tool)"
            @click="handleToolClick(item)"
          >
            <component :is="activeShapeIcon(item)" :size="20" />
            <span>{{ t(item.labelKey) }}</span>
          </button>
          <span v-if="item.tool === WhiteboardTool.Laser" class="divider" />
        </template>

        <span class="divider" />

        <button
          class="tool-button"
          :disabled="!canUndo"
          :aria-label="t('Whiteboard.Undo')"
          @click="runAction(undo)"
        >
          <component :is="IconUndo" :size="20" />
          <span>{{ t('Whiteboard.Undo') }}</span>
        </button>
        <button
          class="tool-button"
          :disabled="!canRedo"
          :aria-label="t('Whiteboard.Redo')"
          @click="runAction(redo)"
        >
          <component :is="IconRedo" :size="20" />
          <span>{{ t('Whiteboard.Redo') }}</span>
        </button>
        <button
          class="tool-button"
          :aria-label="t('Whiteboard.Clear')"
          @click="handleClear"
        >
          <component :is="IconClear" :size="20" />
          <span>{{ t('Whiteboard.Clear') }}</span>
        </button>

        <span class="divider" />

        <button
          class="tool-button"
          :aria-label="t('Whiteboard.Save')"
          @click="handleSave"
        >
          <component :is="IconSave" :size="20" />
          <span>{{ t('Whiteboard.Save') }}</span>
        </button>
        <button
          class="tool-button"
          :aria-label="t('Whiteboard.Collapse')"
          @click="emit('collapse')"
        >
          <component :is="IconCollapse" :size="20" />
          <span>{{ t('Whiteboard.Collapse') }}</span>
        </button>
      </div>
    </div>

    <div v-if="settingsTool !== null" class="settings-viewport">
      <div class="settings-panel">
        <template v-if="settingsTool === WhiteboardTool.Shape">
          <div class="setting-group">
            <button
              v-for="shape in SHAPE_OPTIONS"
              :key="shape.type"
              :class="['shape-button', { active: selectedShape === shape.type }]"
              :aria-label="t(shape.labelKey)"
              @click="handleSelectShape(shape.type)"
            >
              <component :is="shape.icon" :size="20" />
            </button>
          </div>
          <span class="settings-divider" />
        </template>

        <div class="setting-group">
          <button
            v-for="width in WHITEBOARD_LINE_WIDTHS"
            :key="width"
            :class="['width-button', { active: settingsStyle.lineWidth === width }]"
            :aria-label="`${width}px`"
            @click="handleLineWidthSelect(width)"
          >
            <span :style="{ width: `${width + 3}px`, height: `${width + 3}px` }" />
          </button>
        </div>

        <span class="settings-divider" />

        <div class="color-list">
          <button
            v-for="color in COLOR_OPTIONS"
            :key="color"
            :class="[
              'color-button',
              {
                active: settingsStyle.color === color,
                white: color === '#FFFFFF',
              },
            ]"
            :style="{ backgroundColor: color }"
            :aria-label="color"
            @click="handleColorSelect(color)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  TUIMessageBox,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { useWhiteboardState, WhiteboardTool } from 'tuikit-atomicx-vue3/room';
import {
  IconCollapse,
  IconClear,
  IconEllipse,
  IconRect,
  IconRedo,
  IconSave,
  IconUndo,
  SHAPE_OPTIONS,
  TOOL_ITEMS,
  WHITEBOARD_COLOR_PALETTE,
  WHITEBOARD_LINE_WIDTHS,
} from './constants';
import { useWhiteboardSessionContext } from './useWhiteboardSessionContext';
import { useWhiteboardToolbar } from './useWhiteboardToolbar';
import type { ToolItem, WhiteboardToolStyle } from './constants';

const emit = defineEmits<{
  collapse: [];
}>();

const { t } = useUIKit();
const {
  currentToolConfig,
  canUndo,
  canRedo,
  setToolConfig,
  undo,
  redo,
  clear,
  snapshot,
} = useWhiteboardState();
const { sessionOwnerUserId, isGuestWhiteboard } = useWhiteboardSessionContext();
const { selectedShape, toolStyles, defaultToolStyle } = useWhiteboardToolbar();

const settingsTool = computed<WhiteboardTool | null>(() => (
  supportsSettings(currentToolConfig.value.tool)
    ? currentToolConfig.value.tool
    : null
));
const settingsStyle = computed<WhiteboardToolStyle>(() => (
  settingsTool.value === null
    ? { ...defaultToolStyle.value }
    : getToolStyle(settingsTool.value)
));
const COLOR_OPTIONS = WHITEBOARD_COLOR_PALETTE.filter(color => color !== 'transparent');

function getStoredToolStyle(tool: WhiteboardTool): WhiteboardToolStyle {
  return toolStyles.value[tool] ?? { ...defaultToolStyle.value };
}

function getToolStyle(tool: WhiteboardTool): WhiteboardToolStyle {
  if (currentToolConfig.value.tool === tool) {
    return {
      color: currentToolConfig.value.color,
      lineWidth: currentToolConfig.value.lineWidth,
    };
  }
  return getStoredToolStyle(tool);
}

function supportsSettings(tool: WhiteboardTool): boolean {
  return tool !== WhiteboardTool.None && tool !== WhiteboardTool.EraserObject;
}

function activeShapeIcon(item: ToolItem) {
  if (item.tool === WhiteboardTool.Shape) {
    return selectedShape.value === 'ellipse' ? IconEllipse : IconRect;
  }
  return item.icon;
}

function isToolActive(tool: WhiteboardTool): boolean {
  return currentToolConfig.value.tool === tool;
}

async function applyToolConfig(
  tool: WhiteboardTool,
  style: WhiteboardToolStyle = getStoredToolStyle(tool),
) {
  await setToolConfig({
    tool,
    ...(supportsSettings(tool)
      ? {
        color: style.color,
        lineWidth: style.lineWidth,
        shapeType: tool === WhiteboardTool.Shape ? selectedShape.value : undefined,
      }
      : {}),
  });
}

async function runAction(action: () => Promise<void>) {
  try {
    await action();
  } catch (error) {
    console.error('[WhiteboardToolbarH5] action failed:', error);
    TUIToast.warning({ message: t('Whiteboard.OperationFailed') });
  }
}

async function handleToolClick(item: ToolItem) {
  if (isToolActive(item.tool)) {
    return;
  }

  await runAction(() => applyToolConfig(item.tool));
}

async function handleSelectShape(shape: 'rect' | 'ellipse') {
  selectedShape.value = shape;
  await runAction(() => applyToolConfig(WhiteboardTool.Shape));
}

async function handleColorSelect(color: string) {
  const tool = settingsTool.value;
  if (tool === null) {
    return;
  }
  const style = { ...getStoredToolStyle(tool), color };
  toolStyles.value[tool] = style;
  await runAction(() => applyToolConfig(tool, style));
}

async function handleLineWidthSelect(lineWidth: number) {
  const tool = settingsTool.value;
  if (tool === null) {
    return;
  }
  const style = { ...getStoredToolStyle(tool), lineWidth };
  toolStyles.value[tool] = style;
  await runAction(() => applyToolConfig(tool, style));
}

onMounted(async () => {
  const currentTool = currentToolConfig.value.tool;
  if (!supportsSettings(currentTool)) {
    return;
  }

  await runAction(() => applyToolConfig(currentTool));
});

function handleClear() {
  TUIMessageBox.confirm({
    title: t('Whiteboard.ClearAllConfirmTitle'),
    content: t('Whiteboard.ClearAllConfirmContent'),
    callback: async (action) => {
      if (action === 'confirm') {
        await runAction(() => clear('all'));
      }
    },
  });
}

async function handleSave() {
  try {
    const url = await snapshot(
      isGuestWhiteboard.value ? sessionOwnerUserId.value ?? undefined : undefined,
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('[WhiteboardToolbarH5] save failed:', error);
    TUIToast.warning({ message: t('Whiteboard.SaveFailed') });
  }
}

</script>

<style lang="scss" scoped>
.whiteboard-toolbar-h5 {
  position: absolute;
  right: 0;
  bottom: 0;
  width: min(calc(100vw - 24px), 520px);
  border-radius: 14px;
  background: var(--bg-color-operate, #2a2c33);
  box-shadow: 0 4px 18px rgb(0 0 0 / 28%);
  overflow: hidden;
}

.toolbar-scroll,
.color-list,
.setting-group {
  display: flex;
  align-items: center;
}

.toolbar-viewport {
  padding: 0 8px;
  overflow: hidden;
}

.toolbar-scroll {
  gap: 2px;
  padding: 8px 0;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tool-button {
  display: flex;
  flex: 0 0 48px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  height: 48px;
  padding: 3px;
  border: none;
  border-radius: 9px;
  color: var(--text-color-primary, #fff);
  background: transparent;

  span {
    max-width: 46px;
    overflow: hidden;
    font-size: 9px;
    line-height: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.active {
    color: #fff;
    background: #1c66e5;
  }

  &:disabled {
    opacity: 0.35;
  }
}

.divider {
  flex: 0 0 1px;
  height: 28px;
  margin: 0 4px;
  background: var(--stroke-color-module, rgb(255 255 255 / 16%));
}

.settings-viewport {
  padding: 0 8px;
  border-top: 1px solid var(--stroke-color-module, rgb(255 255 255 / 16%));
  overflow: hidden;
}

.settings-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px calc(10px + env(safe-area-inset-bottom));
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.setting-group {
  flex: none;
  gap: 6px;
}

.settings-divider {
  flex: 0 0 1px;
  width: 1px;
  height: 28px;
  background: var(--stroke-color-module, rgb(255 255 255 / 16%));
}

.shape-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 8px;
  color: var(--text-color-primary, #fff);
  background: transparent;

  &.active {
    color: #fff;
    background-color: #1c66e5;
  }

  &:focus-visible {
    outline: 2px solid #1c66e5;
    outline-offset: 2px;
  }
}

.width-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-color-primary, #fff);
  background: transparent;

  &.active {
    border-color: rgb(28 102 229 / 40%);
    color: #4c8dff;
    background-color: rgb(28 102 229 / 18%);
  }

  &:focus-visible {
    outline: 2px solid #1c66e5;
    outline-offset: 2px;
  }
}

.width-button span {
  display: block;
  border-radius: 50%;
  background: currentColor;
}

.color-list {
  flex: none;
  gap: 8px;
  padding: 3px 5px 3px 1px;
}

.color-button {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 32%);

  &.active {
    border-color: var(--bg-color-operate, #2a2c33);
    outline: 2px solid #1c66e5;
    outline-offset: 1px;
  }

  &:focus-visible {
    outline: 2px solid #1c66e5;
    outline-offset: 2px;
  }

  &.white {
    background-color: #fff;
    box-shadow: 0 0 0 1px rgb(148 155 168 / 80%);
  }
}
</style>
