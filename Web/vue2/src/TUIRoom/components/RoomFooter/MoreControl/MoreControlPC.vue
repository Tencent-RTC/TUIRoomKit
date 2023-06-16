<template>
  <div class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('More')"
      :icon-name="iconName"
      @click-icon="toggleMoreSidebar"
    />
  </div>
</template>
<script setup lang="ts">
import IconButton from '../../common/IconButton.vue';
import userMoreControl from './useMoreControlHooks';

const {
  t,
  iconName,
  basicStore,
  sidebarName,
} = userMoreControl();

function toggleMoreSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'more') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('more');
}
</script>
<style lang="scss" scoped>

</style>
