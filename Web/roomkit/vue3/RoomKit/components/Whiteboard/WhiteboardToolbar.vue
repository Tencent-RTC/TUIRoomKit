<template>
  <div
    ref="toolbarRef"
    class="whiteboard-toolbar"
    @mousedown.stop
    @click.stop
  >
    <button
      class="drag-handle"
      :title="t('Whiteboard.Drag')"
      @pointerdown.prevent.stop="emit('drag-start', $event)"
      @click.stop
    >
      <span
        v-for="index in 3"
        :key="index"
        class="drag-line"
      />
    </button>

    <div class="tool-group">
      <div
        v-for="item in TOOL_ITEMS"
        :key="item.tool"
        class="tool-item"
      >
        <button
          :class="['tool-btn', { active: isToolActive(item.tool) }]"
          :aria-label="t(item.labelKey)"
          :aria-pressed="isToolActive(item.tool)"
          @click="handleToolClick(item)"
        >
          <component :is="activeShapeIcon(item)" :size="18" />
          <span class="tool-label">{{ t(item.labelKey) }}</span>
        </button>
        <span v-if="item.tool === WhiteboardTool.Laser" class="divider tool-divider" />

        <div
          v-if="supportsSettings(item.tool) && settingsTool === item.tool"
          :class="[
            'popover',
            'tool-settings-popover',
            `popover-${props.settingsPlacement}`,
          ]"
        >
          <div v-if="item.hasShapeOptions" class="shape-options">
            <button
              v-for="shape in SHAPE_OPTIONS"
              :key="shape.type"
              :class="['shape-option', { active: selectedShape === shape.type }]"
              :aria-label="t(shape.labelKey)"
              @click="handleSelectShape(shape.type)"
            >
              <component :is="shape.icon" :size="18" />
            </button>
          </div>
          <div class="settings-section">
            <div class="line-widths">
              <button
                v-for="width in WHITEBOARD_LINE_WIDTHS"
                :key="width"
                :class="['line-width', { active: getToolStyle(item.tool).lineWidth === width }]"
                :aria-label="`${width}px`"
                @click="handleLineWidthSelect(item.tool, width)"
              >
                <span class="line-dot" :style="{ width: `${width + 2}px`, height: `${width + 2}px` }" />
              </button>
            </div>
          </div>
          <span class="settings-divider" />
          <div class="settings-section">
            <div class="palette">
              <button
                v-for="color in COLOR_OPTIONS"
                :key="color"
                :class="[
                  'color-dot',
                  {
                    active: getToolStyle(item.tool).color === color,
                    white: color === '#FFFFFF',
                  },
                ]"
                :style="{ backgroundColor: color }"
                :aria-label="color"
                @click="handleColorSelect(item.tool, color)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <span class="divider" />

    <button
      class="tool-btn"
      :disabled="!canUndo"
      :aria-label="t('Whiteboard.Undo')"
      @click="undo"
    >
      <component :is="IconUndo" :size="18" />
      <span class="tool-label">{{ t('Whiteboard.Undo') }}</span>
    </button>
    <button
      class="tool-btn"
      :disabled="!canRedo"
      :aria-label="t('Whiteboard.Redo')"
      @click="redo"
    >
      <component :is="IconRedo" :size="18" />
      <span class="tool-label">{{ t('Whiteboard.Redo') }}</span>
    </button>
    <button
      class="tool-btn"
      :disabled="!canUndo"
      :aria-label="t('Whiteboard.Clear')"
      @click="handleClear"
    >
      <component :is="IconClear" :size="18" />
      <span class="tool-label">{{ t('Whiteboard.Clear') }}</span>
    </button>

    <span class="divider" />

    <button
      class="tool-btn"
      :aria-label="t('Whiteboard.Save')"
      @click="handleSave"
    >
      <component :is="IconSave" :size="18" />
      <span class="tool-label">{{ t('Whiteboard.Save') }}</span>
    </button>

    <button
      class="tool-btn collapse"
      :aria-label="t('Whiteboard.Collapse')"
      @click="emit('collapse')"
    >
      <component :is="IconCollapse" :size="18" />
      <span class="tool-label">{{ t('Whiteboard.Collapse') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { WhiteboardTool, useWhiteboardState } from 'tuikit-atomicx-vue3/room';
import { useWhiteboardToolbar } from './useWhiteboardToolbar';
import {
  TOOL_ITEMS,
  SHAPE_OPTIONS,
  IconCollapse,
  IconUndo,
  IconRedo,
  IconClear,
  IconSave,
  IconRect,
  IconEllipse,
  WHITEBOARD_COLOR_PALETTE,
  WHITEBOARD_LINE_WIDTHS,
  DEFAULT_TOOL_STYLE,
} from './constants';
import type { ToolItem, WhiteboardToolStyle } from './constants';

const props = withDefaults(defineProps<{
  settingsPlacement?: 'top' | 'bottom';
}>(), {
  settingsPlacement: 'top',
});

const emit = defineEmits<{
  'collapse': [];
  'drag-start': [event: PointerEvent];
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
// Toolbar session state lives at module level (see useWhiteboardToolbar) so it
// survives the component remount that a layout/mini-region change triggers.
const { selectedShape, toolStyles } = useWhiteboardToolbar();
const toolbarRef = ref<HTMLElement>();
const settingsTool = ref<WhiteboardTool | null>(null);
const COLOR_OPTIONS = WHITEBOARD_COLOR_PALETTE.filter(color => color !== 'transparent');

function getStoredToolStyle(tool: WhiteboardTool): WhiteboardToolStyle {
  return toolStyles.value[tool] ?? { ...DEFAULT_TOOL_STYLE };
}

function saveToolStyle(tool: WhiteboardTool, style: WhiteboardToolStyle): void {
  toolStyles.value[tool] = style;
}

function getToolShape(tool: WhiteboardTool): 'rect' | 'ellipse' | undefined {
  if (tool !== WhiteboardTool.Shape) {
    return undefined;
  }
  return selectedShape.value;
}

async function applyToolConfig(
  tool: WhiteboardTool,
  style: WhiteboardToolStyle = getStoredToolStyle(tool),
): Promise<void> {
  if (!supportsSettings(tool)) {
    await setToolConfig({ tool });
    return;
  }

  await setToolConfig({
    tool,
    color: style.color,
    lineWidth: style.lineWidth,
    shapeType: getToolShape(tool),
  });
}

function getToolStyle(tool: WhiteboardTool): WhiteboardToolStyle {
  if (isToolActive(tool)) {
    return {
      color: currentToolConfig.value.color,
      lineWidth: currentToolConfig.value.lineWidth,
    };
  }
  return getStoredToolStyle(tool);
}

function isToolActive(tool: WhiteboardTool): boolean {
  return currentToolConfig.value.tool === tool;
}

function supportsSettings(tool: WhiteboardTool): boolean {
  return tool !== WhiteboardTool.None && tool !== WhiteboardTool.EraserObject;
}

function activeShapeIcon(item: ToolItem) {
  if (item.hasShapeOptions) {
    return selectedShape.value === 'ellipse' ? IconEllipse : IconRect;
  }
  return item.icon;
}

async function handleToolClick(item: ToolItem) {
  if (isToolActive(item.tool)) {
    if (supportsSettings(item.tool)) {
      settingsTool.value = settingsTool.value === item.tool ? null : item.tool;
    } else {
      settingsTool.value = null;
    }
    return;
  }

  settingsTool.value = null;
  await applyToolConfig(item.tool);
}

async function handleSelectShape(shape: 'rect' | 'ellipse') {
  selectedShape.value = shape;
  await applyToolConfig(WhiteboardTool.Shape);
}

async function handleColorSelect(tool: WhiteboardTool, color: string) {
  const nextStyle = { ...getStoredToolStyle(tool), color };
  saveToolStyle(tool, nextStyle);
  await applyToolConfig(tool, nextStyle);
}

async function handleLineWidthSelect(tool: WhiteboardTool, lineWidth: number) {
  const nextStyle = { ...getStoredToolStyle(tool), lineWidth };
  saveToolStyle(tool, nextStyle);
  await applyToolConfig(tool, nextStyle);
}

function handleOutsidePointerDown(event: MouseEvent) {
  if (settingsTool.value === null) {
    return;
  }
  if (toolbarRef.value && toolbarRef.value.contains(event.target as Node)) {
    return;
  }
  settingsTool.value = null;
}

onMounted(async () => {
  document.addEventListener('mousedown', handleOutsidePointerDown, true);

  const currentTool = currentToolConfig.value.tool;
  if (!supportsSettings(currentTool)) {
    return;
  }

  await applyToolConfig(currentTool);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsidePointerDown, true);
});

function handleClear() {
  TUIMessageBox.confirm({
    title: t('Whiteboard.ClearConfirmTitle'),
    content: t('Whiteboard.ClearConfirmContent'),
    callback: async (action) => {
      if (action === 'confirm') {
        await clear();
      }
    },
  });
}

async function handleSave() {
  try {
    const url = await snapshot();
    const link = document.createElement('a');
    link.href = url;
    link.download = `whiteboard-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    TUIToast.warning({ message: t('Whiteboard.SaveFailed') });
  }
}

</script>

<style lang="scss" scoped>
.whiteboard-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  box-sizing: border-box;
  min-height: 60px;
  padding: 10px 14px 10px 10px;
  border-radius: 18px;
  background-color: var(--bg-color-operate, #2a2c33);
  box-shadow: 0 4px 16px rgb(0 0 0 / 24%);
  color: var(--text-color-primary, #fff);
  user-select: none;

  .drag-handle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    justify-content: center;
    width: 20px;
    height: 40px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: grab;
    opacity: 0.55;
    touch-action: none;

    &:hover {
      background: var(--button-color-secondary-hover, rgb(255 255 255 / 12%));
      opacity: 1;
    }

    &:active {
      cursor: grabbing;
    }
  }

  .drag-line {
    width: 12px;
    height: 1.5px;
    border-radius: 1px;
    background: currentColor;
  }

  .tool-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .tool-item {
    position: relative;
    display: flex;
    align-items: center;
  }

  .tool-divider {
    margin-left: 4px;
  }

  .tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    box-sizing: border-box;
    min-width: 40px;
    height: 40px;
    padding: 3px 5px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-color-primary, #1d2029);
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;

    &:hover:not(:disabled):not(.active) {
      background-color: var(--button-color-secondary-hover, #f2f3f5);
    }

    &.active {
      background-color: #1c66e5;
      color: #fff;

      &:hover {
        background-color: #1a5cd0;
      }

      &:active {
        background-color: #174fb8;
      }
    }

    &:active:not(:disabled):not(.active) {
      background-color: var(--button-color-secondary-active, #e7e9ed);
    }

    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }
  }

  .tool-label {
    max-width: 48px;
    overflow: hidden;
    font-size: 10px;
    font-weight: 400;
    line-height: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .divider {
    width: 1px;
    height: 24px;
    margin: 0 4px;
    background: var(--stroke-color-module, rgb(255 255 255 / 16%));
  }

  .popover {
    position: absolute;
    left: 50%;
    z-index: 10;
    padding: 8px;
    border-radius: 10px;
    color: var(--text-color-primary, #1d2029);
    background-color: var(--bg-color-dialog, #fff);
    border: 1px solid var(--stroke-color-primary, #d5d8de);
    box-shadow: 0 4px 16px rgb(0 0 0 / 24%);
  }

  .popover-top {
    bottom: calc(100% + 8px);
    transform: translateX(-50%);
  }

  .popover-bottom {
    top: calc(100% + 8px);
    transform: translateX(-50%);
  }

  .tool-settings-popover {
    box-sizing: border-box;
    width: 188px;
    padding: 16px;
  }

  .shape-options {
    display: flex;
    gap: 6px;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--stroke-color-module, #e7e9ed);
  }

  .settings-divider {
    display: block;
    height: 1px;
    margin: 12px 0;
    background: var(--stroke-color-module, #e7e9ed);
  }

  .shape-option {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--text-color-primary, #1d2029);
    cursor: pointer;

    &:hover:not(.active) {
      background-color: var(--button-color-secondary-hover, #f2f3f5);
    }

    &.active {
      background-color: #1c66e5;
      color: #fff;

      &:hover {
        background-color: #1a5cd0;
      }
    }

    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }
  }

  .palette {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px 14px;
    justify-items: center;
  }

  .color-dot {
    position: relative;
    width: 18px;
    height: 18px;
    padding: 0;
    border: 1px solid var(--stroke-color-primary, #b8bec9);
    border-radius: 50%;
    cursor: pointer;

    &.active {
      outline: 2px solid #1c66e5;
      outline-offset: 1px;
    }

    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }

    &.white {
      background-color: #fff;
      border-color: #949ba8;
      box-shadow: inset 0 0 0 1px #d5d8de;
    }

  }

  .line-widths {
    display: flex;
    gap: 8px;
    justify-content: flex-start;
    margin-top: 0;
  }

  .line-width {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: var(--text-color-primary, #1d2029);
    cursor: pointer;

    &:hover:not(.active) {
      background-color: var(--button-color-secondary-hover, #f2f3f5);
    }

    &.active {
      border-color: #1c66e5;
      background-color: #1c66e5;
      color: #fff;
      box-shadow: 0 0 0 1px #1c66e5;

      &:hover {
        background-color: #1a5cd0;
      }
    }

    &:focus-visible {
      outline: 2px solid #1c66e5;
      outline-offset: 2px;
    }

    .line-dot {
      background: currentColor;
      border-radius: 50%;
    }
  }
}
</style>
