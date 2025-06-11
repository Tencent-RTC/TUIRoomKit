<template>
  <div class="user-list-container">
    <user-list-search />
    <div class="user-category-content" v-if="userCategoryList?.length">
      <div
        v-for="(item, index) in userCategoryList"
        :key="index"
        :class="[
          'user-category',
          {
            'user-category-active': item.key === activeCategoryKey,
          },
        ]"
        @click="handleSwitchCategory(item)"
      >
        <span class="user-category-title">
          {{ `${item.title} (${filterUserListObj?.[item.key].length})` }}
        </span>
      </div>
    </div>
    <on-seat-notification />
    <user-list-content
      :filterFn="activeCategory?.filterFn"
      :sortFn="props.sortFn"
    >
      <template #userItem="{ userInfo }" v-if="$slots.userItem">
        <slot name="userItem" :userInfo="userInfo"></slot>
      </template>
    </user-list-content>
    <all-user-actions
      :activeCategoryKey="activeCategoryKey"
      :userCategoryNumber="filterUserListObj?.[activeCategoryKey].length || 0"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref, computed, Ref } from 'vue';
import UserListSearch from '../UserListSearch/index.vue';
import UserListContent from '../UserListContent/index.vue';
import OnSeatNotification from './OnSeatNotification/index.vue';
import AllUserActions from './AllUserActions';
import { Comparator } from '../../../utils/utils';
import { useUserState } from '../../hooks';
import { UserInfo } from '../../type';

interface UserCategory {
  key: string;
  title: string;
  filterFn: (userInfo: UserInfo) => boolean;
}
interface Props {
  sortFn?: Comparator<UserInfo>;
  userCategoryList?: UserCategory[];
}
const props = defineProps<Props>();

const { userList } = useUserState();
const activeCategoryKey: Ref<string> = ref(
  props.userCategoryList?.[0]?.key || ''
);
const activeCategory = computed(() =>
  props.userCategoryList?.find(item => item.key === activeCategoryKey.value)
);
function handleSwitchCategory(item: UserCategory) {
  activeCategoryKey.value = item.key;
}

const filterUserListObj = computed(() => {
  const filterUserCategoryObj: Record<string, UserInfo[]> = {};
  props.userCategoryList?.forEach(item => {
    if (item.filterFn) {
      filterUserCategoryObj[item.key] = userList.value.filter(item.filterFn);
    } else {
      filterUserCategoryObj[item.key] = userList.value;
    }
  });
  return filterUserCategoryObj;
});
</script>

<style lang="scss" scoped>
.user-list-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .user-category-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    padding: 3px 4px;
    margin: 16px 20px 0;
    cursor: pointer;
    background-color: var(--bg-color-input);
    border-radius: 20px;

    .user-category {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      border-radius: 20px;

      &.user-category-active {
        background-color: var(--bg-color-operate);
      }
    }

    .user-category-title {
      font-size: 14px;
      font-weight: 400;
      color: var(--text-color-primary);
      filter: drop-shadow(0 2px 4px var(--uikit-color-black-8))
        drop-shadow(0 6px 10px var(--uikit-color-black-8))
        drop-shadow(0 3px 14px var(--uikit-color-black-8));
      border-radius: 20px;
      transform: translateX(4px);
    }
  }

  .global-setting {
    display: flex;
    justify-content: space-around;
    margin: 20px 0;
    cursor: pointer;
  }

  .button-bottom {
    width: 80%;
  }
}

.cancel-button {
  margin-left: 12px;
}
</style>
