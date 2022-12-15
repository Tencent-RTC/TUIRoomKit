<!--
  * Name: LayoutControl
  * Usage:
  * Use <layout-control /> in template
  *
  * 名称: LayoutControl
  * 使用方式：
  * 在 template 中使用 <layout-control />
-->
<template>
  <div v-if="streamNumber > 1" class="layout-container">
    <svg-icon
      class="layout-icon"
      icon-name="layout"
      size="medium"
      @click.stop="handleClickLayoutIcon"
    ></svg-icon>
    <div v-if="showLayoutList" ref="layoutList" class="layout-list">
      <!--
        *Sidebar and upper sidebar arrows
        *
        *侧边栏和上边栏箭头
      -->
      <div
        :class="['layout1', 'layout-item', `${layout === LAYOUT.NINE_EQUAL_POINTS ? 'checked' : ''}`]"
        @click="handleClick(LAYOUT.NINE_EQUAL_POINTS)"
      >
        <div class="layout-block-container">
          <div
            v-for="(item, index) in new Array(9).fill('')"
            :key="index"
            class="layout-block"
          >
          </div>
        </div>
        <span class="layout-title">{{ t('Grid') }}</span>
      </div>
      <!--
        *Right side member list
        *
        *右侧成员列表
      -->
      <div
        :class="['layout2', 'layout-item', `${layout === LAYOUT.RIGHT_SIDE_LIST ? 'checked' : ''}`]"
        @click="handleClick(LAYOUT.RIGHT_SIDE_LIST)"
      >
        <div class="layout-block-container">
          <div class="left-container"></div>
          <div class="right-container">
            <div
              v-for="(item, index) in new Array(4).fill('')"
              :key="index"
              class="layout-block"
            >
            </div>
          </div>
        </div>
        <span class="layout-title">{{ t('Gallery on right') }}</span>
      </div>
      <!--
        *Top Member List
        *
        *顶部成员列表
      -->
      <div
        :class="['layout3', 'layout-item', `${layout === LAYOUT.TOP_SIDE_LIST ? 'checked' : ''}`]"
        @click="handleClick(LAYOUT.TOP_SIDE_LIST)"
      >
        <div class="layout-block-container">
          <div class="top-container">
            <div
              v-for="(item, index) in new Array(4).fill('')"
              :key="index"
              class="layout-block"
            >
            </div>
          </div>
          <div class="bottom-container"></div>
        </div>
        <span class="layout-title">{{ t('Gallery at top') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref } from 'vue';
import SvgIcon from '../common/SvgIcon.vue';
import { LAYOUT } from '../../constants/render';
import { useBasicStore } from '../../stores/basic';
import { useRoomStore } from '../../stores/room';
import { storeToRefs } from 'pinia';
import TUIRoomAegis from '../../utils/aegis';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { streamNumber } = storeToRefs(roomStore);

const showLayoutList:Ref<boolean> = ref(false);
const layoutList:Ref<Node|null> = ref(null);

function handleClick(layout: any) {
  basicStore.setLayout(layout);
  TUIRoomAegis.reportEvent({ name: 'layout', ext1: layout });
}

function handleClickLayoutIcon() {
  if (!showLayoutList.value) {
    showLayoutList.value = true;
    document.addEventListener('click', handleDocumentClick, false);
  } else {
    document.removeEventListener('click', handleDocumentClick, false);
    showLayoutList.value = false;
  }
}

function handleDocumentClick(event: MouseEvent) {
  if (showLayoutList.value && layoutList.value && !layoutList.value.contains(event.target as Node)) {
    document.removeEventListener('click', handleDocumentClick);
    showLayoutList.value = false;
  }
}

</script>

<style lang="scss" scoped>
@import '../../assets/style/var.scss';

.layout-container {
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
