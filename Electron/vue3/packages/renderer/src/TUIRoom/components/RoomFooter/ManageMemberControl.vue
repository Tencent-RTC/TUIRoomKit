<template>
  <div class="manage-member-control-container">
    <icon-button
      :is-active="sidebarName === 'manage-member'"
      :title="memberTitle"
      @click-icon="toggleMangeMemberSidebar"
    >
      <manage-member-icon></manage-member-icon>
    </icon-button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import IconButton from '../common/base/IconButton.vue';
import ManageMemberIcon from '../common/icons/ManageMemberIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { useI18n } from '../../locales';
import { computed } from 'vue';

const { t } = useI18n();

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { userNumber } = storeToRefs(roomStore);

const memberTitle = computed(() => `${t('Members')}(${userNumber.value})`);

function toggleMangeMemberSidebar() {
  if (basicStore.setSidebarOpenStatus && sidebarName.value === 'manage-member') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }

  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('manage-member');
}
</script>

<style lang="scss" scoped>

</style>
