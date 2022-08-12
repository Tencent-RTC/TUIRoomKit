<template>
  <template v-for="(item, index) in handleTextMessageShowContext(props.data)" :key="index">
    <span class="text-box" v-if="item.name === 'text'">{{ item.text }}</span>
    <img class="text-img" v-else-if="item.name === 'img'" :src="item.src"/>
  </template>
</template>

<script setup lang="ts">
  import { decodeMessageText } from '../util';

  const props = defineProps(['data'])

  const handleTextMessageShowContext = (text: string) => {
    let result = decodeMessageText(text);
    return result;
  }

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
