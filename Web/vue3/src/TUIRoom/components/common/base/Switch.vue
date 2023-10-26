<template>
  <label class="switch" :class="{ 'is-checked': isChecked }">
    <input v-model="isChecked" type="checkbox" class="switch-input" @change="toggleSwitch" />
    <span class="switch-core"></span>
  </label>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const isChecked = ref(true);

const emit = defineEmits(['update:modelValue']);

function toggleSwitch() {
  emit('update:modelValue', isChecked.value);
}

watch(
  () => props.modelValue,
  (val) => {
    isChecked.value = val;
  },
);
</script>

<style lang="scss" scoped>
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: var(--background-color-6);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.switch.is-checked {
  background-color: rgba(28, 102, 229, 1);
}

.switch-input {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  width: 0;
  height: 0;
}

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
}

.switch.is-checked .switch-core {
  transform: translateX(20px);
}
</style>
