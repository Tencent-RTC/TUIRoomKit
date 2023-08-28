<template>
  <div class="invite-control-container">
    <icon-button
      :is-active="sidebarName === 'invite'"
      :title="t('Invite')"
      :icon-name="iconName"
      @click-icon="toggleInviteSidebar"
    />
    <div v-if="isShowInviteTab" class="invite-container">
      <room-invite ref="inviteRef" @on-close-invite="handleCloseInvite"></room-invite>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import IconButton from '../common/IconButton.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import { ICON_NAME } from '../../constants/icon';
import { useI18n } from '../../locales';
import { isMobile }  from '../../utils/useMediaValue';
// / @TUIRoom-PlatformAdapter-Start
import roomInvite from '../RoomInvite/index.vue';
// / @TUIRoom-PlatformAdapter-End

const basicStore = useBasicStore();
const { sidebarName } = storeToRefs(basicStore);
const { t } = useI18n();
const isShowInviteTab = ref(false);
const inviteRef = ref();

const iconName = computed(() => (
  isMobile ? ICON_NAME.Invite : (sidebarName.value === 'invite' ? ICON_NAME.InviteActive : ICON_NAME.Invite)
));

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

function handleDocumentClick(event: MouseEvent) {
  if (isShowInviteTab.value && inviteRef.value && !inviteRef.value.$el.contains(event.target)) {
    isShowInviteTab.value = false;
  }
}

function handleCloseInvite() {
  isShowInviteTab.value = false;
}

onMounted(() => {
  document?.addEventListener('click', handleDocumentClick, true);
});

onUnmounted(() => {
  document?.removeEventListener('click', handleDocumentClick, true);
});
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

