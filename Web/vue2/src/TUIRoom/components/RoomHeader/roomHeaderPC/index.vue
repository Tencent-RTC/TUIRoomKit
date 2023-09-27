<template>
  <div class="header-container">
    <div class="left-container">
      <user-info
        v-show="showHeaderInfo"
        class="header-item user-info"
        :user-id="userId"
        :user-name="userName"
        :avatar-url="avatarUrl"
        @log-out="$emit('log-out')"
      ></user-info>
      <language v-show="showHeaderInfo" class="header-item language"></language>
      <switch-theme class="header-item theme"></switch-theme>
    </div>
    <div class="right-container">
      <!-- <network-info></network-info> -->
      <!-- <info-control></info-control> -->
      <layout-control class="right-container-item"></layout-control>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import UserInfo from '../UserInfo';
import Language from '../../base/Language.vue';
import SwitchTheme from '../../base/SwitchTheme.vue';
// import NetworkInfo from './NetworkInfo.vue';
/**
 * [info] Functions to be improved
 *
 * 【info】功能待完善
**/
// import InfoControl from './InfoControl.vue';
import LayoutControl from './LayoutControl.vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';

const basicStore = useBasicStore();

const { userId, userName, avatarUrl } = storeToRefs(basicStore);

const showHeaderInfo = inject('showHeaderInfo', true);

defineEmits(['log-out']);

</script>

<style lang="scss" scoped>
.header-container {
  width: 100%;
  height: 100%;
  padding-left: 9px;
  padding-right: 24px;
  position: relative;
  display: flex;
  justify-content: space-between;
  .left-container {
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    padding-left: 24px;
    .header-item:not(:first-child) {
      margin-left: 1rem;
    }
  }
  .right-container {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    float: right;
    padding-right: 24px;
    display: flex;
    align-items: center;
    .right-container-item:not(:last-child) {
      margin-right: 1rem;
    }

    .end-control-container {
      display: none;
    }
  }
}
</style>
