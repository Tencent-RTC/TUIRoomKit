<template>
  <div v-for="(item) in decodeMessageText(props.data)" :key="item.ID">
    <text v-if="item.name === 'text'" class="text-box">{{ item.text }}</text>
    <image v-else-if="item.name === 'img'" class="text-img" :src="item.src" />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { decodeMessageText } from '../util';

// eslint-disable-next-line vue/require-prop-types
const props = defineProps(['data']);


</script>

<style lang="scss" scoped>
.text-img {
  width: 20px;
  height: 20px;
  vertical-align: middle;
}

.text-box {
  line-height: 20px;
  vertical-align: middle;
  display: flex;
  max-width: 260px;
  flex-wrap: wrap;
}
</style>
