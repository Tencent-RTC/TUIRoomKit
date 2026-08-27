<template>
  <div class="message-image" @tap="handlePreviewImage">
    <image
      class="image-content"
      mode="widthFix"
      :src="thumbnailUrl"
      @load="emit('load')"
    />
    <div v-if="isUploading" class="image-mask">{{ uploadPercent }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getImageMessageUrl } from '../util';
import type { MessageImageInfo } from '../../../stores/chat';

const props = defineProps<{
  data?: MessageImageInfo[];
  progress?: number;
}>();
const emit = defineEmits(['load']);

const imageUrl = computed(() => getImageMessageUrl(props.data));
const thumbnailUrl = computed(() => imageUrl.value.thumbnailUrl);

const isUploading = computed(
  () => props.progress !== undefined && props.progress < 1
);
const uploadPercent = computed(
  () => `${Math.round((props.progress || 0) * 100)}%`
);

const handlePreviewImage = () => {
  const { originUrl } = imageUrl.value;
  if (isUploading.value || !originUrl) {
    return;
  }
  uni.previewImage({ urls: [originUrl] });
};
</script>

<style lang="scss" scoped>
.message-image {
  position: relative;
  overflow: hidden;
  width: 150px;
  border-radius: 8px;
}

.image-content {
  display: block;
  width: 150px;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  background-color: var(--uikit-color-black-5);
  color: var(--uikit-color-white-1);
}
</style>
