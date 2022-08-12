<template>
  <div class="mail-login">
    <input class="input" :placeholder="placeholder" v-model="mailAddress">
    <div class="area-container">
      <svg-icon icon-name="mail-icon" size="medium"></svg-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch} from 'vue';
import SvgIcon from '../common/SvgIcon.vue';

const emit = defineEmits(["updateMailAddress"]);
const placeholder = "请输入邮箱";
const mailAddress = ref('');
watch(() => mailAddress.value, (val) => {
  emit("updateMailAddress", val);
});
</script>

<style lang="scss" scoped>
.mail-login{
  position:relative;
  width:100%;
  height:100%;
  .input{
    -webkit-appearance:none;
    background-color:#292D38;
    background-image:none;
    border-radius:8px;
    border:1px solid #292D38;
    box-sizing:border-box;
    color: #B3B8C8;
    display:inline-block;
    font-size:inherit;
    height:60px;
    line-height:60px;
    outline:none;
    padding:0 15px 0 40px;
    transition:border-color .2s cubic-bezier(.645,.045,.355,1);
    width:100%;
  }
  .area-container{
    width:20px;
    height:20px;
    position:absolute;
    top:32%;
    left:4%;
  }
  .verify-code{
    margin-top:30px;
  }
}
</style>
