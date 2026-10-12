<template>
  <!-- An open menu already names the button, and the tip would cover its first row. -->
  <TUITooltip :content="label" :disabled="!showTooltip || menuOpen">
    <div
      class="toolbar-button"
      :class="{
        'toolbar-button-active': active,
        'toolbar-button-danger': danger,
        'toolbar-button-leave': leave,
        'toolbar-button-blocked': blocked,
        'toolbar-button-with-menu': hasMenu,
      }"
      :data-menu-open="menuOpen ? '1' : undefined"
    >
      <button
        class="toolbar-button-main"
        type="button"
        :aria-label="label"
        :disabled="disabled || loading"
        v-bind="$attrs"
        @click="$emit('click')"
      >
        <span class="toolbar-button-icon">
          <slot name="icon">
            <component :is="icon" :size="22" v-if="icon && typeof icon !== 'string'" />
            <template v-else>{{ icon }}</template>
          </slot>
          <IconUnSupport v-if="notice" class="toolbar-button-notice" :size="12" />
        </span>
      </button>

      <TUIPopover
        v-if="hasMenu"
        v-model:open="menuOpen"
        placement="top"
        :offset="12"
        :padded="false"
        :disabled="disabled"
      >
        <button
          class="toolbar-button-caret"
          type="button"
          :aria-label="menuLabel || label"
          :aria-expanded="menuOpen"
          :disabled="disabled"
        >
          <IconChevronUp :size="10" />
        </button>
        <template #content>
          <slot name="menu" :close="closeMenu" />
        </template>
      </TUIPopover>
    </div>
  </TUITooltip>
</template>

<script setup lang="ts">
import { computed, ref, useSlots } from 'vue';
import type { Component } from 'vue';
import { IconChevronUp, IconUnSupport, TUIPopover, TUITooltip } from '../base';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  label: string;
  icon?: string | Component;
  /** Accessible name for the menu trigger, defaults to the button label */
  menuLabel?: string;
  active?: boolean;
  danger?: boolean;
  leave?: boolean;
  disabled?: boolean;
  /** Looks unavailable but still emits click, so the handler can explain why */
  blocked?: boolean;
  loading?: boolean;
  notice?: boolean;
  showTooltip?: boolean;
  /**
   * Drops the caret and its popover while keeping the toggle. Overlays teleport to the
   * TUIOverlayHost of the opener document, so a host that renders this button in a second
   * document — the picture-in-picture mini window — would open the menu out of sight.
   */
  hideMenu?: boolean;
}>(), {
  icon: undefined,
  menuLabel: '',
  active: false,
  danger: false,
  leave: false,
  disabled: false,
  blocked: false,
  loading: false,
  notice: false,
  showTooltip: true,
  hideMenu: false,
});

defineEmits<{
  click: [];
}>();

const slots = useSlots();
const menuOpen = ref(false);
const hasMenu = computed(() => !!slots.menu && !props.hideMenu);

/** Handed to the menu slot so an item that navigates elsewhere can dismiss the popover */
function closeMenu() {
  menuOpen.value = false;
}
</script>

<style scoped lang="scss">
/* The chip is a frame around its controls, not a control itself: the padding lives on
   the button and the caret so the whole surface the hover paints is also clickable. */
.toolbar-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
  border-radius: var(--rk-radius-md);
  transition: background 0.15s;
}

.toolbar-button:hover {
  background: color-mix(in srgb, var(--rk-text-primary) 10%, transparent);
}

.toolbar-button-active {
  background: color-mix(in srgb, var(--rk-info) 14%, transparent);
}

/* Without a hover of its own the plain one wins on specificity and greys the tint out. */
.toolbar-button-active:hover {
  background: color-mix(in srgb, var(--rk-info) 22%, transparent);
}

.toolbar-button-danger {
  background: color-mix(in srgb, var(--rk-danger) 14%, transparent);
}

.toolbar-button-danger:hover {
  background: color-mix(in srgb, var(--rk-danger) 22%, transparent);
}

.toolbar-button-leave {
  height: 44px;
  color: var(--rk-on-accent);
  background: var(--rk-danger);
  border-radius: var(--rk-radius-pill);
}

.toolbar-button-leave:hover {
  background: var(--rk-danger);
  filter: brightness(0.94);
}

.toolbar-button-main {
  display: flex;
  align-items: center;
  align-self: stretch;
  justify-content: center;
  min-width: 48px;
  padding: 0 10px;
  font: inherit;
  color: inherit;
  cursor: pointer;
  background: transparent;
  border: 0;
}

/* Asymmetric padding keeps the icon optically centered next to the caret */
.toolbar-button-with-menu .toolbar-button-main {
  min-width: 36px;
  padding: 0 0 0 8px;
}

.toolbar-button-leave .toolbar-button-main {
  padding: 0 22px;
}

.toolbar-button-main:disabled,
.toolbar-button-blocked .toolbar-button-main {
  cursor: not-allowed;
  opacity: 0.55;
}

.toolbar-button-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
}

.toolbar-button-active .toolbar-button-icon {
  color: var(--rk-info);
}

.toolbar-button-icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.toolbar-button-notice {
  position: absolute;
  right: -1px;
  bottom: 0;
  color: var(--rk-danger);
  pointer-events: none;
}

/* The rule above sizes every icon in the chip to 22px; the badge keeps its own box. */
.toolbar-button-notice :deep(svg) {
  width: 100%;
  height: 100%;
}

/* The popover wraps the caret in its own anchor, so the stretch has to start there
   for the caret to reach the full height of the chip. */
.toolbar-button-with-menu :deep(.rk-popover-anchor) {
  align-self: stretch;
}

.toolbar-button-caret {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 100%;
  padding: 0 4px 0 0;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: color 0.12s, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.toolbar-button-caret:hover {
  color: var(--rk-text-primary);
}

.toolbar-button-caret:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.toolbar-button-caret :deep(svg) {
  width: 9px;
  height: 9px;
}

.toolbar-button[data-menu-open='1'] .toolbar-button-caret {
  color: var(--rk-info);
  transform: rotate(180deg);
}
</style>
