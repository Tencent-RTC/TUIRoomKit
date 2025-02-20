<!-- eslint-disable max-len -->
<template>
  <div class="logo-container">
    <!-- Logo under Chinese black theme on PC -->
    <div v-if="!isMobile && isZH && isDarkTheme">
      <svg-icon :icon="LogoOfPCInChineseBlackIcon" />
    </div>
    <!-- Logo under Chinese white theme on PC -->
    <div v-if="!isMobile && isZH && isLightTheme">
      <svg-icon :icon="LogoOfPCInChineseWhiteIcon" />
    </div>
    <!-- Mobile Chinese black and white theme logo -->
    <div v-if="isMobile && isZH" class="mobile-zh-logo">
      <span class="logo" :class="isLightTheme ? 'light' : 'dark'">
        <svg-icon :icon="LogoOfMobileInChinese" />
      </span>
      <span class="title">
        <svg-icon :icon="LogoTitleOfMobileInChinese" />
      </span>
    </div>
    <!-- English black and white theme logo -->
    <div v-if="isEN" :class="['pc-en-logo', { mobile: isMobile }]">
      <span class="logo">
        <svg-icon :icon="LogoInEnglish" />
      </span>
      <span class="title" :class="isLightTheme ? 'light' : 'dark'">
        <svg-icon :icon="LogoTitleInEnglish" />
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
import LogoOfPCInChineseBlackIcon from './icons/LogoOfPCInChineseBlackIcon.vue';
import LogoOfPCInChineseWhiteIcon from './icons/LogoOfPCInChineseWhiteIcon.vue';
import LogoOfMobileInChinese from './icons/LogoOfMobileInChinese.vue';
import LogoTitleOfMobileInChinese from './icons/LogoTitleOfMobileInChinese.vue';
import LogoInEnglish from './icons/LogoInEnglish.vue';
import LogoTitleInEnglish from './icons/LogoTitleInEnglish.vue';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';

const { theme } = useUIKit();
const basicStore = useBasicStore();
const { defaultTheme } = storeToRefs(basicStore);

const isEN = computed(() => i18n.global.locale.value === 'en-US');
const isZH = computed(() => i18n.global.locale.value === 'zh-CN');
const isDarkTheme = computed(() =>
  theme.value ? theme.value === 'dark' : defaultTheme.value === 'dark'
);
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
