<template>
  <RoomKitProvider class="login-host" scene="education">
    <div class="login-page">
      <TUIButton class="login-page-language" size="sm" @click="toggleLanguage">
        {{ language === 'en-US' ? 'English' : '中文' }}
      </TUIButton>
      <aside class="login-page-stage">
        <div class="login-page-stage-inner">
          <div class="login-page-mark">
            <img class="login-page-logo" :src="logoUrl" alt="" width="28" height="21" draggable="false">
            <span>TUIRoomKit</span>
          </div>
          <p class="login-page-brand">
            {{ t('Login.BrandLine') }}
          </p>
          <!-- Inlined so the fills follow --rk-brand -->
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="login-page-art" aria-hidden="true" v-html="loginArtSvg" />
        </div>
      </aside>
      <section class="login-page-card">
        <div class="login-page-mark login-page-card-mark">
          <img class="login-page-logo" :src="logoUrl" alt="" width="28" height="21" draggable="false">
          <span>TUIRoomKit</span>
        </div>
        <h1 class="login-page-title">
          {{ t('Login.Title') }}
        </h1>
        <p class="login-page-lead">
          {{ lead || t('Login.LeadUserId') }}
        </p>
        <div class="login-page-body">
          <slot />
        </div>
      </section>
    </div>
  </RoomKitProvider>
</template>

<script setup lang="ts">
import { RoomKitProvider, TUIButton, i18n, useI18n } from '@tencentcloud/roomkit-web-vue3';
import loginArtSvg from '../../assets/login-art.svg?raw';
import logoUrl from '../../assets/logo.png';

defineProps<{
  /** Line under the title; defaults to the UserID-only copy. */
  lead?: string;
}>();

const { t, language } = useI18n();

function toggleLanguage() {
  const next = language.value === 'en-US' ? 'zh-CN' : 'en-US';
  i18n.changeLanguage(next);
}
</script>

<style lang="scss" scoped>
.login-host,
.login-host :deep(.rk-root-slot) {
  width: 100%;
  height: 100%;
}

.login-page {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  font-family: var(--rk-font);
  color: var(--rk-text-primary);
  background: var(--rk-bg-surface);
}

.login-page-language {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}

.login-page-stage {
  display: flex;
  flex: 1.08;
  align-items: center;
  justify-content: center;
  padding: 56px;
  background:
    radial-gradient(90% 70% at 12% 88%, color-mix(in srgb, var(--rk-brand) 26%, transparent), transparent 58%),
    radial-gradient(70% 55% at 88% 8%, color-mix(in srgb, var(--rk-brand) 14%, transparent), transparent 52%),
    var(--rk-bg-page);
}

.login-page-stage-inner {
  width: min(420px, 100%);
}

.login-page-mark {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: var(--rk-fs-lg);
  font-weight: 650;
  letter-spacing: -0.03em;
}

.login-page-logo {
  display: block;
  width: 28px;
  height: 21px;
}

.login-page-brand {
  max-width: 16em;
  margin: 18px 0 0;
  font-size: 32px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.045em;
}

.login-page-art {
  display: block;
  width: min(360px, 100%);
  margin-top: 24px;
  color: #2c2c2c;

  :deep(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
}

/* Top-anchored near the visual center: the two panels differ in height, and centering would make the title jump on tab switch */
.login-page-card {
  display: flex;
  flex: 0.92;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-width: 0;
  padding: max(64px, calc(50vh - 260px)) 56px 48px;
}

.login-page-card-mark {
  display: none;
}

.login-page-title,
.login-page-lead,
.login-page-body {
  width: min(360px, 100%);
}

.login-page-title,
.login-page-lead {
  text-align: center;
}

.login-page-title {
  margin: 22px 0 0;
  font-size: 32px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.04em;
}

.login-page-lead {
  margin: 8px 0 0;
  font-size: var(--rk-fs-md);
  line-height: 20px;
  color: var(--rk-text-secondary);
}

.login-page-body {
  margin-top: 28px;
}

@media (width <= 767px) {
  .login-page {
    flex-direction: column;
    padding: 72px 28px 40px;
  }

  .login-page-stage {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 1;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 0 16px 22px;
    pointer-events: none;
    background: none;

    .login-page-mark {
      display: none;
    }
  }

  .login-page-stage-inner {
    width: min(228px, 64%);
  }

  .login-page-brand {
    display: none;
  }

  .login-page-art {
    width: 100%;
    margin: 0;
  }

  .login-page-card {
    flex: 1;
    align-items: stretch;
    padding: 0 0 108px;
  }

  /* Same top inset and height as the language button, so both sit on one line */
  .login-page-card-mark {
    position: absolute;
    top: 24px;
    left: 24px;
    display: flex;
    height: var(--rk-control-sm);
  }

  .login-page-title,
  .login-page-lead,
  .login-page-body {
    width: auto;
  }

  .login-page-title {
    margin-top: 100px;
    font-size: var(--rk-fs-2xl);
  }
}
</style>
