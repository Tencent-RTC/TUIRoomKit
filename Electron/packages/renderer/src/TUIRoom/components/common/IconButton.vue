<!--
  * Name: IconButton
  * @param title String required
  * @param iconName String required
  * @param hasMore Boolean
  * @param hideHoverEffect Boolean
  * Usage:
  * Use <icon-button /> in template
  *
  * 名称: IconButton
  * @param title String required
  * @param iconName String required
  * @param hasMore Boolean
  * @param hideHoverEffect Boolean
  * 使用方式：
  * 在 template 中使用 <icon-button />
-->
<template>
  <div :class="['icon-box', `${!hideHoverEffect && 'hover-effect'}`, `${disabled && 'disabled'}`]">
    <span class="icon-content" @click="$emit('clickIcon')">
      <svg-icon v-if="iconName" :icon-name="iconName" />
      <slot></slot>
      <span class="title">{{ title }}</span>
    </span>
    <span v-if="hasMore" ref="moreSpanRef" class="icon-arrow" @click="$emit('clickMore')">
      <svg-icon class="arrow" icon-name="arrow-up" size="small" />
    </span>
  </div>
</template>

<script setup lang="ts">
import SvgIcon from '../common/SvgIcon.vue';

interface Props {
  title: string,
  iconName?: string,
  hasMore?: boolean,
  hideHoverEffect?: boolean,
  disabled?: boolean,
}

defineProps<Props>();
defineEmits(['clickIcon', 'clickMore']);

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.icon-box {
  width: 78px;
  height: 80px;
  position: relative;
  display: flex;
  cursor: pointer;
  padding: 10px 0;
  &.disabled {
    * {
      color: $disabledColor;
    }
  }
  &.hover-effect:hover {
    &:before{
      content: '';
      display: block;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 78px;
      height: 18px;
      opacity: 0.59;
      background: $activeBlurBackgroundColor;
      filter: blur(16px);
    }
    &:after{
      content: '';
      display: block;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 78px;
      height: 3px;
      background: $activeStateColor;
    }
  }
  .icon-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    .title {
      font-size: 12px;
    }
  }
  .icon-arrow {
    position: absolute;
    right: 0;
    top: 8px;
    width: 12px;
    height: 64px;
    &:hover {
      background: rgba(46,50,61,0.70);
    }
    .arrow {
      position: absolute;
      top: 20px;
      left: 0;
    }
  }
}
</style>
