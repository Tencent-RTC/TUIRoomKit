<!--
  * Name: LayoutControl
  * Usage:
  * Use <layout-control /> in template
  *
-->
<template>
  <div
    v-if="layoutControlConfig.visible"
    v-click-outside="handleClickOutSide"
    class="layout-container"
  >
    <icon-button
      :title="t('Layout')"
      :disabled="isStreamNumberLessThanTwo"
      :layout="IconButtonLayout.HORIZONTAL"
      @click-icon="handleClickLayoutIcon"
    >
      <IconLayout size="20" />
    </icon-button>
    <div v-if="showLayoutList" class="layout-list">
      <!--
        * Sidebar and upper sidebar arrows
        *
      -->
      <div
        :class="[
          'layout1',
          'layout-item',
          `${layout === LAYOUT.NINE_EQUAL_POINTS ? 'checked' : ''}`,
        ]"
        @click="handleClick(LAYOUT.NINE_EQUAL_POINTS)"
      >
        <div class="layout-block-container">
          <div
            v-for="(item, index) in new Array(9).fill('')"
            :key="index"
            class="layout-block"
          ></div>
        </div>
        <span class="layout-title">{{ t('Grid') }}</span>
      </div>
      <!--
        * Right side member list
        *
      -->
      <div
        :class="[
          'layout2',
          'layout-item',
          `${layout === LAYOUT.RIGHT_SIDE_LIST ? 'checked' : ''}`,
        ]"
        @click="handleClick(LAYOUT.RIGHT_SIDE_LIST)"
      >
        <div class="layout-block-container">
          <div class="left-container"></div>
          <div class="right-container">
            <div
              v-for="(item, index) in new Array(3).fill('')"
              :key="index"
              class="layout-block"
            ></div>
          </div>
        </div>
        <span class="layout-title">{{ t('Gallery on right') }}</span>
      </div>
      <!--
        * Top Member List
        *
      -->
      <div
        :class="[
          'layout3',
          'layout-item',
          `${layout === LAYOUT.TOP_SIDE_LIST ? 'checked' : ''}`,
        ]"
        @click="handleClick(LAYOUT.TOP_SIDE_LIST)"
      >
        <div class="layout-block-container">
          <div class="top-container">
            <div
              v-for="(item, index) in new Array(3).fill('')"
              :key="index"
              class="layout-block"
            ></div>
          </div>
          <div class="bottom-container"></div>
        </div>
        <span class="layout-title">{{ t('Gallery at top') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, computed } from 'vue';
import { LAYOUT } from '../../../constants/render';
import { useBasicStore } from '../../../stores/basic';
import { useRoomStore } from '../../../stores/room';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import { IconButtonLayout } from '../../../constants/room';
import IconButton from '../../common/base/IconButton.vue';
import { IconLayout } from '@tencentcloud/uikit-base-component-vue3';
import vClickOutside from '../../../directives/vClickOutside';
import { roomService } from '../../../services';

const { t } = useI18n();

const basicStore = useBasicStore();
const { layout } = storeToRefs(basicStore);
const roomStore = useRoomStore();
const { streamNumber } = storeToRefs(roomStore);

const showLayoutList: Ref<boolean> = ref(false);
const isStreamNumberLessThanTwo = computed(() => streamNumber.value < 2);
const layoutControlConfig = roomService.getComponentConfig('LayoutControl');

function handleClick(layout: any) {
  basicStore.setLayout(layout);
}

function handleClickLayoutIcon() {
  if (isStreamNumberLessThanTwo.value) {
    return;
  }
  showLayoutList.value = !showLayoutList.value;
}

function handleClickOutSide() {
  if (showLayoutList.value) {
    showLayoutList.value = false;
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  position: relative;

  .layout-list {
    position: absolute;
    top: calc(100% + 12px);
    left: 0;
    display: flex;
    padding: 16px 16px 6px;
    border-radius: 8px;
    background-color: var(--bg-color-dialog);
    box-shadow:
      0 2px 6px var(--uikit-color-black-8),
      0 8px 18px var(--uikit-color-black-8);

    .layout-item {
      position: relative;
      cursor: pointer;

      &:not(:first-child) {
        margin-left: 12px;
      }

      .layout-block-container {
        width: 130px;
        height: 88px;
        padding: 4px;
        border: 2px solid transparent;
        border-radius: 6px;
      }

      &:hover,
      &.checked {
        .layout-block-container {
          border: 2px solid var(--text-color-link);
        }
      }

      .layout-title {
        display: inline-block;
        width: 100%;
        margin-top: 2px;
        font-size: 12px;
        font-weight: 400;
        line-height: 24px;
        text-align: center;
        color: var(--text-color-primary);
      }

      &.checked {
        .layout-title {
          font-weight: 500;
          color: var(--text-color-link);
        }
      }
    }

    .layout1 {
      .layout-block-container {
        display: flex;
        flex-wrap: wrap;
        place-content: space-between space-between;

        .layout-block {
          width: 38px;
          height: 24px;
          background-color: var(--tab-color-option);

          &:nth-child(1) {
            border-top-left-radius: 4px;
          }

          &:nth-child(3) {
            border-top-right-radius: 4px;
          }

          &:nth-child(7) {
            border-bottom-left-radius: 4px;
          }

          &:nth-child(9) {
            border-bottom-right-radius: 4px;
          }
        }
      }
    }

    .layout2 {
      .layout-block-container {
        display: flex;
        justify-content: space-between;

        .left-container {
          width: 78px;
          height: 100%;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
          background-color: var(--tab-color-option);
        }

        .right-container {
          display: flex;
          flex-wrap: wrap;
          place-content: space-between space-between;
          width: 38px;
          height: 100%;

          > div {
            width: 38px;
            height: 24px;
            background-color: var(--tab-color-option);

            &:nth-child(1) {
              border-top-right-radius: 4px;
            }

            &:nth-child(3) {
              border-bottom-right-radius: 4px;
            }
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
          width: 100%;
          height: 24px;

          > div {
            width: 38px;
            height: 24px;
            background-color: var(--tab-color-option);

            &:nth-child(1) {
              border-top-left-radius: 4px;
            }

            &:nth-child(3) {
              border-top-right-radius: 4px;
            }
          }
        }

        .bottom-container {
          width: 118px;
          height: 50px;
          border-bottom-right-radius: 4px;
          border-bottom-left-radius: 4px;
          background-color: var(--tab-color-option);
        }
      }
    }
  }
}
</style>
