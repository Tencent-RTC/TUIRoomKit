<!--
  * Name: IconButton
  * @param title String required
  * @param hasMore Boolean
  * @param hideHoverEffect Boolean
  * @param layout IconButtonLayout.VERTICAl | IconButtonLayout.HORIZONTAL
  * Usage:
  * Use <icon-button :icon="chatIcon"><icon-button> in template
  *
  * 名称: IconButton
  * @param title String required
  * @param hasMore Boolean
  * @param hideHoverEffect Boolean
  * @param layout IconButtonLayout.VERTICAl | IconButtonLayout.HORIZONTAL
  * 使用方式：
  * 在 template 中使用 <icon-button :icon="chatIcon"><icon-button>
-->
<template>
  <div class="icon-button-container">
    <div
      v-if="isMobile"
      @tap="handleClickEvent"
      :class="['icon-content', iconContentClass, `${disabled && 'disabled'}`]"
    >
      <slot></slot>
      <svg-icon style="display: flex" v-if="icon" :icon="icon"></svg-icon>
      <span class="title">{{ title }}</span>
    </div>
    <div
      v-else
      :class="['icon-content', iconContentClass, `${disabled && 'disabled'}`]"
      @click="$emit('click-icon')"
    >
      <slot></slot>
      <svg-icon style="display: flex" v-if="icon" :icon="icon"></svg-icon>
      <span class="title">{{ title }}</span>
    </div>
    <div v-if="hasMore" ref="moreSpanRef" class="icon-arrow" @click="$emit('click-more')">
      <svg-icon style="display: flex" :icon="ArrowUp"></svg-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';
import ArrowUp from '../../../assets/icons/ArrowUpIcon.svg';
import { IconButtonLayout } from '../../../constants/room';
import { computed } from 'vue';
import { isMobile } from '../../../utils/useMediaValue';
import type { Component } from 'vue';

interface Props {
  title: string,
  hasMore?: boolean,
  hideHoverEffect?: boolean,
  disabled?: boolean,
  isActive?: boolean,
  layout?: IconButtonLayout,
  icon?: Component | null,
}

const props = withDefaults(defineProps<Props>(), {
  icon: null,
  hasMore: false,
  hideHoverEffect: false,
  disabled: false,
  isActive: false,
  layout: IconButtonLayout.VERTICAl,
});

const emit = defineEmits(['click-icon', 'click-more']);

const iconContentClass = computed(() => {
  if (props.layout === IconButtonLayout.HORIZONTAL) {
    return 'icon-content-horizontal';
  };
  return 'icon-content-vertical';
});


const handleClickEvent = () => {
  emit('click-icon');
};

</script>

<style lang="scss" scoped>

.tui-theme-black .icon-button-container {
  --icon-button-hover: rgba(46, 50, 61, 0.70);
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
      opacity: 0.4;
    }
    &:hover {
      background: var(--icon-button-hover);
    }
  }
  .icon-content-horizontal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 6px;
    height: 32px;
    flex-direction: row;
    padding: 0 5px;
    .title {
      font-size: 14px;
      line-height: 26px;
      font-weight: 500;
      margin-left: 4px;
    }
  }
  .icon-content-vertical {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    height: 56px;
    min-width: 56px;
    padding: 5px;
    .title {
      font-size: 12px;
      line-height: 20px;
      font-weight: 400;
      margin-top: 4px;
    }
  }
  .icon-arrow {
    position: relative;
    width: 12px;
    height: 56px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 6px;
    &:hover {
      background: var(--icon-button-hover);
    }
  }
}

@media screen and (max-width: 600px) {
  .icon-box {
    width: 72px;
    &.hover-effect:hover {
      &:before{
        width: 72px;
      }
      &:after{
       width: 72px;
      }
    }
  }
}
</style>
