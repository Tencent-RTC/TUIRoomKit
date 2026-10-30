<template>
  <header class="pre-topbar">
    <div class="pre-brand">
      <span class="pre-brand-mark" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
        >
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </span>
      <span class="pre-brand-name">RoomKit <em>· EDU</em></span>
    </div>
    <div class="pre-topbar-right">
      <TUIPopover
        v-model:open="profileOpen"
        placement="bottom-end"
        :padded="false"
        :offset="8"
      >
        <button
          type="button"
          class="pre-who"
          :class="{ 'is-open': profileOpen }"
          aria-haspopup="dialog"
          :aria-expanded="profileOpen"
        >
          <span class="pre-avatar" aria-hidden="true">
            <img v-if="avatarUrl" :src="avatarUrl" alt="">
            <template v-else>{{ initial }}</template>
          </span>
          <span class="pre-who-name">{{ displayName }}</span>
        </button>
        <template #content>
          <div class="pre-profile" role="dialog" :aria-label="t('Preclass.Profile')">
            <div class="pre-profile-head">
              <span class="pre-avatar" aria-hidden="true">
                <img v-if="avatarUrl" :src="avatarUrl" alt="">
                <template v-else>{{ initial }}</template>
              </span>
              <div class="pre-profile-name">
                {{ displayName }}
              </div>
            </div>
            <button type="button" class="pre-profile-logout" @click="askLogout">
              {{ t('Preconference.Logout') }}
            </button>
          </div>
        </template>
      </TUIPopover>
    </div>

    <TUIDialog
      v-model:open="logoutOpen"
      width="380px"
      :title="t('Preconference.Logout')"
      :confirm-text="t('Preconference.Logout')"
      :cancel-text="t('Preclass.Cancel')"
      confirm-variant="primary"
      @confirm="confirmLogout"
    >
      <p class="pre-logout-desc">
        {{ t('Preclass.LogoutConfirm') }}
      </p>
    </TUIDialog>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { TUIDialog, TUIPopover, t } from '@tencentcloud/roomkit-web-vue3';

const props = defineProps<{
  userName?: string;
  avatarUrl?: string;
}>();

const emit = defineEmits<{
  logout: [];
}>();

const profileOpen = ref(false);
const logoutOpen = ref(false);

const displayName = computed(() => props.userName || t('Preconference.Welcome'));
const initial = computed(() => Array.from(displayName.value)[0]?.toUpperCase() ?? '');

function askLogout() {
  profileOpen.value = false;
  logoutOpen.value = true;
}

function confirmLogout() {
  logoutOpen.value = false;
  emit('logout');
}
</script>

<style scoped lang="scss">
.pre-topbar {
  position: relative;
  z-index: 20;
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 22px;
}

.pre-brand,
.pre-topbar-right {
  display: flex;
  align-items: center;
}

.pre-brand {
  gap: 10px;
}

.pre-brand-mark {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: var(--rk-on-accent);
  background: var(--rk-brand);
  border-radius: 8px;
}

.pre-brand-mark svg {
  width: 16px;
  height: 16px;
}

.pre-brand-name {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.pre-brand-name em {
  font-style: normal;
  font-weight: 700;
  color: var(--rk-brand);
}

.pre-topbar-right {
  gap: 14px;
}

.pre-who {
  display: flex;
  gap: 8px;
  align-items: center;
  height: 36px;
  padding: 0 10px 0 4px;
  font: inherit;
  font-size: 13px;
  color: var(--rk-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
}

.pre-who:hover,
.pre-who.is-open {
  color: var(--rk-text-primary);
  background: var(--rk-bg-hover);
}

.pre-who:focus-visible {
  outline: 2px solid var(--rk-brand);
  outline-offset: 2px;
}

.pre-who-name {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 650;
  color: var(--rk-brand);
  background: color-mix(in srgb, var(--rk-brand) 18%, var(--rk-bg-raised));
  border-radius: 999px;
}

.pre-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pre-profile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 240px;
  padding: 12px;
}

:global(.rk-popover:has(.pre-profile)) {
  border-radius: 12px;
}

.pre-profile-head {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.pre-profile-name {
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 600;
  color: var(--rk-text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-profile-logout {
  width: 100%;
  height: 32px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--rk-danger);
  cursor: pointer;
  background: color-mix(in srgb, var(--rk-danger) 12%, transparent);
  border: 0;
  border-radius: 8px;
}

.pre-profile-logout:hover {
  background: color-mix(in srgb, var(--rk-danger) 18%, transparent);
}

.pre-logout-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--rk-text-secondary);
}

@media (width <= 520px) {
  .pre-topbar {
    padding: 0 16px;
  }

  .pre-who-name {
    display: none;
  }
}
</style>
