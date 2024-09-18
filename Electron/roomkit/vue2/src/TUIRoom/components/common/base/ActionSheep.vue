<template>
  <div>
    <div class="mask" v-show="show && showMask" @click.stop="toggleShow"></div>
    <div class="container" v-show="show" :style="{ height: props.height }">
      <div class="container-close" @click="toggleShow" v-if="showClose">
        <svg-icon :icon="ArrowDown" />
      </div>
      <div v-if="title" class="container-header">{{ title }}</div>
      <slot></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, defineProps, watch, defineEmits } from 'vue';
import SvgIcon from './SvgIcon.vue';
import ArrowDown from '../icons/ArrowDown.vue';
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
const emit = defineEmits(['input']);
const show = ref(false);

watch(
  () => props.visible,
  val => (show.value = val),
  { immediate: true }
);
watch(show, val => emit('input', val), { immediate: true });

const toggleShow = () => (show.value = !show.value);
</script>
<style scoped lang="scss">
.mask {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1001;
  width: 100%;
  min-height: 120px;
  padding: 20px 12px 36px;
  background-color: #fff;
  border-radius: 18px 18px 0 0;

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
    color: #4f586b;
  }
}
</style>
