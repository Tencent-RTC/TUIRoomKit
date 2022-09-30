<template>
  <template v-for="(item, index) in handleTextMessageShowContext(props.data)" :key="index">
    <span v-if="item.name === 'text'" class="text-box">{{ item.text }}</span>
    <img v-else-if="item.name === 'img'" class="text-img" :src="item.src" />
  </template>
</template>

<script setup lang="ts">
import { decodeMessageText } from '../util';

const props = defineProps(['data']);

const handleTextMessageShowContext = (text: string) => decodeMessageText(text);

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
  }
</style>
