<script lang="ts" setup>
import { MessageLayout } from './MessageLayout';
import type { Barrage } from '../../types';

withDefaults(defineProps<{
  message: Barrage;
  isLastInChunk?: boolean;
}>(), {
  isLastInChunk: true,
});
</script>

<template>
  <MessageLayout
    :message="message"
    :is-last-in-chunk="isLastInChunk"
  />
</template>
