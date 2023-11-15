<template>
  <div :class="[props.modelValue ? 'switch-container' : 'switch-container-active']" @click="toggleSwitch">
    <div class="switch-core"></div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

function toggleSwitch() {
  emit('update:modelValue', !props.modelValue);
}
</script>

<style lang="scss" scoped>
.switch-container,
.switch-container-active {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: var(--active-color-1);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
  .switch-core {
    position: absolute;
    left: 2px;
    top: 2px;
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
