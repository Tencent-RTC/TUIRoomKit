<template>
  <div
    v-if="manageMemberControlConfig.visible"
    class="manage-member-control-container"
  >
    <icon-button
      :is-active="sidebarName === 'manage-member'"
      :title="memberTitle"
      @click-icon="toggleMangeMemberSidebar"
    >
      <IconManageMember size="24" />
    </icon-button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { IconManageMember } from '@tencentcloud/uikit-base-component-vue3';
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { useI18n } from '../../locales';
import { computed } from 'vue';
import { roomService } from '../../services';

const manageMemberControlConfig = roomService.getComponentConfig(
  'ManageMemberControl'
);
const { t } = useI18n();

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { userNumber } = storeToRefs(roomStore);

const memberTitle = computed(() => `${t('Members')}(${userNumber.value})`);

function toggleMangeMemberSidebar() {
  if (
    basicStore.setSidebarOpenStatus &&
    sidebarName.value === 'manage-member'
  ) {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }

  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('manage-member');
}
</script>

<style lang="scss" scoped></style>
