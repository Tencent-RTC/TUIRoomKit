<template>
  <div class="invite-control-container">
    <icon-button
      :title="t('Members')"
      :icon-name="iconName"
      @click-icon="toggleMangeMemberSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const iconName = computed(() => (sidebarName.value === 'manage-member' ? ICON_NAME.ManageMemberActive : ICON_NAME.ManageMember));

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
