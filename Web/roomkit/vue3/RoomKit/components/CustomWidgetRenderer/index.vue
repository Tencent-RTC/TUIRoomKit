<template>
  <!--
    Hidden slot container: when used as a wrapper (container mode),
    Registrar children are rendered here so their setup() runs to register widgets,
    but the actual DOM is hidden since rendering is handled by this component.
  -->
  <div
    v-if="hasSlotContent"
    class="registrar-slot-container"
    aria-hidden="true"
  >
    <slot />
  </div>

  <!-- Visible widgets rendered directly in the toolbar -->
  <template v-for="widget in visibleWidgets" :key="widget.id">
    <!-- Custom trigger mode: render user-provided component directly -->
    <component
      :is="widget.component"
      v-if="isCustomTrigger(widget)"
      v-bind="resolveProps(widget)"
    />
    <!-- Standard trigger mode: render icon + label via IconButton -->
    <IconButton
      v-else
      :title="resolveLabel(widget)"
      @click-icon="handleWidgetClick(widget)"
    >
      <component
        :is="resolveIcon(widget)"
        v-if="isComponentIcon(widget)"
        :size="24"
      />
      <span v-else class="custom-widget-icon-text">{{ resolveIcon(widget) }}</span>
    </IconButton>
  </template>

  <!-- Overflow widgets rendered inside MoreButton dropdown -->
  <MoreButton :overflow-widgets="overflowWidgets">
    <template v-for="widget in overflowWidgets" :key="widget.id">
      <component
        :is="widget.component"
        v-if="isCustomTrigger(widget)"
        v-bind="resolveProps(widget)"
      />
      <IconButton
        v-else
        :title="resolveLabel(widget)"
        @click-icon="handleWidgetClick(widget)"
      >
        <component
          :is="resolveIcon(widget)"
          v-if="isComponentIcon(widget)"
          :size="24"
        />
        <span v-else class="custom-widget-icon-text">{{ resolveIcon(widget) }}</span>
      </IconButton>
    </template>
  </MoreButton>

  <!--
    Hidden measurement container: renders all widgets off-screen
    so we can measure their actual pixel widths for overflow calculation.
  -->
  <div
    v-if="enableOverflow"
    ref="measureContainerRef"
    class="measure-container"
    aria-hidden="true"
  >
    <template v-for="widget in sortedWidgets" :key="'m-' + widget.id">
      <div class="measure-item" :data-widget-id="widget.id">
        <div
          v-if="isCustomTrigger(widget)"
          class="measure-item-placeholder"
        />
        <IconButton
          v-else
          :title="resolveLabel(widget)"
        >
          <component
            :is="resolveIcon(widget)"
            v-if="isComponentIcon(widget)"
            :size="24"
          />
          <span v-else class="custom-widget-icon-text">{{ resolveIcon(widget) }}</span>
        </IconButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, useSlots, provide, Fragment, Comment } from 'vue';
import type { Component, VNode } from 'vue';
import { conference } from '../../adapter/conference';
import { useRoomSidePanel } from '../../hooks/useRoomSidePanel';
import IconButton from '../base/IconButton.vue';
import MoreButton from '../MoreButton/index.vue';
import { widgetDeclarationOrderContextKey } from './context';
import type { WidgetConfig, WidgetZone, WidgetPlatform } from '../../adapter/type';

const slots = useSlots();

/**
 * Whether slot content is provided (container mode).
 * When true, Registrar children are rendered inside a hidden container
 * so their setup() runs to register widgets, while actual rendering
 * is handled by this component.
 */
const hasSlotContent = computed(() => !!slots.default);

interface Props {
  zone: WidgetZone;
  platform?: WidgetPlatform;
  gap?: number;
}

const props = withDefaults(defineProps<Props>(), {
  gap: 16,
});

const { toggleWidgetPanel } = useRoomSidePanel();

function getVNodeName(vnode: VNode): string | undefined {
  if (typeof vnode.type === 'object' && vnode.type !== null) {
    const componentType = vnode.type as { name?: string; __name?: string };
    return componentType.name || componentType.__name;
  }
  return undefined;
}

