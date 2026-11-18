<template>
  <!-- Not a command host: the scene view's own provider takes the toasts once it mounts. -->
  <RoomKitProvider class="education-loading-root" scene="education" :command="false">
    <div class="education-loading">
      <TUILoading variant="card" size="lg" :tip="t('RoomEntry.Loading')" />
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
/**
 * Shown while the education chunk downloads, so it must stay statically imported by
 * `views/index.ts`. Matches the scene's join-loading overlay so the hand-off is seamless.
 */
import { RoomKitProvider, TUILoading, t } from '../../base';
</script>

<style lang="scss" scoped>
.education-loading-root {
  height: 100%;
}

.education-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rk-bg-overlay);
  backdrop-filter: blur(8px);
}
</style>
