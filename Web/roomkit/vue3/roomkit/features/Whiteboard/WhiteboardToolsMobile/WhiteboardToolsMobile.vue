<template>
  <div v-if="visible" class="whiteboard-tools" :class="{ 'is-collapsed': collapsed }">
    <div class="whiteboard-tools-dock">
      <button
        class="whiteboard-tools-fold"
        type="button"
        @click="toggleCollapsed"
      >
        <IconChevronRightMobile :size="12" />
      </button>
      <button
        ref="penBtnRef"
        class="whiteboard-tools-btn"
        :class="{ 'is-on': tool === 'pen' }"
        type="button"
        @click="onPenClick"
      >
        <IconPen :size="16" />
        <i class="whiteboard-tools-tint" :style="{ background: penColor }" />
      </button>
      <div v-if="penPanelOpen" ref="panelRef" class="whiteboard-tools-pen-panel">
        <div class="whiteboard-tools-sizes" :style="{ '--pen-color': penColor }">
          <button
            v-for="size in STROKE_WIDTHS"
            :key="size.value"
            class="whiteboard-tools-size"
            :class="{ 'is-on': penWidth === size.value }"
            type="button"
            :style="{ '--dot': `${size.dot}px` }"
            @click="selectWidth(size.value)"
          />
        </div>
        <span class="whiteboard-tools-pen-rule" />
        <div class="whiteboard-tools-colors">
          <button
            v-for="swatch in PEN_COLORS"
            :key="swatch"
            class="whiteboard-tools-swatch"
            :class="{ 'is-on': penColor === swatch }"
            type="button"
            :style="{ '--swatch': swatch }"
            @click="selectColor(swatch)"
          />
        </div>
      </div>
      <button
        class="whiteboard-tools-btn"
        :class="{ 'is-on': tool === 'eraser' }"
        type="button"
        @click="selectEraser"
      >
        <IconEraser :size="16" />
      </button>
      <span class="whiteboard-tools-rule" />
      <button class="whiteboard-tools-btn" type="button" :disabled="!canUndo" @click="undo">
        <IconUndo :size="16" />
      </button>
      <button class="whiteboard-tools-btn" type="button" :disabled="!canRedo" @click="redo">
        <IconRedo :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { IconChevronRightMobile, IconEraser, IconPen, IconRedo, IconUndo } from '../../../base';
import { useWhiteboardState } from '../WhiteboardState';

type DrawingTool = 'pen' | 'eraser';

/** Pen panel: four widths, then the twelve classroom colors. White and medium start selected. */
const STROKE_WIDTHS = [
  { value: 1.6, dot: 4 },
  { value: 3, dot: 7 },
  { value: 5.5, dot: 11 },
  { value: 9, dot: 15 },
] as const;

const PEN_COLORS = [
  '#ffffff',
  '#bdbdbd',
  '#1a1a1a',
  '#e54545',
  '#ff7a00',
  '#f5c542',
  '#00c853',
  '#00c9a7',
  '#0a84ff',
  '#7c4dff',
  '#ff5aa5',
  '#8d6e63',
] as const;

const { isWhiteboardOn, isAnnotationOn, canUndo, canRedo, updatePlugin } = useWhiteboardState();

const penBtnRef = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const visible = computed(() => isWhiteboardOn.value || isAnnotationOn.value);
const collapsed = ref(false);
const tool = ref<DrawingTool>('pen');
const penPanelOpen = ref(false);
const penColor = ref<string>(PEN_COLORS[0]);
const penWidth = ref<number>(STROKE_WIDTHS[1].value);

function run(options: Parameters<typeof updatePlugin>[0], action: string) {
  updatePlugin(options).catch((error: unknown) => {
    console.warn(`[WhiteboardToolsMobile] ${action} failed:`, error);
  });
}

function applyPen() {
  run({ tool: { name: 'pen', color: penColor.value, lineWidth: penWidth.value } }, 'set pen');
}

watch(visible, (on) => {
  if (!on) {
    return;
  }
  tool.value = 'pen';
  collapsed.value = false;
  penPanelOpen.value = false;
  applyPen();
}, { immediate: true });

/** Switches the tool and toggles the side panel in one tap, as the dock pen does. */
function onPenClick() {
  selectPen();
  penPanelOpen.value = !penPanelOpen.value;
}

function selectPen() {
  if (tool.value !== 'pen') {
    tool.value = 'pen';
    applyPen();
  }
}

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  if (collapsed.value) {
    penPanelOpen.value = false;
  }
}

function selectWidth(width: number) {
  penWidth.value = width;
  applyPen();
}

function selectColor(color: string) {
  penColor.value = color;
  applyPen();
}

function onDocPointerDown(event: PointerEvent) {
  const target = event.target as Node;
  /* Selecting inside the panel keeps it open; the pen button toggles in its own
     click handler, so both stay exempt here. */
  if (panelRef.value?.contains(target) || penBtnRef.value?.contains(target)) {
    return;
  }
  penPanelOpen.value = false;
}

watch(penPanelOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', onDocPointerDown, true);
  } else {
    document.removeEventListener('pointerdown', onDocPointerDown, true);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true);
});

/** The document pointerdown close runs before this click, so the panel is already shut. */
function selectEraser() {
  tool.value = 'eraser';
  run({ tool: { name: 'eraserObject' } }, 'set tool');
}

function undo() {
  if (!canUndo.value) {
    return;
  }
  run({ operation: 'undo' }, 'undo');
}

function redo() {
  if (!canRedo.value) {
    return;
  }
  run({ operation: 'redo' }, 'redo');
}
</script>

<style scoped lang="scss" src="./WhiteboardToolsMobile.scss"></style>
