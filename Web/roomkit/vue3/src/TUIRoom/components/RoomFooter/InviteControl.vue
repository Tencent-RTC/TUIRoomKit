<template>
  <div
    v-if="inviteControlConfig.visible"
    class="invite-control-container"
    v-click-outside="handleClickOutSide"
  >
    <icon-button
      class="invite"
      :is-active="sidebarName === 'invite'"
      :title="t('Invite')"
      :icon="InviteIcon"
      @click-icon="toggleInviteSidebar"
    />
    <room-invite
      ref="inviteRef"
      v-if="isShowInviteTab"
      @on-close-invite="handleCloseInvite"
    />
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import InviteIcon from '../common/icons/InviteIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isMobile } from '../../utils/environment';
import roomInvite from '../RoomInvite';
import { roomService } from '../../services';
import vClickOutside from '../../directives/vClickOutside';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowInviteTab = ref(false);
const inviteRef = ref();
const inviteControlConfig = roomService.getComponentConfig('InviteControl');
function toggleInviteSidebar() {
  isShowInviteTab.value = !isShowInviteTab.value;
  if (isMobile) {
    if (basicStore.sidebarName === 'invite') {
      basicStore.setSidebarName('');
      return;
    }
    basicStore.setSidebarName('invite');
  }
}

function handleCloseInvite() {
  isShowInviteTab.value = false;
}

function handleClickOutSide() {
  if (isShowInviteTab.value) {
    isShowInviteTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
.invite-control-container {
  position: relative;
}
</style>
