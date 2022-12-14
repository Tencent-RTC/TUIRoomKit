<template>
  <component :is="asyncComponent"></component>
</template>

<script setup lang="ts">
  import { defineAsyncComponent } from 'vue';
  import { isElectronEnv } from '../../../utils/utils';

  let asyncComponent: any = null;
  const userAgent = navigator.userAgent.toLowerCase();
  const isElectron = isElectronEnv();
  if (isElectron) {
    asyncComponent = defineAsyncComponent(() => import('./ElectronControl.vue'));
  } else {
    asyncComponent = defineAsyncComponent(() => import('./WebControl.vue'));
  }
</script>