function flattenSlotVNodes(vnodes: VNode[]): VNode[] {
  const flattened: VNode[] = [];

  vnodes.forEach((vnode) => {
    if (vnode.type === Comment) {
      return;
    }

    if (vnode.type === Fragment) {
      const fragmentChildren = Array.isArray(vnode.children) ? vnode.children : [];
      flattened.push(...flattenSlotVNodes(fragmentChildren as VNode[]));
      return;
    }

    flattened.push(vnode);
  });

  return flattened;
}

const slotWidgetOrder = computed(() => {
  const slotContent = slots.default?.() ?? [];
  const flattened = flattenSlotVNodes(slotContent);
  const orderMap = new Map<string, number>();

  flattened.forEach((vnode, index) => {
    const componentName = getVNodeName(vnode);
    if (componentName && !orderMap.has(componentName)) {
      orderMap.set(componentName, index);
    }
  });

  return orderMap;
});

provide(widgetDeclarationOrderContextKey, {
  getDeclarationOrder(componentName?: string) {
    if (!componentName) {
      return undefined;
    }
    return slotWidgetOrder.value.get(componentName);
  },
});

const sortedWidgets = computed(() => conference.getRegisteredWidgets(props.zone, props.platform));
const enableOverflow = computed(() => props.platform === 'pc' && props.zone === 'bottom-center');

/** Widget ids currently collapsed into the More menu. Empty means everything fits. */
const overflowWidgetIds = ref<string[]>([]);

const measureContainerRef = ref<HTMLElement | null>(null);

/**
 * Widgets that are visible in the toolbar.
 * On H5, all widgets are always visible (overflow is handled by ExpandFooterH5).
 * On PC, widgets with `overflow: false` stay here even when the bar is narrow.
 */
const visibleWidgets = computed(() => {
  if (!enableOverflow.value || overflowWidgetIds.value.length === 0) {
    return sortedWidgets.value;
  }
  const overflowSet = new Set(overflowWidgetIds.value);
  return sortedWidgets.value.filter(widget => !overflowSet.has(widget.id));
});

/**
 * Widgets that overflow into the MoreButton dropdown (PC only).
 */
const overflowWidgets = computed(() => {
  if (!enableOverflow.value || overflowWidgetIds.value.length === 0) {
    return [];
  }
  const overflowSet = new Set(overflowWidgetIds.value);
  return sortedWidgets.value.filter(widget => overflowSet.has(widget.id));
});

/** Width reserved for the "More" button itself (icon-button + gap) */
const MORE_BUTTON_WIDTH = 56;

function canCollapseToMore(widget: WidgetConfig): boolean {
  return widget.overflow !== false;
}

function sumLayoutWidth(indices: number[], widths: number[], gap: number): number {
  if (indices.length === 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < indices.length; i += 1) {
    total += widths[indices[i]];
    if (i > 0) {
      total += gap;
    }
  }
  return total;
}

/**
 * Measure children widths from the hidden measurement container and
 * compute which widgets must collapse into More. Widgets with
 * `overflow: false` are skipped so they stay on the toolbar.
 */
function recalculate() {
  if (!enableOverflow.value) {
    overflowWidgetIds.value = [];
    return;
  }

  if (!measureContainerRef.value) {
    overflowWidgetIds.value = [];
    return;
  }

  // The parent element is the actual toolbar container (e.g. .control-center)
  const parentEl = measureContainerRef.value.parentElement;
  if (!parentEl) {
    overflowWidgetIds.value = [];
    return;
  }

  const containerWidth = parentEl.offsetWidth;
  const measureChildren = Array.from(measureContainerRef.value.children) as HTMLElement[];
  const widgets = sortedWidgets.value;

  if (measureChildren.length === 0 || measureChildren.length !== widgets.length) {
    overflowWidgetIds.value = [];
    return;
  }

  // Collect measured widths
  const widths: number[] = [];
  let totalWidth = 0;
  for (let i = 0; i < measureChildren.length; i += 1) {
    const w = measureChildren[i].offsetWidth;
    widths.push(w);
    totalWidth += w + (i > 0 ? props.gap : 0);
  }

  // If everything fits, no overflow needed
  if (totalWidth <= containerWidth) {
    overflowWidgetIds.value = [];
    return;
  }

  // Collapse overflowable widgets from the right until the rest fit
  // next to the More button. Pinned widgets (`overflow: false`) stay.
  const availableWidth = containerWidth - MORE_BUTTON_WIDTH - props.gap;
  const visibleIndices: number[] = widgets.map((_, index) => index);
  const overflowIndices: number[] = [];

  for (let i = widgets.length - 1; i >= 0; i -= 1) {
    if (sumLayoutWidth(visibleIndices, widths, props.gap) <= availableWidth) {
      break;
    }
    if (!canCollapseToMore(widgets[i])) {
      continue;
    }
    const pos = visibleIndices.indexOf(i);
    if (pos === -1) {
      continue;
    }
    visibleIndices.splice(pos, 1);
    overflowIndices.unshift(i);
  }

  overflowWidgetIds.value = overflowIndices.map(index => widgets[index].id);
}

