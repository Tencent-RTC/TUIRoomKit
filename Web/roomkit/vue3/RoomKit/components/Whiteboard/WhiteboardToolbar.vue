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
        :data-whiteboard-tool="item.tool"
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

    <div
      v-if="settingsTool !== null"
      ref="settingsBarRef"
      :class="[
        'tool-settings-bar',
        `settings-bar-${props.settingsPlacement}`,
      ]"
      :style="{
        '--settings-arrow-left': settingsArrowLeft,
        '--settings-offset-x': settingsOffsetX,
      }"
    >
      <div class="settings-content">
        <div v-if="settingsTool === WhiteboardTool.Shape" class="shape-options">
          <button
            v-for="shape in SHAPE_OPTIONS"
            :key="shape.type"
            :class="['shape-option', { active: selectedShape === shape.type }]"
            :aria-label="t(shape.labelKey)"
            @click="handleSelectShape(shape.type)"
          >
            <component :is="shape.icon" :size="18" />
          </button>
          <span class="settings-divider" />
        </div>

        <div class="line-widths">
          <button
            v-for="width in WHITEBOARD_LINE_WIDTHS"
            :key="width"
            :class="['line-width', { active: settingsStyle.lineWidth === width }]"
            :aria-label="`${width}px`"
            @click="handleLineWidthSelect(width)"
          >
            <span class="line-dot" :style="{ width: `${width + 2}px`, height: `${width + 2}px` }" />
          </button>
        </div>

        <span class="settings-divider" />

        <div class="palette">
          <button
            v-for="color in COLOR_OPTIONS"
            :key="color"
            :class="[
              'color-dot',
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { TUIMessageBox, TUIToast, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { WhiteboardTool, useWhiteboardState } from 'tuikit-atomicx-vue3/room';
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
} from './constants';
import { useWhiteboardSessionContext } from './useWhiteboardSessionContext';
import { useWhiteboardToolbar } from './useWhiteboardToolbar';
import type { ToolItem, WhiteboardToolStyle } from './constants';

