<template>
  <div class="invite-control-container">
    <icon-button
      :is-active="sidebarName === 'invite'"
      :title="t('Invite')"
      :icon-name="iconName"
      @click-icon="toggleInviteSidebar"
    />
  </div>
  <div v-if="isShowInviteTab" class="invite-container" @click="closeInviteTab">
    <room-invite></room-invite>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import { isMobile } from '../../utils/useMediaValue';
import roomInvite from '../RoomInvite';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowInviteTab = ref(false);

const iconName = computed(() => (sidebarName.value === 'invite' && !isMobile ? ICON_NAME.InviteActive : ICON_NAME.Invite));

function toggleInviteSidebar() {
  if (isMobile) {
    isShowInviteTab.value = true;
    if (basicStore.sidebarName === 'invite') {
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarName('invite');
  } else {
    if (basicStore.setSidebarOpenStatus && basicStore.sidebarName === 'invite') {
      basicStore.setSidebarOpenStatus(false);
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarOpenStatus(true);
    basicStore.setSidebarName('invite');
  }
}

function closeInviteTab() {
  isShowInviteTab.value = false;
}
</script>

<style lang="scss" scoped>
.invite-container {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: auto;
  box-sizing: border-box;
  background-color: var(--log-out-mobile);
}
</style>