function isCustomTrigger(widget: WidgetConfig): widget is WidgetConfig & { component: Component } {
  return 'component' in widget && widget.component !== undefined && !('icon' in widget && widget.icon !== undefined);
}

function resolveValue<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

function resolveIcon(widget: WidgetConfig): Component | string {
  if ('icon' in widget && widget.icon !== undefined) {
    return resolveValue(widget.icon) as Component | string;
  }
  return '';
}

function resolveLabel(widget: WidgetConfig): string {
  if ('label' in widget && widget.label !== undefined) {
    return resolveValue(widget.label) as string;
  }
  return '';
}

function isComponentIcon(widget: WidgetConfig): boolean {
  const icon = resolveIcon(widget);
  return typeof icon !== 'string';
}

/**
 * Resolve widget props for custom trigger components.
 * Supports two forms:
 * - Function: a getter that returns the full props object (re-evaluated reactively)
 * - Object: static props passed through as-is
 *
 * When the widget has a panel config, a `togglePanel` function is automatically
 * injected into the resolved props, allowing the component to control the side
 * panel without any extra setup.
 */
function resolveProps(widget: WidgetConfig): Record<string, any> {
  let userProps: Record<string, any> = {};
  if ('props' in widget && widget.props) {
    userProps = typeof widget.props === 'function' ? widget.props() : widget.props;
  }

  if (widget.panel) {
    return {
      ...userProps,
      togglePanel: () => toggleWidgetPanel(widget.id),
    };
  }
  return userProps;
}

/**
 * Handle widget click.
 * For custom trigger widgets, the panel is NOT auto-toggled — the component
 * receives a `togglePanel` prop and controls it explicitly.
 * For standard trigger widgets (icon + label), clicking toggles the panel.
 */
function handleWidgetClick(widget: WidgetConfig) {
  if (widget.panel && !isCustomTrigger(widget)) {
    toggleWidgetPanel(widget.id);
  }
  if ('onClick' in widget && typeof widget.onClick === 'function') {
    widget.onClick();
  }
}

let resizeObserver: ResizeObserver | null = null;

// Watch for widget list changes to trigger re-measurement
watch(sortedWidgets, () => {
  nextTick(recalculate);
}, { deep: true });

onMounted(() => {
  nextTick(recalculate);

  // Observe the parent container for size changes
  if (measureContainerRef.value?.parentElement) {
    resizeObserver = new ResizeObserver(() => {
      recalculate();
    });
    resizeObserver.observe(measureContainerRef.value.parentElement);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style lang="scss" scoped>
/* Hidden container for Registrar children in container mode.
 * Registrar components only run setup() to register widgets;
 * they render empty templates, so display:none is sufficient. */
.registrar-slot-container {
  display: none;
}

/* Hidden off-screen container used only for measuring child widths.
 * Uses the "visually hidden" pattern so children remain in layout for measurement
 * but are invisible and non-interactive. position:absolute removes it from flow. */
.measure-container {
  position: absolute;
  top: 0;
  left: 0;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  gap: 16px;
  white-space: nowrap;
  z-index: -1;
}

.measure-item {
  flex-shrink: 0;
}

.measure-item-placeholder {
  width: 56px;
  height: 32px;
}
</style>
