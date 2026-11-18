<template>
  <section class="education-leave-card" role="dialog" :aria-label="title">
    <h3 class="education-leave-card-title">
      {{ title }}
    </h3>
    <p class="education-leave-card-body">
      {{ body }}
    </p>
    <div class="education-leave-card-actions">
      <TUIButton size="sm" @click="emit('secondary')">
        {{ secondaryText }}
      </TUIButton>
      <TUIButton variant="danger" size="sm" @click="emit('confirm')">
        {{ confirmText }}
      </TUIButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TUIButton } from '../../base';

defineProps<{
  title: string;
  body: string;
  secondaryText: string;
  confirmText: string;
}>();

/* Views own the exit flow: the teacher's secondary steps out, the student's just closes. */
const emit = defineEmits<{
  secondary: [];
  confirm: [];
}>();
</script>

<style scoped lang="scss">
/* The classroom confirm is a small card anchored to the leave trigger, not the
   centered modal dialog. Geometry follows the design's leave-classroom dialog:
   280px (360px for en copy), right edge on the trigger, 8px below the topbar. */
.education-leave-card {
  box-sizing: border-box;
  width: max-content;
  min-width: min(280px, calc(100vw - 24px));
  max-width: min(360px, calc(100vw - 24px));
  padding: 14px 14px 12px;
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
  border: 1px solid var(--rk-border);
  border-radius: var(--rk-radius-lg);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16);
}

.education-leave-card-title {
  margin: 0 0 4px;
  font-size: var(--rk-fs-lg);
  font-weight: 590;
  line-height: 1.4;
  letter-spacing: -0.02em;
}

.education-leave-card-body {
  margin: 0 0 12px;
  font-size: var(--rk-fs-sm);
  line-height: 1.5;
  color: var(--rk-text-secondary);
}

.education-leave-card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.education-leave-card-actions > .rk-btn {
  flex: none;
  height: 32px;
  padding: 0 12px;
  font-size: var(--rk-fs-md);
  font-weight: 400;
  border: 0;
  border-radius: 8px;
}

.education-leave-card-actions > .rk-btn-secondary {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 8%, transparent);
}

.education-leave-card-actions > .rk-btn-secondary:hover {
  color: var(--rk-text-primary);
  background: color-mix(in srgb, var(--rk-text-primary) 12%, transparent);
}
</style>

<style lang="scss">
/* TUIPopover teleports the card; strip the float chrome so the card owns the surface. */
.rk-float.rk-popover:has(> .education-leave-card) {
  min-width: 0;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: 0;
  box-shadow: none;
}
</style>
