<template>
  <div class="user-search-content">
    <IconSearch size="20" />
    <input
      v-model="userSearchText"
      class="search-input"
      :placeholder="t('Search Member')"
    />
  </div>
</template>

<script lang="ts" setup>
import { IconSearch } from '@tencentcloud/uikit-base-component-vue3';
import { useI18n } from '../../../locales';
import { useUserState } from '../../hooks';

const { t } = useI18n();
const { userSearchText } = useUserState();
</script>

<style scoped>
.user-search-content {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 16px;
  margin: 23px 20px 0;
  color: var(--text-color-primary);
  background-color: var(--bg-color-input);
  border-radius: 16px;

  .search-input {
    width: 100%;
    margin-left: 8px;
    font-size: 14px;
    color: var(--text-color-primary);
    background: none;
    border: none;
    outline: none;
  }
}
</style>
