<template>
  <div v-if="moreControlConfig.visible" class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('More')"
      @click-icon="toggleMoreSidebar"
    >
      <IconMore size="24" />
    </icon-button>
  </div>
</template>
<script setup lang="ts">
import { IconMore } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../../common/base/IconButton.vue';
import userMoreControl from './useMoreControlHooks';
import { roomService } from '../../../services';

const moreControlConfig = roomService.getComponentConfig('MoreControl');
const { t, basicStore, sidebarName } = userMoreControl();

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
<style lang="scss" scoped></style>
