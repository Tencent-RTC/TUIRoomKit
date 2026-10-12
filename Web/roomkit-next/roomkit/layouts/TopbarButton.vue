<template>
  <!-- An open menu already names the button, and the tip would cover its first row. -->
  <TUITooltip :content="label" :disabled="!label || active || open" placement="bottom">
    <TUIPopover
      v-model:open="open"
      :placement="placement"
      :padded="false"
      :disabled="!$slots.dropdown"
    >
      <div
        class="topbar-button"
        :class="{ 'topbar-button-active': active || open }"
        :aria-label="label || undefined"
        v-bind="$attrs"
      >
        <slot>
          <component :is="icon" v-if="icon" :size="15" />
        </slot>
      </div>

      <template #content>
        <slot name="dropdown" :close="close" />
      </template>
    </TUIPopover>
  </TUITooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Component } from 'vue';
import TUIPopover from '../base/components/Popover/index.vue';
import TUITooltip from '../base/components/Tooltip/index.vue';
import type { Placement } from '../base/tokens';

defineOptions({ inheritAttrs: false });

withDefaults(defineProps<{
  /** Shown when the default slot is empty */
  icon?: Component;
  /** Names the chip for the tooltip and for screen readers; icon-only chips need it */
  label?: string;
  active?: boolean;
  placement?: Placement;
}>(), {
  icon: undefined,
  label: '',
  active: false,
  placement: 'bottom-start',
});

const open = ref(false);

/** Handed to the dropdown slot so its own close affordance can dismiss the panel */
function close() {
  open.value = false;
}
</script>

<style scoped lang="scss">
/* The design's topbar chips carry no outline: they read as raised because the surface
   behind them is tinted. */
.topbar-button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;

  /* The slot owns the width: an icon or the signal bars stay inside the 32px square,
     a text label like 中文 pushes it wider. Padding stays under 8px so the square
     case is decided by min-width rather than by the padding. */
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--rk-text-secondary);
  cursor: pointer;
  user-select: none;
  border: 0;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

/* An open dropdown keeps the hover plate rather than taking a brand tint: in the
   design that tint marks the selected item inside a menu, never the chip itself.
   A chip that colours by state, like the network bars, keeps its own colour. */
.topbar-button:hover,
.topbar-button-active {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}
</style>
