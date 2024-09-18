<template>
  <div
    class="custom-select"
    @change="onChange($event.target.value)"
    @click="toggleDrawer"
  >
    <span class="label"> {{ selectedLabel || props.value }}</span>
    <svg-icon class="icon-arrow" :icon="ArrowStrokeSelectDownIcon" />
  </div>

  <ActionSheep :visible="drawerShow" @input="drawerShow = $event">
    <scroll-view
      class="custom-option-container"
      scroll-y
      :scroll-top="scrollTop"
      scroll-with-animation
    >
      <slot></slot>
    </scroll-view>
  </ActionSheep>
</template>

<script setup>
import { ref, defineEmits, defineProps, provide, watch, nextTick } from 'vue';
import ActionSheep from '../ActionSheep.vue';
import SvgIcon from '../SvgIcon.vue';
import ArrowStrokeSelectDownIcon from '../../icons/ArrowStrokeSelectDownIcon.vue';

const props = defineProps({
  value: {
    type: [String, Number, Date],
  },
});
const emit = defineEmits(['change', 'input']);

const selectedIndex = ref(0);
const selectedLabel = ref('');
const selectedRef = ref();
const options = ref([]);
const drawerShow = ref(false);
const scrollTop = ref(0);
const toggleDrawer = async () => {
  drawerShow.value = !drawerShow.value;
  await nextTick();
  if (drawerShow.value) {
    scrollTop.value = 42 * selectedIndex.value;
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
    selectedIndex.value = index;
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
