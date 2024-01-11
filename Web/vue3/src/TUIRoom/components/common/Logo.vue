<!-- eslint-disable max-len -->
<template>
  <div class="logo-container">
    <!-- PC 端中文黑色主题下 logo -->
    <div v-if="!isMobile && isZH && isBlackTheme">
      <svg-icon :icon="LogoOfPCInChineseBlackIcon"></svg-icon>
    </div>
    <!-- PC 端中文白色主题下 logo -->
    <div v-if="!isMobile && isZH && isWhiteTheme">
      <svg-icon :icon="LogoOfPCInChineseWhiteIcon"></svg-icon>
    </div>
    <!-- 移动端中文黑白主题 logo -->
    <div v-if="isMobile && isZH" class="mobile-zh-logo">
      <span class="logo" :class="isWhiteTheme ? 'white' : 'black'">
        <svg-icon :icon="LogoOfMobileInChinese"></svg-icon>
      </span>
      <span class="title">
        <svg-icon :icon="LogoTitleOfMobileInChinese"></svg-icon>
      </span>
    </div>
    <!-- 英文黑白主题 logo -->
    <div v-if="isEN" :class="['pc-en-logo', { 'mobile': isMobile }]">
      <span class="logo">
        <svg-icon :icon="LogoInEnglish"></svg-icon>
      </span>
      <span class="title" :class="isWhiteTheme ? 'white' : 'black'">
        <svg-icon :icon="LogoTitleInEnglish"></svg-icon>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import i18n from '../../locales/index';
import { isMobile, isWeChat } from '../../utils/environment';
import { computed } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import SvgIcon from './base/SvgIcon.vue';
import LogoOfPCInChineseBlackIcon from './icons/LogoOfPCInChineseBlackIcon.vue';
import LogoOfPCInChineseWhiteIcon from './icons/LogoOfPCInChineseWhiteIcon.vue';
import LogoOfMobileInChinese from './icons/LogoOfMobileInChinese.vue';
import LogoTitleOfMobileInChinese from './icons/LogoTitleOfMobileInChinese.vue';
import LogoInEnglish from './icons/LogoInEnglish.vue';
import LogoTitleInEnglish from './icons/LogoTitleInEnglish.vue';

const basicStore = useBasicStore();

const { defaultTheme } = storeToRefs(basicStore);

const isEN = computed(() => !isWeChat && i18n.global.locale.value === 'en-US');
const isZH = computed(() => isWeChat || i18n.global.locale.value === 'zh-CN');
const isBlackTheme = computed(() => defaultTheme.value === 'black');
const isWhiteTheme = computed(() => defaultTheme.value === 'white');

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
    color: #202C40;
  }
  .black {
    color: #D5E0F2;
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
    color: #000000;
  }
  .black {
    color: #FFFFFF;
  }
}
</style>
