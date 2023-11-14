<template>
  <Transition name="message">
    <div
      v-show="isShow" ref="messageRef" :class="['t-message', `t-message-${props.type}`]"
      :style="{
        top: props.top.value,
        zIndex: props.zIndex
      }"
    >
      <i :class="['t-message-icon', `t-message-icon-${props.type}`]"></i>
      <span class="t-message-text">{{ props.message }}</span>
    </div>
  </Transition>
</template>
<script lang="ts" setup>
import { ref, onMounted, PropType, defineProps } from 'vue';

const props = defineProps({
  type: {
    type: String as PropType<'success' | 'error' | 'warning' | 'info'>,
    default: 'success',
  },
  message: {
    type: [String, Number],
    default: '',
  },
  duration: {
    type: Number,
    default: 3000,
  },
  remove: {
    type: Function,
    default: () => {},
  },
  top: {
    type: Object,
    default: () => {},
  },
  zIndex: {
    type: Number,
    default: 1000,
  },
});
const messageRef = ref();
const isShow = ref(false);
onMounted(async () => {
  onOpen();
});

const timer = ref();
const onOpen = () => {
  isShow.value = true;
  timer.value && clearTimeout(timer.value);
  timer.value = setTimeout(() => {
    onClose();
  }, props.duration);
};
const onClose = () => {
  isShow.value = false;
  props.remove();
};
</script>

<style lang="scss" scoped>
@import "./Message.scss";
</style>
