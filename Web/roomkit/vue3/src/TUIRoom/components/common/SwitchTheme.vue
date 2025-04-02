<!--
  * Name: Switchtheme
  * Usage:
  * Use <switch-theme /> in template
  *
-->
<template>
  <div class="theme-container" v-click-outside="handleClickOutSide">
    <icon-button
      v-if="visible && switchThemeConfig.visible"
      :title="t('Switch Theme')"
      :layout="IconButtonLayout.HORIZONTAL"
      :icon="SwitchThemeIcon"
      @click-icon="handleSwitchTheme"
    />
    <div
      v-if="isShowThemeColorContainer && !isMobile"
      class="switch-theme-container"
    >
      <div class="switch-theme-item">
        <span>{{ t('Theme Colours') }}</span>
        <div class="color-blocks two-blocks">
          <div
            :class="['color-block black', { active: currentTheme === 'dark' }]"
            @click="toggleCustomTheme('dark')"
          ></div>
          <div
            :class="['color-block white', { active: currentTheme === 'light' }]"
            @click="toggleCustomTheme('light')"
          ></div>
        </div>
      </div>
      <div class="switch-theme-item">
        <span>{{ t('Custom Themes') }}</span>
        <div class="color-blocks four-blocks">
          <div
            :class="[
              'color-block theme',
              { active: currentCustomTheme === 'theme' },
            ]"
            @click="toggleCustomTheme('theme')"
          ></div>
          <div
            :class="[
              'color-block green',
              { active: currentCustomTheme === 'green' },
            ]"
            @click="toggleCustomTheme('green')"
          ></div>
          <div
            :class="[
              'color-block red',
              { active: currentCustomTheme === 'red' },
            ]"
            @click="toggleCustomTheme('red')"
          ></div>
          <div
            :class="[
              'color-block orange',
              { active: currentCustomTheme === 'orange' },
            ]"
            @click="toggleCustomTheme('orange')"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults, defineProps, ref, computed } from 'vue';
import IconButton from './base/IconButton.vue';
import SwitchThemeIcon from './icons/SwitchThemeIcon.vue';
import { IconButtonLayout } from '../../constants/room';
import { useI18n } from '../../locales';
import { roomService } from '../../services';
import { useBasicStore } from '../../stores/basic';
import { useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { Theme } from '../../services/manager/configManager';
import { isMobile } from '../../utils/environment';
import vClickOutside from '../../directives/vClickOutside';

const { t } = useI18n();
const basicStore = useBasicStore();
const { theme, setTheme } = useUIKit();
const isShowThemeColorContainer = ref(false);
const switchThemeConfig = roomService.getComponentConfig('SwitchTheme');
const currentCustomTheme = ref('theme');
const currentTheme = computed(() => theme.value || basicStore.defaultTheme);

interface Props {
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  visible: true,
});

function handleSwitchTheme() {
  if (!isMobile) {
    isShowThemeColorContainer.value = !isShowThemeColorContainer.value;
    return;
  }
  const newTheme = currentTheme.value === 'light' ? 'dark' : 'light';
  theme.value ? setTheme(newTheme) : roomService.setTheme(newTheme);
}

function toggleCustomTheme(newTheme: string) {
  if (!theme.value) {
    roomService.setTheme(newTheme as Theme);
    return;
  }

  const isBaseTheme = newTheme === 'light' || newTheme === 'dark';
  const themeConfig = isBaseTheme
    ? newTheme
    : { themeStyle: theme.value, primaryColor: newTheme };
  setTheme(themeConfig);

  if (!isBaseTheme) {
    currentCustomTheme.value = newTheme;
  }
}

function handleClickOutSide() {
  if (isShowThemeColorContainer.value) {
    isShowThemeColorContainer.value = false;
  }
}
</script>

<style lang="scss" scoped>
.theme-container {
  position: relative;
  .switch-theme-container {
    position: absolute;
    top: calc(100% + 15px);
    left: 0px;
    padding: 14px;
    z-index: 9;
    background: var(--bg-color-input);
    filter: drop-shadow(0px 0px 4px var(--uikit-color-black-8))
      drop-shadow(0px 4px 10px var(--uikit-color-black-8))
      drop-shadow(0px 1px 14px var(--uikit-color-black-8));
    border-radius: 8px;

    .switch-theme-item {
      font-size: 14px;
      color: var(--text-color-secondary);
      .color-blocks {
        display: flex;
        margin: 16px 0;
        &.two-blocks {
          .color-block {
            width: 50px;
            height: 50px;
            margin-right: 8px;
          }
        }
        &.four-blocks {
          .color-block {
            width: 50px;
            height: 50px;
            margin-right: 8px;
          }
        }
      }
      .color-block {
        cursor: pointer;
        border-radius: 6px;
        &.active {
          outline-offset: 2px;
        }
        &.black {
          background-color: var(--uikit-color-black-1);
          &.active {
            outline: 1px solid var(--uikit-color-theme-6);
          }
        }
        &.white {
          background-color: var(--uikit-color-white-1);
          &.active {
            outline: 1px solid var(--uikit-color-theme-6);
          }
        }
        &.red {
          background-color: var(--uikit-color-red-6);
          &.active {
            outline: 1px solid var(--uikit-color-red-6);
          }
        }
        &.green {
          background-color: var(--uikit-color-green-6);
          &.active {
            outline: 1px solid var(--uikit-color-green-6);
          }
        }
        &.orange {
          background-color: var(--uikit-color-orange-6);
          &.active {
            outline: 1px solid var(--uikit-color-orange-6);
          }
        }
        &.theme {
          background-color: var(--uikit-color-theme-6);
          &.active {
            outline: 1px solid var(--uikit-color-theme-6);
          }
        }
      }
    }
  }

  .h5.switch-theme-container {
    display: flex;
    padding: 6px 4px;
    .switch-theme-item {
      margin: 0 12px;
      .color-blocks {
        .color-block {
          width: 10px;
          height: 10px;
          margin-right: 8px;
        }
      }
    }
    span {
      white-space: nowrap;
    }
  }
}
</style>