const props = withDefaults(defineProps<{
  settingsPlacement?: 'top' | 'bottom';
  // Bounds the settings bar horizontally; it is wider than the toolbar itself.
  containerEl?: HTMLElement;
  // Only read to recompute the settings bar position while the dock is dragged.
  dockPosition?: { x: number; y: number } | null;
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
const { sessionOwnerUserId, isGuestWhiteboard } = useWhiteboardSessionContext();
// Toolbar session state lives at module level (see useWhiteboardToolbar) so it
// survives the component remount that a layout/mini-region change triggers.
const {
  selectedShape,
  toolStyles,
  defaultToolStyle,
  hasOpenedToolbar,
} = useWhiteboardToolbar();
const SETTINGS_EDGE_GAP = 12;
const toolbarRef = ref<HTMLElement>();
const settingsBarRef = ref<HTMLElement>();
const settingsArrowLeft = ref('50%');
const settingsOffsetX = ref('0px');
let settingsResizeObserver: ResizeObserver | null = null;

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

function updateSettingsPosition() {
  const toolbar = toolbarRef.value;
  const settingsBar = settingsBarRef.value;
  const tool = settingsTool.value;
  if (!toolbar || !settingsBar || tool === null) {
    return;
  }

  const toolItem = toolbar.querySelector<HTMLElement>(`[data-whiteboard-tool="${tool}"]`);
  if (!toolItem) {
    return;
  }

  const toolbarRect = toolbar.getBoundingClientRect();
  const settingsRect = settingsBar.getBoundingClientRect();
  // The settings bar is wider than the toolbar it is centered on, so a dock near
  // an edge would push it outside the view and get it clipped.
  const centeredLeft = toolbarRect.left + toolbarRect.width / 2 - settingsRect.width / 2;
  let settingsLeft = centeredLeft;
  if (props.containerEl) {
    const containerRect = props.containerEl.getBoundingClientRect();
    const minLeft = containerRect.left + SETTINGS_EDGE_GAP;
    const maxLeft = containerRect.right - SETTINGS_EDGE_GAP - settingsRect.width;
    // A bar too wide for the container sticks to its left edge and scrolls.
    settingsLeft = Math.min(Math.max(centeredLeft, minLeft), Math.max(minLeft, maxLeft));
  }
  settingsOffsetX.value = `${settingsLeft - centeredLeft}px`;

  const toolRect = toolItem.getBoundingClientRect();
  const toolCenter = toolRect.left + toolRect.width / 2;
  const minArrowLeft = 12;
  const maxArrowLeft = settingsRect.width - minArrowLeft;
  const arrowLeft = Math.min(
    Math.max(toolCenter - settingsLeft, minArrowLeft),
    maxArrowLeft,
  );
  settingsArrowLeft.value = `${arrowLeft}px`;
}

watch(
  [
    settingsTool,
    () => props.settingsPlacement,
    () => props.containerEl,
    () => props.dockPosition,
  ],
  async () => {
    await nextTick();
    updateSettingsPosition();
  },
  { flush: 'post' },
);

watch(
  [settingsBarRef, () => props.containerEl],
  async ([settingsBar]) => {
    settingsResizeObserver?.disconnect();
    settingsResizeObserver = null;
    if (!settingsBar) {
      return;
    }

    settingsResizeObserver = new ResizeObserver(updateSettingsPosition);
    settingsResizeObserver.observe(settingsBar);
    if (toolbarRef.value) {
      settingsResizeObserver.observe(toolbarRef.value);
    }
    if (props.containerEl) {
      settingsResizeObserver.observe(props.containerEl);
    }
    await nextTick();
    updateSettingsPosition();
  },
  { flush: 'post' },
);

function getStoredToolStyle(tool: WhiteboardTool): WhiteboardToolStyle {
  return toolStyles.value[tool] ?? { ...defaultToolStyle.value };
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
    return;
  }

  await applyToolConfig(item.tool);
}

async function handleSelectShape(shape: 'rect' | 'ellipse') {
  selectedShape.value = shape;
  await applyToolConfig(WhiteboardTool.Shape);
}

async function handleColorSelect(color: string) {
  const tool = settingsTool.value;
  if (tool === null) {
    return;
  }
  const nextStyle = { ...getStoredToolStyle(tool), color };
  saveToolStyle(tool, nextStyle);
  await applyToolConfig(tool, nextStyle);
}

async function handleLineWidthSelect(lineWidth: number) {
  const tool = settingsTool.value;
  if (tool === null) {
    return;
  }
  const nextStyle = { ...getStoredToolStyle(tool), lineWidth };
  saveToolStyle(tool, nextStyle);
  await applyToolConfig(tool, nextStyle);
}

// The dock renders this toolbar only while expanded, so mounting means opening.
onMounted(async () => {
  const tool = currentToolConfig.value.tool;
  const armPen = !hasOpenedToolbar.value && tool === WhiteboardTool.None;
  hasOpenedToolbar.value = true;
  await applyToolConfig(armPen ? WhiteboardTool.Pen : tool);
});

onBeforeUnmount(() => {
  settingsResizeObserver?.disconnect();
  settingsResizeObserver = null;
});

function handleClear() {
  TUIMessageBox.confirm({
    title: t('Whiteboard.ClearAllConfirmTitle'),
    content: t('Whiteboard.ClearAllConfirmContent'),
    callback: async (action) => {
      if (action === 'confirm') {
        await clear('all');
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
  } catch {
    TUIToast.warning({ message: t('Whiteboard.SaveFailed') });
  }
}

</script>

<style lang="scss" scoped>
.whiteboard-toolbar {
  position: relative;
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

  .tool-settings-bar {
    position: absolute;
    left: 50%;
    z-index: 10;
    box-sizing: border-box;
    width: max-content;
    max-width: min(680px, calc(100vw - 32px));
    padding: 8px 10px;
    border: 1px solid var(--stroke-color-module, rgb(255 255 255 / 16%));
    border-radius: 14px;
    color: var(--text-color-primary, #fff);
    background-color: var(--bg-color-operate, #2a2c33);
    box-shadow: 0 4px 16px rgb(0 0 0 / 24%);

    &::before,
    &::after {
      position: absolute;
      left: var(--settings-arrow-left, 50%);
      content: '';
      transform: translateX(-50%);
    }

    &::before {
      width: 18px;
      height: 10px;
      background-color: var(--stroke-color-module, rgb(255 255 255 / 16%));
    }

    &::after {
      width: 16px;
      height: 9px;
      background-color: inherit;
    }
  }

  .settings-bar-top {
    bottom: calc(100% + 10px);
    transform: translateX(calc(-50% + var(--settings-offset-x, 0px)));

    &::before {
      bottom: -10px;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }

    &::after {
      bottom: -8px;
      clip-path: polygon(0 0, 100% 0, 50% 100%);
    }
  }

  .settings-bar-bottom {
    top: calc(100% + 10px);
    transform: translateX(calc(-50% + var(--settings-offset-x, 0px)));

    &::before {
      top: -10px;
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }

    &::after {
      top: -8px;
      clip-path: polygon(50% 0, 100% 100%, 0 100%);
    }
  }

  .settings-content,
  .shape-options,
  .line-widths,
  .palette {
    display: flex;
    align-items: center;
  }

  .settings-content {
    gap: 8px;
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .shape-options {
    gap: 4px;
  }

  .settings-divider {
    flex: 0 0 1px;
    width: 1px;
    height: 28px;
    margin: 0 2px;
    background: var(--stroke-color-module, rgb(255 255 255 / 16%));
  }

  .shape-option {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;

    &:hover:not(.active) {
      background-color: var(--button-color-secondary-hover, rgb(255 255 255 / 12%));
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
    flex: none;
    gap: 9px;
    padding: 3px 5px 3px 1px;
  }

  .color-dot {
    position: relative;
    flex: 0 0 24px;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 50%;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 32%);
    cursor: pointer;

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

  .line-widths {
    flex: none;
    gap: 4px;
  }

  .line-width {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;

    &:hover:not(.active) {
      background-color: var(--button-color-secondary-hover, rgb(255 255 255 / 12%));
    }

    &.active {
      border-color: rgb(28 102 229 / 40%);
      background-color: rgb(28 102 229 / 18%);
      color: #4c8dff;

      &:hover {
        background-color: rgb(28 102 229 / 24%);
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
