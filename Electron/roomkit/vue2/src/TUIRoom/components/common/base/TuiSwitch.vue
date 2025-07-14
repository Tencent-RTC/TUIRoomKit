<template>
  <div
    :class="[props.value ? 'switch-container' : 'switch-container-active']"
    @click="toggleSwitch"
  >
    <div class="switch-core"></div>
  </div>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';
interface Props {
  value: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(['input']);

function toggleSwitch() {
  emit('input', !props.value);
}
</script>

<style lang="scss" scoped>
.switch-container,
.switch-container-active {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  cursor: pointer;
  border-radius: 20px;
  transition: background-color 0.3s;
  background-color: var(--switch-color-on);

  .switch-core {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 40%;
    height: 80%;
    border-radius: 50%;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s !important;
    transform: translateX(20px);
    background-color: var(--switch-color-button);
  }
}

.switch-container-active {
  background-color: var(--switch-color-off);
  .switch-core {
    transform: translateX(0);
  }
}
</style>
