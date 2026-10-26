<template>
  <header class="pre-topbar">
    <div class="pre-logo">
      <span class="pre-logo-mark" aria-hidden="true">
        <img class="pre-logo-img" :src="logoUrl" alt="" width="24" height="18">
      </span>
      <span>TUIRoomKit</span>
    </div>
    <div class="pre-topbar-right">
      <ThemeButton />
      <LanguageButton />
      <TUIPopover
        v-model:open="profileOpen"
        placement="bottom-end"
        :padded="false"
        :offset="8"
      >
        <div
          class="user-chip"
          :class="{ 'is-open': profileOpen }"
          role="button"
          tabindex="0"
          @keydown.enter.prevent="activateChip"
          @keydown.space.prevent="activateChip"
        >
          <TUIAvatar
            :size="26"
            :src="avatarUrl"
            :alt="userName || t('Preconference.AvatarFallback')"
          />
          <span class="user-chip-name">{{
            userName || t('Preconference.Welcome')
          }}</span>
        </div>
        <template #content>
          <div class="profile-pop">
            <div class="profile-pop-head">
              <TUIAvatar
                :size="28"
                :src="avatarUrl"
                :alt="userName || t('Preconference.AvatarFallback')"
              />
              <div class="profile-pop-name">
                {{
                  userName || t('Preconference.Welcome')
                }}
              </div>
            </div>
            <button type="button" class="profile-pop-logout" @click="logout">
              {{ t('Preconference.Logout') }}
            </button>
          </div>
        </template>
      </TUIPopover>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  LanguageButton,
  TUIAvatar,
  TUIPopover,
  ThemeButton,
  t,
} from '@tencentcloud/roomkit-web-vue3';
import logoUrl from '../../../assets/logo.png';

defineProps<{
  userName?: string;
  avatarUrl?: string;
  compact?: boolean;
  previewOpen?: boolean;
}>();

const emit = defineEmits<{
  logout: [];
  openPreview: [];
}>();

const profileOpen = ref(false);

function activateChip(event: KeyboardEvent) {
  (event.currentTarget as HTMLElement).click();
}

function logout() {
  profileOpen.value = false;
  emit('logout');
}
</script>

<style scoped lang="scss">
button {
  font: inherit;
  cursor: pointer;
}

[role='button']:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 3px;
}

.pre-topbar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 40px;
}

.pre-logo {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: var(--rk-fs-xl);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.pre-logo-mark {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border-radius: 8px;
}

.pre-logo-img {
  display: block;
  flex: none;
  width: 24px;
  height: 18px;
}

.pre-topbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-chip {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 36px;
  padding: 0 12px 0 4px;
  color: var(--rk-text-primary);
  cursor: pointer;
  background: transparent;
  border-radius: 10px;
}

.user-chip:hover,
.user-chip.is-open,
.user-chip:focus-visible {
  background: var(--rk-bg-hover);
  outline: none;
}

.profile-pop {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 240px;
  padding: 12px;
}

:global(.rk-popover:has(.profile-pop)) {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(0 0 0 / 10%);
}

.profile-pop-head {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.profile-pop-name {
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-pop-logout {
  width: 100%;
  height: 34px;
  font-size: var(--rk-fs-sm);
  font-weight: 500;
  color: var(--rk-danger);
  background: color-mix(in srgb, var(--rk-danger) 12%, transparent);
  border: none;
  border-radius: 8px;
}

.profile-pop-logout:hover {
  background: color-mix(in srgb, var(--rk-danger) 18%, transparent);
}

.user-chip-name {
  max-width: 140px;
  overflow: hidden;
  font-size: var(--rk-fs-md);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width <= 520px) {
  .pre-topbar {
    padding: 0 16px;
  }

  .user-chip-name {
    display: none;
  }
}
</style>
