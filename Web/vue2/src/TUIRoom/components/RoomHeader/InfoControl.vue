<!--
  * Name: infoControl
  * Usage:
  * Use <info-control /> in template
  *
  * 名称: infoControl
  * 使用方式：
  * 在 template 中使用 <info-control />
-->
<template>
  <div class="info-container">
    <svg-icon
      class="layout-icon"
      icon-name="info"
      size="medium"
      @click.stop="handleClickInfoIcon"
    ></svg-icon>
    <div ref="infoRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';

const showInfoTab = ref(false);
const infoRef:Ref<Node | undefined> = ref(undefined);

function handleClickInfoIcon() {
  if (!showInfoTab.value) {
    showInfoTab.value = true;
    document.addEventListener('click', handleDocumentClick, false);
  } else {
    document.removeEventListener('click', handleDocumentClick, false);
    showInfoTab.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (showInfoTab.value && infoRef.value && !infoRef.value.contains(event.target as Node)) {
    document.removeEventListener('click', handleDocumentClick);
    showInfoTab.value = false;
  }
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.info-container {
  position: relative;
  width: 20px;
  height: 20px;
  .layout-icon {
    cursor: pointer;
  }
  .layout-list {
    position: absolute;
    top: 47px;
    right: 0;
    background-color: $toolBarBackgroundColor;
    box-shadow: 0 1px 10px 0 rgba(0,0,0,0.30);
    border-radius: 4px;
    padding: 20px;
    display: flex;
    .layout-item {
      width: 180px;
      height: 133px;
      padding: 20px 30px 39px;
      background-color: $primaryColor;
      border-radius: 2px;
      border: 1px solid transparent;
      cursor: pointer;
      position: relative;
      &:not(:first-child) {
        margin-left: 20px;
      }
      &:hover {
        border: 1px solid $primaryHighLightColor;
        border-radius: 2px;
      }
      &.checked {
        border: 1px solid $primaryHighLightColor;
        border-radius: 2px;
        &:after {
          content: '';
          display: block;
          width: 20px;
          height: 20px;
          background-image: url('../../assets/imgs/checked.png');
          background-size: 100% 100%;
          position: absolute;
          top: 0;
          right: 0;
        }
      }
      .layout-block-container {
        width: 120px;
        height: 74px;
      }
      .layout-title {
        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        display: inline-block;
        margin-top: 10px;
        width: 100%;
        text-align: center;
      }
    }
    .layout1 {
      .layout-block-container {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-content: space-between;
        .layout-block {
          width: 38px;
          height: 22px;
          background-color: $layoutBlockColor;
        }
      }
    }
    .layout2 {
      .layout-block-container {
        display: flex;
        justify-content: space-between;
        .left-container {
          width: 90px;
          height: 74px;
          background-color: $layoutBlockColor;
        }
        .right-container {
          width: 27px;
          height: 74px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-content: space-between;
          > div {
            width: 27px;
            height: 16px;
            background-color: $layoutBlockColor;
          }
        }
      }
    }
    .layout3 {
      .layout-block-container {
        display: flex;
        flex-wrap: wrap;
        align-content: space-between;
        .top-container {
          width: 120px;
          height: 16px;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-content: space-between;
          > div {
            width: 28px;
            height: 16px;
            background-color: $layoutBlockColor;
          }
        }
        .bottom-container {
          width: 120px;
          height: 55px;
          background-color: $layoutBlockColor;
        }
      }
    }
  }
}
</style>
