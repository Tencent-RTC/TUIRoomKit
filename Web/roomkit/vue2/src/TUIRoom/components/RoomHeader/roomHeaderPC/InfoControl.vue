<!--
  * Name: infoControl
  * Usage:
  * Use <info-control /> in template
  *
-->
<template>
  <div class="info-container">
    <svg-icon
      class="layout-icon"
      icon-name="info"
      size="medium"
      @click.stop="handleClickInfoIcon"
    />
    <div ref="infoRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import SvgIcon from '../../common/base/SvgIcon.vue';

const showInfoTab = ref(false);
const infoRef: Ref<Node | undefined> = ref(undefined);

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
  if (
    showInfoTab.value &&
    infoRef.value &&
    !infoRef.value.contains(event.target as Node)
  ) {
    document.removeEventListener('click', handleDocumentClick);
    showInfoTab.value = false;
  }
}
</script>

<style lang="scss" scoped>
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
    display: flex;
    padding: 20px;
    background-color: $toolBarBackgroundColor;
    border-radius: 4px;
    box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.3);

    .layout-item {
      position: relative;
      width: 180px;
      height: 133px;
      padding: 20px 30px 39px;
      cursor: pointer;
      background-color: $primaryColor;
      border: 1px solid transparent;
      border-radius: 2px;

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

        &::after {
          position: absolute;
          top: 0;
          right: 0;
          display: block;
          width: 20px;
          height: 20px;
          content: '';
          background-image: url('../../assets/imgs/checked.png');
          background-size: 100% 100%;
        }
      }

      .layout-block-container {
        width: 120px;
        height: 74px;
      }

      .layout-title {
        display: inline-block;
        width: 100%;
        margin-top: 10px;
        font-size: 16px;
        font-weight: 400;
        line-height: 24px;
        text-align: center;
      }
    }

    .layout1 {
      .layout-block-container {
        display: flex;
        flex-wrap: wrap;
        place-content: space-between space-between;

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
          display: flex;
          flex-wrap: wrap;
          place-content: space-between space-between;
          width: 27px;
          height: 74px;

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
          display: flex;
          flex-wrap: wrap;
          place-content: space-between space-between;
          width: 120px;
          height: 16px;

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
