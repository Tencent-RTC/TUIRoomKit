<template>
  <div class="beauty-property-group">
    <div
      v-for="[key, items] in props.beautyItems.get(props.beautyType)
        ?.items as Map<string, BeautyItemMap>"
      :key="key"
      class="beauty-property-group"
    >
      <div class="beauty-title">
        {{ lang === 'zh-CN' ? items.name : items.nameEn }}
      </div>
      <div class="beauty-panel-container">
        <li
          v-for="(item, index) in items.items"
          :key="index"
          class="beauty-property-item"
          :class="{
            'is-active': selectedItem === item.key,
          }"
          :title="lang === 'zh-CN' ? item.name : item.nameEn"
          @click="handleBeautyPropertyClick(key, item)"
        >
          <img :src="item.icon" class="beauty-property-image" />
          <div class="beauty-label">
            {{ lang === 'zh-CN' ? item.name : item.nameEn }}
          </div>
        </li>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits } from 'vue';
import { storeToRefs } from 'pinia';
import {
  BeautyItem,
  BeautyPanelInfo,
  BeautyItemMap,
} from '../GenerateBeautyConfig';
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
function handleBeautyPropertyClick(key: string, item: BeautyItem) {
  selectedItem.value = item.key;
  emit('beauty-property-click', props.beautyType, key, item);
}
</script>

<style lang="scss" scoped>
@import './BeautyStyle.scss';
</style>
