<template>
  <span
    :class="['custom-option', isActive && 'active']"
    :value="props.value"
    :disabled="disabled"
    @click="handleOptionClick"
    ref="optionRef"
    :key="props.value"
  >
    {{ props.label }}
  </span>
</template>

<script setup lang="ts">
import { watch, ref, defineProps, inject, onMounted, computed } from 'vue';
const optionRef = ref();
const TSelect = inject('TSelect');
const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    required: true,
    type: [String, Number],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const isActive = computed(() => {
  return TSelect && TSelect.label.value === props.label;
});

watch(
  () => props.label,
  newValue => {
    TSelect.addOption({
      label: props.label,
      value: props.value,
      ref: optionRef,
    });
  }
);

onMounted(() => {
  TSelect.addOption({ label: props.label, value: props.value, ref: optionRef });
});
const handleOptionClick = () => {
  if (props.disabled) return;
  TSelect.handleOptionClick(props.value);
};
</script>
<style scoped lang="scss">
.custom-option {
  display: inline-block;
  width: 100%;
  text-align: center;
}

.custom-option.active {
  font-weight: 700;
  color: #409eff;
  background-color: #f5f7fa;
}
</style>
