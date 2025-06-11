<template>
  <div :class="arrowStrokeClass">
    <div :class="['stroke-content', { 'has-stroke': hasStroke }]">
      <div class="arrow-content" @click="handleClickArrow"></div>
    </div>
    <svg-icon
      :class="['arrow', { 'has-stroke': hasStroke }]"
      @click="handleClickArrow"
    >
      <IconArrowStrokeLeft
        :class="arrowDirection"
        style="width: 8px; height: 12px"
      />
    </svg-icon>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconArrowStrokeLeft } from '@tencentcloud/uikit-base-component-vue3';

interface Props {
  strokePosition: string;
  arrowDirection: string;
  hasStroke: boolean;
}

const props = defineProps<Props>();

const emits = defineEmits(['click-arrow']);

const arrowStrokeClass = computed(
  () => `arrow-stroke-container-${props.strokePosition}`
);

function handleClickArrow() {
  emits('click-arrow');
}
</script>

<style lang="scss" scoped>
.arrow-stroke-container-left {
  width: 8px;
  height: 100%;

  .stroke-content {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    transform: perspective(20px) rotateX(0deg) rotateY(-20deg) translateZ(0);

    .arrow-content {
      position: absolute;
      top: 50%;
      left: 0;
      width: 5px;
      height: 60px;
      cursor: pointer;
      transform: translateY(-50%);

      &::before {
        position: absolute;
        top: 0;
        right: -15px;
        box-sizing: border-box;
        width: 20px;
        height: 100%;
        content: '';
        background-color: var(--uikit-color-black-6);
        border: 1px solid var(--uikit-color-gray-5);
        border-top-left-radius: 10px;
        border-bottom-left-radius: 10px;
      }
    }

    &.has-stroke {
      .arrow-content {
        position: absolute;
        top: 50%;
        left: 0;
        width: 5px;
        height: 60px;
        cursor: pointer;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        transform: translateY(-50%);
        border-top: 1px solid var(--stroke-color-primary);
        border-bottom: 1px solid var(--stroke-color-primary);
        border-left: 1px solid var(--stroke-color-primary);

        &::before {
          position: absolute;
          top: 0;
          right: -15px;
          width: 20px;
          height: 100%;
          content: '';
          background-color: transparent;
          border: 0;
        }
      }

      &::before {
        position: absolute;
        top: 0;
        right: 0;
        width: 2px;
        height: calc((100% - 60px) / 2);
        content: '';
        border-bottom-right-radius: 4px;
        border-bottom: 1px solid var(--stroke-color-primary);
        border-right: 1px solid var(--stroke-color-primary);
      }

      &::after {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 2px;
        height: calc((100% - 60px) / 2);
        content: '';
        border-top-right-radius: 4px;
        border-top: 1px solid var(--stroke-color-primary);
        border-right: 1px solid var(--stroke-color-primary);
      }
    }
  }

  .arrow {
    position: absolute;
    top: 50%;
    left: 6px;
    color: var(--uikit-color-gray-4);
    cursor: pointer;
    transition: color 0s;
    transform: translateY(-50%);

    svg {
      transition: color 0s;
    }
  }
}

.arrow-stroke-container-bottom {
  width: 100%;
  height: 8px;

  .stroke-content {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    transform: perspective(20px) rotateX(-20deg) rotateY(0deg) translateZ(0);

    .arrow-content {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 60px;
      height: 5px;
      cursor: pointer;
      transform: translateX(-50%);

      &::before {
        position: absolute;
        bottom: 0;
        box-sizing: border-box;
        width: 100%;
        height: 20px;
        content: '';
        background-color: var(--uikit-color-black-6);
        border: 1px solid var(--uikit-color-gray-5);
        border-bottom-right-radius: 10px;
        border-bottom-left-radius: 10px;
      }
    }

    &.has-stroke {
      .arrow-content {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 60px;
        height: 5px;
        cursor: pointer;
        border-bottom-right-radius: 4px;
        border-bottom-left-radius: 4px;
        transform: translateX(-50%);
        border-bottom: 1px solid var(--stroke-color-primary);
        border-left: 1px solid var(--stroke-color-primary);

        .arrow {
          color: var(--uikit-color-gray-4);
        }

        &::before {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 20px;
          content: '';
          background-color: transparent;
          border: 0;
        }
      }

      &::before {
        position: absolute;
        top: 0;
        left: 0;
        width: calc((100% - 60px) / 2);
        height: 2px;
        content: '';
        border-top-right-radius: 4px;
        border-top: 1px solid var(--stroke-color-primary);
        border-right: 1px solid var(--stroke-color-primary);
      }

      &::after {
        position: absolute;
        top: 0;
        right: 0;
        width: calc((100% - 60px) / 2);
        height: 2px;
        content: '';
        border-top-left-radius: 4px;
        border-top: 1px solid var(--stroke-color-primary);
        border-left: 1px solid var(--stroke-color-primary);
      }
    }
  }

  .arrow {
    position: absolute;
    bottom: 4px;
    left: 50%;
    color: var(--uikit-color-gray-4);
    cursor: pointer;
    transition: color 0s;
    transform: translateX(-50%);

    svg {
      transition: color 0s;
    }
  }
}

.up {
  transform: rotate(90deg);
}

.left {
  transform: rotate(0deg);
}

.down {
  transform: rotate(-90deg);
}

.right {
  transform: rotate(180deg);
}
</style>
