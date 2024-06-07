<template>
  <div class="content-container">
    <stream-container></stream-container>
  </div>
</template>

<script setup lang="ts">
import logger from '../../utils/common/logger';
import StreamContainer from './StreamContainer/index.vue';
</script>

<style lang="scss" scoped>
.content-container {
  display: flex;
  flex: 1;
}

</style>
