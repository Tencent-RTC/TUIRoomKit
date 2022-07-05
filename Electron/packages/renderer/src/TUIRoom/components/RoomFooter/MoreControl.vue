<template>
  <div class="more-control-container">
    <icon-button
      title="更多"
      :icon-name="iconName"
      @click-icon="toggleMoreSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import IconButton from '../common/IconButton.vue';
import { ICON_NAME } from '../../constants/icon';
import { computed } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);

const iconName = computed(() => (sidebarName.value === 'more' ? ICON_NAME.MoreActive : ICON_NAME.More));

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
