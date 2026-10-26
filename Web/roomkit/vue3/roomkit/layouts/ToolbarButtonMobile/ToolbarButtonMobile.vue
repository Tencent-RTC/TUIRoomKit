<template>
  <div
    class="toolbar-button-mobile"
    :class="{ 'is-active': active, 'is-blocked': blocked, 'is-disabled': disabled }"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-label="label"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    :aria-disabled="disabled || undefined"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
  >
    <span class="toolbar-button-mobile-icon">
      <slot />
    </span>
    <slot name="badge" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Accessible name; the more sheet also prints it under the circle. */
  label: string;
  active?: boolean;
  /** Reported as `aria-pressed`; toggles that open a panel set it, plain actions leave it out. */
  pressed?: boolean;
  /** Looks unavailable but still emits click, so the handler can explain why */
  blocked?: boolean;
  disabled?: boolean;
}>(), {
  active: false,
  pressed: undefined,
  blocked: false,
  disabled: false,
});

const emit = defineEmits<{ click: [] }>();

function handleClick() {
  if (props.disabled) {
    return;
  }
  emit('click');
}
</script>

<style scoped lang="scss">
.toolbar-button-mobile {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: color-mix(in srgb, var(--rk-text-primary) 6%, transparent);
  border-radius: 50%;
  outline: none;
  transition: background 0.15s, color 0.15s, transform 0.08s;
  -webkit-tap-highlight-color: transparent;
}

.toolbar-button-mobile:not(.is-disabled):active {
  transform: scale(0.96);
}

.toolbar-button-mobile.is-active {
  color: var(--rk-brand);
  background: var(--rk-brand-soft);
}

.toolbar-button-mobile.is-blocked,
.toolbar-button-mobile.is-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.toolbar-button-mobile-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.toolbar-button-mobile-icon :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
