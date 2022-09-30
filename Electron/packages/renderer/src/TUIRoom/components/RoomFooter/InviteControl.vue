<template>
  <div class="invite-control-container">
    <icon-button
      :title="t('Invite')"
      :icon-name="iconName"
      @click-icon="toggleInviteSidebar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from 'vue-i18n';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();

const iconName = computed(() => (sidebarName.value === 'invite' ? ICON_NAME.InviteActive : ICON_NAME.Invite));

function toggleInviteSidebar() {
  if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'invite') {
    basicStore.setSidebarOpenStatus(false);
    basicStore.setSidebarName('');
    return;
  }
  basicStore.setSidebarOpenStatus(true);
  basicStore.setSidebarName('invite');
}
</script>

<style lang="scss" scoped>

</style>

