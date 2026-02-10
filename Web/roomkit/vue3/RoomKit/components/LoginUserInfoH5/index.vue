<template>
  <div class="login-user-info">
    <div
      v-if="props.showLogout"
      class="login-user-info-trigger"
      @click="showLogoutPopup"
    >
      <Avatar :src="loginUserInfo?.avatarUrl" :size="28" />
      <span class="user-id">{{
        loginUserInfo?.userName || loginUserInfo?.userId
      }}</span>
      <IconCaretDownSmall :size="24" />
    </div>
    <div v-else class="login-user-info-trigger">
      <Avatar :src="loginUserInfo?.avatarUrl" :size="28" />
      <span class="user-id">{{
        loginUserInfo?.userName || loginUserInfo?.userId
      }}</span>
    </div>
  </div>

  <TUIPopup v-model="isLogoutPopupVisible">
    <PopUpArrowDown @click="isLogoutPopupVisible = false" />
    <div class="logout-popup" @click="handleLogout">
      {{ t('LoginUserInfo.Logout') }}
    </div>
  </TUIPopup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IconCaretDownSmall,
  TUIPopup,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, useLoginState } from 'tuikit-atomicx-vue3/room';
import PopUpArrowDown from '../base/PopUpArrowDown.vue';

interface Props {
  showLogout?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogout: true,
});

const { loginUserInfo, logout } = useLoginState();
const { t } = useUIKit();
const isLogoutPopupVisible = ref(false);

const emits = defineEmits(['logout']);

const showLogoutPopup = () => {
  isLogoutPopupVisible.value = true;
};
const handleLogout = async () => {
  try {
    await logout();
    localStorage.removeItem('tuiRoom-userInfo');
    TUIToast.success({ message: t('LoginUserInfo.LogoutSuccess') });
    emits('logout');
  } catch (_error) {
    TUIToast.error({ message: t('LoginUserInfo.LogoutFailed') });
  }
};
</script>

<style lang="scss" scoped>
.login-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-user-info-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-id {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-primary);
}

.logout-popup {
  width: 100%;
  padding: 12px 16px;
  box-sizing: border-box;
  text-align: center;
  font-size: 16px;
  font-weight: 400;
  color: var(--text-color-primary);
}
</style>
