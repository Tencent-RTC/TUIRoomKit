<template>
  <UIKitProvider theme="dark">
    <div id="app">
      <router-view />
    </div>
  </UIKitProvider>
</template>

<script setup lang="ts">
import { UIKitProvider } from '@tencentcloud/uikit-base-component-vue2';
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
* {
  box-sizing: border-box;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
}
</style>
