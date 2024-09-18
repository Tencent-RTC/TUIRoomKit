<template>
  <div v-if="moreControlConfig.visible" class="more-control-container">
    <icon-button
      :is-active="sidebarName === 'more'"
      :title="t('More')"
      :icon="MoreIcon"
      @click-icon="toggleMoreSidebar"
    />
  </div>
</template>
<script setup lang="ts">
import IconButton from '../../common/base/IconButton.vue';
import MoreIcon from '../../common/icons/MoreIcon.vue';
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
