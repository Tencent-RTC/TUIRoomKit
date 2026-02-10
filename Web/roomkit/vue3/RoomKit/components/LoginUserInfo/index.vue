<template>
  <div class="login-user-info">
    <TUIDropdown
      v-if="props.showLogout"
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <div class="login-user-info-trigger">
        <Avatar :src="loginUserInfo?.avatarUrl" :size="28" />
        <span class="user-id">{{
          loginUserInfo?.userName || loginUserInfo?.userId
        }}</span>
        <IconCaretDownSmall :size="24" />
      </div>
      <template #dropdown>
        <TUIDropdownItem command="logout">
          {{ t('LoginUserInfo.Logout') }}
        </TUIDropdownItem>
      </template>
    </TUIDropdown>
    <div v-else class="login-user-info-trigger">
      <Avatar :src="loginUserInfo?.avatarUrl" :size="28" />
      <span class="user-id">{{
        loginUserInfo?.userName || loginUserInfo?.userId
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  IconCaretDownSmall,
  TUIDropdown,
  TUIDropdownItem,
  TUIToast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-vue3';
import { Avatar, useLoginState } from 'tuikit-atomicx-vue3/room';

interface Props {
  showLogout?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showLogout: true,
});

const { loginUserInfo, logout } = useLoginState();
const { t } = useUIKit();

const emits = defineEmits(['logout']);

const handleCommand = async (command: string | number | object) => {
  if (command === 'logout') {
    try {
      await logout();
      localStorage.removeItem('tuiRoom-userInfo');
      TUIToast.success({ message: t('LoginUserInfo.LogoutSuccess') });
      emits('logout');
    } catch (_error) {
      TUIToast.error({ message: t('LoginUserInfo.LogoutFailed') });
    }
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
</style>
