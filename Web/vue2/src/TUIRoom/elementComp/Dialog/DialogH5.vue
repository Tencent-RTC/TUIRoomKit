<template>
  <div v-if="props.modelValue" class="dialog-container">
    <span class="dialog-title">{{ props.title }}</span>
    <div class="dialog-content">
      <slot></slot>
    </div>
    <div class="dialog-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  modelValue: boolean,
  title?: string,
}

const props = defineProps<Props>();
</script>

<style lang="scss">
.dialog-container {
   height: 15vh;
    max-width: 80vw;
    position: fixed;
    background-color: #FFFFFF;
    border-radius: 8px;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    margin: auto;
    border: 1px solid rgba(211, 219, 238, 0.4);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  .dialog-title {
    display: inline-block;
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 18px;
    line-height: 22px;
    text-align: center;
    color: rgba(43, 46, 56, 1);
  }
  .dialog-content {
    font-family: 'PingFang SC';
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 16px;
    text-align: center;
    color: rgba(43, 46, 56, 1);
    text-align: center;
    padding-top: 10px;
  }
  .dialog-footer {
    display: flex;
    height: auto;
    flex-direction: row;
    justify-content: center;
   }
}
</style>
