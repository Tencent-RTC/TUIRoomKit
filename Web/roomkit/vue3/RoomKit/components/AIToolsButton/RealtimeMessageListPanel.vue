<template>
  <RealtimeMessageList
    :target-language="targetLanguage"
    :display-mode="subtitleDisplayMode"
  />
</template>

<script setup lang="ts">
import { RealtimeMessageList } from '../ASRTools';
import { useASRToolsState } from '../../hooks/useASRToolsState';

const {
  targetLanguage,
  subtitleDisplayMode,
} = useASRToolsState();
</script>
