<template>
  <div class="beauty-panel-container">
    <li
      v-for="item in backgroundItems"
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
import { ref, defineProps, defineEmits, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { BeautyItem, BeautyPanelInfo } from '../GenerateBeautyConfig';
import { AdvancedBeautyType } from '../../../type';
import { useBasicStore } from '../../../../stores/basic';
import { useAdvancedBeautyState } from '../../../hooks';
const { virtualBackgroundImages } = useAdvancedBeautyState();

const basicStore = useBasicStore();
const { lang } = storeToRefs(basicStore);
const selectedItem = ref('');

const backgroundItems = ref<BeautyItem[]>([]);

const props = defineProps<{
  beautyItems: Map<AdvancedBeautyType, BeautyPanelInfo>;
}>();

const fs = require('fs');

onMounted(() => {
  backgroundItems.value.length = 0;

  getVirtualBackgroundBlurItems();
  getInnerVirtualBackgroundImages();
  getOuterVirtualBackgroundImages();
});

function getVirtualBackgroundBlurItems() {
  const virtualBackgroundItems = props.beautyItems.get(
    AdvancedBeautyType.virtualBackground
  );
  if (!virtualBackgroundItems) {
    return;
  }

  const items = virtualBackgroundItems.items as BeautyItem[];
  items.forEach(beautyItem => {
    const item = { ...beautyItem };
    backgroundItems.value.push(item);
  });
}

function getInnerVirtualBackgroundImages() {
  const imageArray = ['background1.png', 'background2.png'];
  imageArray.forEach(async image => {
    const imagePath = getInnerImagePath(image);
    if (fs.existsSync(imagePath)) {
      const imageName = getImageName(image);
      const imageUrl = new URL(
        `../BeautyConfig/BackgroundImages/${image}`,
        import.meta.url
      );
      const item: BeautyItem = {
        key: imageName,
        icon: imageUrl.href,
        name: imageName,
        nameEn: imageName,
        effectName: 'video_empty_segmentation',
        resourcePath:
          'segmentMotionRes.bundle/video_empty_segmentation/template.json',
        backgroundPath: imagePath,
      };
      backgroundItems.value.push(item);
    }
  });
}

function getOuterVirtualBackgroundImages() {
  if (virtualBackgroundImages.value.length === 0) {
    return;
  }

  virtualBackgroundImages.value.forEach(async image => {
    const imagePath = getOuterImagePath(image);
    if (fs.existsSync(imagePath)) {
      const imageName = getImageName(image);
      const item: BeautyItem = {
        key: imageName,
        icon: getOuterIconUrl(image),
        name: imageName,
        nameEn: imageName,
        effectName: 'video_empty_segmentation',
        resourcePath:
          'segmentMotionRes.bundle/video_empty_segmentation/template.json',
        backgroundPath: imagePath,
      };
      backgroundItems.value.push(item);
    }
  });
}

function getImageName(path: string): string {
  const lastSlashIndex = Math.max(
    path.lastIndexOf('/'),
    path.lastIndexOf('\\')
  );
  const fileNameWithExt =
    lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;

  const lastDotIndex = fileNameWithExt.lastIndexOf('.');
  return lastDotIndex > 0
    ? fileNameWithExt.substring(0, lastDotIndex)
    : fileNameWithExt;
}

function getOuterIconUrl(image: string) {
  if (process.env.NODE_ENV === 'production') {
    return `${process.resourcesPath}/plugin/Xmagic/images/${image}`;
  }
  return `./${image}`;
}

function getInnerImagePath(image: string) {
  if (process.env.NODE_ENV === 'production') {
    return `${process.resourcesPath}/plugin/Xmagic/images/${image}`;
  }
  return `${process.cwd()}/node_modules/@tencentcloud/roomkit-electron-vue3/images/${image}`;
}

function getOuterImagePath(image: string) {
  if (process.env.NODE_ENV === 'production') {
    return `${process.resourcesPath}/plugin/Xmagic/images/${image}`;
  }
  return `${process.env.PUBLIC_PATH}${image}`;
}

const emit = defineEmits(['beauty-property-click']);
function handleBeautyPropertyClick(item: BeautyItem) {
  selectedItem.value = item.key;
  emit(
    'beauty-property-click',
    AdvancedBeautyType.virtualBackground,
    AdvancedBeautyType.virtualBackground,
    item
  );
}
</script>

<style lang="scss" scoped>
@import './BeautyStyle.scss';
</style>
