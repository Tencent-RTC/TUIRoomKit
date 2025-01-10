<template>
  <div class="invite-control-container" v-if="inviteControlConfig.visible">
    <icon-button
      :is-active="sidebarName === 'invite'"
      :title="t('Invite')"
      icon="InviteIcon"
      @click-icon="toggleInviteSidebar"
    >
    </icon-button>
    <div v-if="isShowInviteTab" class="invite-container">
      <room-invite ref="inviteRef" @on-close-invite="handleCloseInvite"></room-invite>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IconButton from '../common/base/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../locales';
import { isMobile }  from '../../utils/environment';
import roomInvite from '../RoomInvite/index.vue';
import { roomService } from '../../services';

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowInviteTab = ref(false);
const inviteRef = ref();
const [inviteControlConfig] = roomService.getComponentConfig(['InviteControl']);

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

function handleCloseInvite() {
  isShowInviteTab.value = false;
}
</script>

<style lang="scss" scoped>
.invite-container {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 750rpx;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1;
}
</style>

