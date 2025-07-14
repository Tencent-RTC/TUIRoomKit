<template>
  <div class="beauty-panel-container">
    <li
      v-for="item in props.beautyItems.get(props.beautyType)
        ?.items as BeautyItem[]"
      :key="item.name"
      class="beauty-property-item"
      :class="{
        'is-active': selectedItem === item.key,
      }"
      :title="lang === 'zh-CN' ? item.name : item.nameEn"
      @click="handleBeautyPropertyClick(item)"
    >
      <img :src="item.icon" class="beauty-property-image" />
      <div class="beauty-label">
        {{ lang === 'zh-CN' ? item.name : item.nameEn }}
      </div>
    </li>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import { BeautyItem, BeautyPanelInfo } from '../GenerateBeautyConfig';
import { AdvancedBeautyType } from '../../../type';
import { useBasicStore } from '../../../../stores/basic';

const basicStore = useBasicStore();
const { lang } = storeToRefs(basicStore);
const selectedItem = ref('');

const props = defineProps<{
  beautyType: AdvancedBeautyType;
  beautyItems: Map<AdvancedBeautyType, BeautyPanelInfo>;
}>();

const emit = defineEmits(['beauty-property-click']);
function handleBeautyPropertyClick(item: BeautyItem) {
  selectedItem.value = item.key;
  emit('beauty-property-click', props.beautyType, props.beautyType, item);
}
</script>

<style lang="scss" scoped>
@import './BeautyStyle.scss';
</style>
