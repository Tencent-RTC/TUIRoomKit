<!-- eslint-disable max-len -->
<template>
  <div class="logo-container">
    <!-- Logo under Chinese black theme on PC -->
    <div v-if="!isMobile && isZH && isBlackTheme">
      <svg-icon style="display: flex" :icon="LogoOfPCInChineseBlackIcon"></svg-icon>
    </div>
    <!-- Logo under Chinese white theme on PC -->
    <div v-if="!isMobile && isZH && isWhiteTheme">
      <svg-icon style="display: flex" :icon="LogoOfPCInChineseWhiteIcon"></svg-icon>
    </div>
    <!-- Mobile Chinese black and white theme logo -->
    <div v-if="isMobile && isZH" class="mobile-zh-logo">
      <span class="logo" :class="isWhiteTheme ? 'white' : 'black'">
        <svg-icon style="display: flex" :icon="LogoOfMobileInChinese"></svg-icon>
      </span>
      <span class="title">
        <svg-icon style="display: flex" :icon="LogoTitleOfMobileInChinese"></svg-icon>
      </span>
    </div>
    <!-- English black and white theme logo -->
    <div v-if="isEN" :class="['pc-en-logo', { 'mobile': isMobile }]">
      <span class="logo">
        <svg-icon style="display: flex" :icon="LogoInEnglish"></svg-icon>
      </span>
      <span class="title" :class="isWhiteTheme ? 'white' : 'black'">
        <svg-icon style="display: flex" :icon="LogoTitleInEnglish"></svg-icon>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import i18n from '../../locales/index';
import { isMobile } from '../../utils/environment';
import { computed } from 'vue';
import { useBasicStore } from '../../stores/basic';
import { storeToRefs } from 'pinia';
import SvgIcon from './base/SvgIcon.vue';
import LogoOfPCInChineseBlackIcon from '../../assets/icons/LogoOfPCInChineseBlackIcon.svg';
import LogoOfPCInChineseWhiteIcon from '../../assets/icons/LogoOfPCInChineseWhiteIcon.svg';
import LogoOfMobileInChinese from '../../assets/icons/LogoOfMobileInChinese.svg';
import LogoTitleOfMobileInChinese from '../../assets/icons/LogoTitleOfMobileInChinese.svg';
import LogoInEnglish from '../../assets/icons/LogoInEnglish.svg';
import LogoTitleInEnglish from '../../assets/icons/LogoTitleInEnglish.svg';

const basicStore = useBasicStore();

const { defaultTheme } = storeToRefs(basicStore);

const isEN = computed(() => i18n.global.locale.value === 'en-US');
const isZH = computed(() => i18n.global.locale.value === 'zh-CN');
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
