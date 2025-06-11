<!-- eslint-disable max-len -->
<template>
  <div class="logo-container">
    <!-- Logo under Chinese black theme on PC -->
    <div v-if="!isMobile && isZH && isDarkTheme">
      <IconLogoOfPCInChineseBlack style="width: 484px; height: 63px" />
    </div>
    <!-- Logo under Chinese white theme on PC -->
    <div v-if="!isMobile && isZH && isLightTheme">
      <IconLogoOfPCInChineseWhite style="width: 484px; height: 63px" />
    </div>
    <!-- Mobile Chinese black and white theme logo -->
    <div v-if="isMobile && isZH" class="mobile-zh-logo">
      <span class="logo" :class="isLightTheme ? 'light' : 'dark'">
        <IconLogoOfMobileInChinese style="width: 136px; height: 36px" />
      </span>
      <span class="title">
        <IconLogoTitleOfMobileInChinese style="width: 144px; height: 23px" />
      </span>
    </div>
    <!-- English black and white theme logo -->
    <div v-if="isEN" :class="['pc-en-logo', { mobile: isMobile }]">
      <span class="logo">
        <IconLogoInEnglish style="width: 68px; height: 63px" />
      </span>
      <span class="title" :class="isLightTheme ? 'light' : 'dark'">
        <IconLogoTitleInEnglish style="width: 271px; height: 35px" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  useUIKit,
  IconLogoOfPCInChineseBlack,
  IconLogoOfPCInChineseWhite,
  IconLogoOfMobileInChinese,
  IconLogoTitleOfMobileInChinese,
  IconLogoInEnglish,
  IconLogoTitleInEnglish,
} from '@tencentcloud/uikit-base-component-vue3';
import i18n from '../../locales/index';
import { isMobile } from '../../utils/environment';
import { computed } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';

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
