<template>
  <div
    :class="[
      props.modelValue ? 'switch-container' : 'switch-container-active',
      themeClass,
    ]"
    @click="toggleSwitch"
  >
    <div class="switch-core"></div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue';
interface Props {
  modelValue: boolean;
  theme?: 'white' | 'black';
}

const themeClass = computed(() =>
  props.theme ? `tui-theme-${props.theme}` : ''
);

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

function toggleSwitch() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style lang="scss" scoped>
.tui-theme-white.switch-container-active {
  background-color: #bdbdbd;
}

.switch-container,
.switch-container-active {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  cursor: pointer;
  background-color: var(--active-color-1);
  border-radius: 20px;
  transition: background-color 0.3s;

  .switch-core {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 40%;
    height: 80%;
    background-color: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s !important;
    transform: translateX(20px);
  }
}

.switch-container-active {
  background-color: var(--background-color-6);

  .switch-core {
    transform: translateX(0);
  }
}
</style>
