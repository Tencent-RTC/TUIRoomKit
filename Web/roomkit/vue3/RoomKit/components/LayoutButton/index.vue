<template>
  <div
    v-click-outside="handleClickOutSide"
    class="layout-container"
  >
    <icon-button
      :title="t('Layout.Title')"
      :disabled="participantList.length < 2"
      layout="horizontal"
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
          `${layout === RoomLayoutTemplate.GridLayout ? 'checked' : ''}`,
        ]"
        @click="handleClick(RoomLayoutTemplate.GridLayout)"
      >
        <div class="layout-block-container">
          <div
            v-for="(item, index) in new Array(9).fill('')"
            :key="index"
            class="layout-block"
          />
        </div>
        <span class="layout-title">{{ t('Layout.Grid') }}</span>
      </div>
      <!--
        * Right side member list
        *
      -->
      <div
        :class="[
          'layout2',
          'layout-item',
          `${layout === RoomLayoutTemplate.SidebarLayout ? 'checked' : ''}`,
        ]"
        @click="handleClick(RoomLayoutTemplate.SidebarLayout)"
      >
        <div class="layout-block-container">
          <div class="left-container" />
          <div class="right-container">
            <div
              v-for="(item, index) in new Array(3).fill('')"
              :key="index"
              class="layout-block"
            />
          </div>
        </div>
        <span class="layout-title">{{ t('Layout.GalleryRight') }}</span>
      </div>
      <!--
        * Top Member List
        *
      -->
      <div
        :class="[
          'layout3',
          'layout-item',
          `${layout === RoomLayoutTemplate.CinemaLayout ? 'checked' : ''}`,
        ]"
        @click="handleClick(RoomLayoutTemplate.CinemaLayout)"
      >
        <div class="layout-block-container">
          <div class="top-container">
            <div
              v-for="(item, index) in new Array(3).fill('')"
              :key="index"
              class="layout-block"
            />
          </div>
          <div class="bottom-container" />
        </div>
        <span class="layout-title">{{ t('Layout.GalleryTop') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref } from 'vue';
import { IconLayout, useUIKit } from '@tencentcloud/uikit-base-component-vue3';
import { useRoomParticipantState, RoomLayoutTemplate } from 'tuikit-atomicx-vue3/room';
import IconButton from '../base/IconButton.vue';
import vClickOutside from '../base/vClickOutside';

const { t } = useUIKit();
const { participantList } = useRoomParticipantState();

interface Props {
  layout: RoomLayoutTemplate;
}
defineProps<Props>();

const showLayoutList: Ref<boolean> = ref(false);

const emit = defineEmits(['update:layout']);

function handleClick(changeLayout: RoomLayoutTemplate) {
  emit('update:layout', changeLayout);
}

function handleClickLayoutIcon() {
  if (participantList.value?.length < 2) {
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

  .layout-icon {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .layout-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color-primary);
    }
  }

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
        box-sizing: border-box;
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
