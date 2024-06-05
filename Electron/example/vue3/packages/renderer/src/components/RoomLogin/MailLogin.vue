<template>
  <div class="mail-login">
    <input
      v-model="mailAddress" :class="[isMobile ? 'input-mobile' : 'input']" :placeholder="t('Email address')"
      enterkeyhint="complete"
    >
    <div class="area-container">
      <svg-icon :icon="MailIcon"></svg-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from '../../locales';
import { SvgIcon } from '@tencentcloud/roomkit-electron-vue3';
import { isMobile }  from '@tencentcloud/roomkit-electron-vue3/es/utils/environment';
import MailIcon from '../icons/MailIcon.vue';

const { t } = useI18n();

const emit = defineEmits(['update-mail-address']);
const mailAddress = ref('');
watch(() => mailAddress.value, (val) => {
  emit('update-mail-address', val);
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
  .input-mobile{
    -webkit-appearance:none;
    background-color:rgba(207, 213, 230, 0.2);
    background-image:none;
    border-radius:8px;
    box-sizing:border-box;
    color: #B3B8C8;
    display:inline-block;
    font-size:inherit;
    height:60px;
    line-height:60px;
    outline:none;
    border: 0px;
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
