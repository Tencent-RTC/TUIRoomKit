<!--
  * Name: IconButton
  * @param title String required
  * @param hasMore Boolean
  * @param hideHoverEffect Boolean
  * @param layout IconButtonLayout.VERTICAl | IconButtonLayout.HORIZONTAL
  * Usage:
  * Use <icon-button :icon="chatIcon"><icon-button> in template
-->
<template>
  <div :class="[themeClass]">
    <div class="icon-button-container">
      <div
        v-if="isMobile"
        v-tap="handleClickEvent"
        :class="['icon-content', iconContentClass, `${disabled && 'disabled'}`]"
      >
        <slot></slot>
        <svg-icon v-if="icon" :icon="icon" />
        <span class="title">{{ title }}</span>
      </div>
      <div
        v-else
        :class="['icon-content', iconContentClass, `${disabled && 'disabled'}`]"
        @click="handleClickEvent"
      >
        <slot></slot>
        <svg-icon v-if="icon" :icon="icon" />
        <svg-icon
          v-if="isNotSupport"
          class="unsupport-icon"
          :icon="UnSupportIcon"
        />
        <span class="title">
          {{ title }}
          <slot name="title"></slot>
        </span>
      </div>
      <div
        v-if="hasMore"
        ref="moreSpanRef"
        class="icon-arrow"
        @click="$emit('click-more')"
      >
        <svg-icon :icon="ArrowUp" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';
import ArrowUp from '../icons/ArrowUpIcon.vue';
import { IconButtonLayout } from '../../../constants/room';
import { computed } from 'vue';
import { isMobile } from '../../../utils/environment';
import UnSupportIcon from '../icons/UnSupportIcon.vue';
import vTap from '../../../directives/vTap';
import type { Component } from 'vue';

interface Props {
  title?: string;
  hasMore?: boolean;
  hideHoverEffect?: boolean;
  disabled?: boolean;
  isActive?: boolean;
  layout?: IconButtonLayout;
  icon?: Component | null;
  isNotSupport?: boolean;
  theme?: 'white' | 'black';
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  icon: null,
  hasMore: false,
  hideHoverEffect: false,
  disabled: false,
  isActive: false,
  layout: IconButtonLayout.VERTICAl,
  isNotSupport: false,
  theme: undefined,
});
const emit = defineEmits(['click-icon', 'click-more']);

const themeClass = computed(() =>
  props.theme ? `tui-theme-${props.theme}` : ''
);

const iconContentClass = computed(() => {
  if (props.layout === IconButtonLayout.HORIZONTAL) {
    return 'icon-content-horizontal';
  }
  return 'icon-content-vertical';
});

const handleClickEvent = () => {
  emit('click-icon');
};
</script>

<style lang="scss" scoped>
.tui-theme-black .icon-button-container {
  --icon-button-hover: rgba(46, 50, 61, 0.7);
}

.tui-theme-white .icon-button-container {
  --icon-button-hover: rgba(79, 88, 107, 0.05);
}

.icon-button-container {
  position: relative;
  display: flex;
  align-items: center;
  color: var(--font-color-1);
  cursor: pointer;

  .icon-content {
    &.disabled {
      cursor: not-allowed;
      opacity: 0.4;
    }

    &:hover {
      background: var(--icon-button-hover);
    }
  }

  .icon-content-horizontal {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    padding: 0 5px;
    border-radius: 6px;

    .title {
      margin-left: 4px;
      font-size: 14px;
      font-weight: 500;
      line-height: 26px;
    }
  }

  .icon-content-vertical {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    height: 56px;
    padding: 5px;
    border-radius: 6px;

    .title {
      margin-top: 4px;
      font-size: 12px;
      font-weight: 400;
      line-height: 20px;
    }
  }

  .icon-arrow {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 56px;
    border-radius: 6px;

    &:hover {
      background: var(--icon-button-hover);
    }
  }
}

.unsupport-icon {
  position: absolute;
  top: 13px;
  left: 26px;
}

@media screen and (width <= 600px) {
  .icon-box {
    width: 72px;

    &.hover-effect:hover {
      &::before {
        width: 72px;
      }

      &::after {
        width: 72px;
      }
    }
  }
}
</style>
