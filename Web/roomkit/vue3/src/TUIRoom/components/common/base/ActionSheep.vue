<template>
  <div>
    <div class="mask" v-show="show && showMask" v-tap="toggleShow"></div>
    <div class="container" v-show="show" :style="{ height: props.height }">
      <div class="container-close" v-tap="toggleShow" v-if="showClose">
        <TUIIcon :icon="IconArrowDown" size="28" />
      </div>
      <div v-if="title" class="container-header">{{ title }}</div>
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, defineProps, watch, defineEmits } from 'vue';
import { IconArrowDown } from '@tencentcloud/uikit-base-component-vue3';
import vTap from '../../../directives/vTap';
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  showMask: {
    type: Boolean,
    default: true,
  },
  height: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['input', 'close']);
const show = ref(false);

watch(
  () => props.visible,
  val => (show.value = val),
  { immediate: true }
);
watch(
  show,
  val => {
    emit('input', val);
  },
  { immediate: true }
);

const toggleShow = () => {
  show.value = !show.value;
  if (!show.value) {
    emit('close');
  }
};
</script>
<style scoped lang="scss">
.mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background-color: var(--uikit-color-black-3);
}

.container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1001;
  width: 100%;
  min-height: 120px;
  padding: 20px 12px 36px;
  border-radius: 18px 18px 0 0;
  background-color: var(--bg-color-operate);

  .container-close {
    display: flex;
    justify-content: center;
    padding-bottom: 12px;
    text-align: center;
  }

  .container-header {
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: 500;
    color: var(--text-color-primary);
  }
}
</style>
