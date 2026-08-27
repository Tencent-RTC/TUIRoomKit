<!-- eslint-disable max-len -->
<template>
  <div class="logo-container">
    <!-- Mobile Chinese black and white theme logo -->
    <div v-if="isMobile && isZH" class="mobile-zh-logo">
      <span class="logo" :class="isLightTheme ? 'light' : 'dark'">
        <svg-icon style="display: flex" :icon="LogoOfMobileInChinese" />
      </span>
      <span class="title">
        <svg-icon style="display: flex" :icon="LogoTitleOfMobileInChinese" />
      </span>
    </div>
    <!-- English black and white theme logo -->
    <div v-if="isEN" :class="['pc-en-logo', { mobile: isMobile }]">
      <span class="logo">
        <svg-icon style="display: flex" :icon="LogoInEnglish" />
      </span>
      <span class="title" :class="isLightTheme ? 'light' : 'dark'">
        <svg-icon style="display: flex" :icon="LogoTitleInEnglish" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import i18n from '../../locales/index';
import { isMobile } from '../../utils/environment';
import { computed } from 'vue';
import SvgIcon from './base/SvgIcon.vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import LogoOfMobileInChinese from '../../assets/icons/LogoOfMobileInChinese.svg';
import LogoTitleOfMobileInChinese from '../../assets/icons/LogoTitleOfMobileInChinese.svg';
import LogoInEnglish from '../../assets/icons/LogoInEnglish.svg';
import LogoTitleInEnglish from '../../assets/icons/LogoTitleInEnglish.svg';
import { useUIKit } from '@tencentcloud/uikit-base-component-uni';

const { theme } = useUIKit();
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);

const isEN = computed(() => i18n.global.locale.value === 'en-US');
const isZH = computed(() => i18n.global.locale.value === 'zh-CN');
const isLightTheme = computed(() =>
  theme.value ? theme.value === 'light' : defaultTheme.value === 'light'
);
</script>

<style lang="scss" scoped>
.pc-en-logo {
  display: flex;
  align-items: center;
  transform: scale(0.9);

  .title {
    margin-left: 10px;
  }

  .white {
    color: var(--uikit-color-black-2);
  }

  .black {
    color: var(--uikit-color-white-2);
  }

  &.mobile {
    transform: scale(0.6);
  }
}

.mobile-zh-logo {
  display: flex;
  flex-direction: column;

  .logo {
    margin-bottom: 7px;
  }

  .white {
    color: var(--uikit-color-black-1);
  }

  .black {
    color: var(--uikit-color-white-1);
  }
}
</style>
