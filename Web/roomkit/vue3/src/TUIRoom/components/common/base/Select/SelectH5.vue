<template>
  <div>
    <div
      class="custom-select"
      @change="onChange($event.target.value)"
      @click="toggleDrawer"
      v-bind="$attrs"
    >
      <span class="label"> {{ selectedLabel || props.value }}</span>
      <IconArrowStrokeSelectDown size="12" />
    </div>

    <ActionSheep :visible="drawerShow" @input="drawerShow = $event">
      <div class="custom-option-container">
        <slot></slot>
      </div>
    </ActionSheep>
  </div>
</template>

<script setup>
import { ref, defineEmits, defineProps, provide, watch, nextTick } from 'vue';
import { IconArrowStrokeSelectDown } from '@tencentcloud/uikit-base-component-vue3';
import ActionSheep from '../ActionSheep.vue';

const props = defineProps({
  value: {
    type: [String, Number, Date],
  },
});
const emit = defineEmits(['change', 'input']);

const selectedLabel = ref('');
const selectedRef = ref();
const options = ref([]);
const drawerShow = ref(false);
const toggleDrawer = async () => {
  drawerShow.value = !drawerShow.value;
  await nextTick();
  if (drawerShow.value) {
    await nextTick();
    await selectedRef.value.scrollIntoView({ block: 'center' });
  }
};
const onChange = value => {
  emit('change', value);
  emit('input', value);
};

const updateSelectedLabel = newValue => {
  const index = options.value.findIndex(option => option.value === newValue);
  const matchedOption = options.value[index];
  if (matchedOption && matchedOption.label !== selectedLabel.value) {
    selectedLabel.value = matchedOption.label;
    selectedRef.value = matchedOption.ref;
  }
};

const addOption = option => {
  const index = options.value.findIndex(item => item.value === option.value);
  if (index >= 0) {
    options.value[index] = option;
    updateSelectedLabel(props.value);
    return;
  }
  options.value.push(option);
  updateSelectedLabel(props.value);
};

const handleOptionClick = value => {
  updateSelectedLabel(value);
  onChange(value);
  toggleDrawer();
};

provide('TSelect', {
  value: props.value,
  label: selectedLabel,
  addOption,
  handleOptionClick,
});

watch(
  () => props.value,
  (newValue, oldValue) => {
    if (newValue === oldValue) return;
    updateSelectedLabel(newValue);
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
.custom-select {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;

  .label {
    display: inline-block;
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    text-wrap: nowrap;
    white-space: nowrap;
  }
}

.custom-option-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: 38vh;
  overflow: auto;
}
</style>
