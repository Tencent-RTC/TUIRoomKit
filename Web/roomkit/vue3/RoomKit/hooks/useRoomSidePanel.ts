import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import { conference } from '../adapter/conference';
import type { WidgetConfig } from '../adapter/type';

interface UseRoomSidePanelReturn {
  activeWidgetId: Ref<string | null>;
  sidePanelTitle: ComputedRef<string>;
  panelWidgets: ComputedRef<WidgetConfig[]>;
  toggleWidgetPanel: (widgetId: string) => void;
  closePanel: () => void;
}

const activeWidgetId = ref<string | null>(null);

/**
 * Title of the currently active side panel.
 * Resolved from the widget's panel.title (supports both string and function).
 */
const sidePanelTitle = computed<string>(() => {
  if (!activeWidgetId.value) {
    return '';
  }
  const widget = conference.getRegisteredWidgets()
    .find(w => w.id === activeWidgetId.value && w.panel);
  if (!widget?.panel) {
    return '';
  }
  return typeof widget.panel.title === 'function'
    ? widget.panel.title()
    : widget.panel.title;
});

/**
 * All registered widgets that have panel config.
 * Used for rendering in RoomSidePanel (keepAlive widgets need to stay mounted).
 */
const panelWidgets = computed(() =>
  conference.getRegisteredWidgets().filter(w => w.panel),
);

/**
 * Toggle side panel by widget id.
 * If the panel is already open for this widget, close it; otherwise open it.
 */
const toggleWidgetPanel = (widgetId: string) => {
  activeWidgetId.value = activeWidgetId.value === widgetId ? null : widgetId;
};

/**
 * Close the currently active side panel.
 */
const closePanel = () => {
  activeWidgetId.value = null;
};

export function useRoomSidePanel(): UseRoomSidePanelReturn {
  return {
    activeWidgetId,
    sidePanelTitle,
    panelWidgets,
    toggleWidgetPanel,
    closePanel,
  };
}
