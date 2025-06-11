<template>
  <div id="memberListContainer" class="user-list-content">
    <template v-for="userInfo in showUserList" :key="userInfo.userId">
      <slot v-if="$slots.userItem" name="userItem" :user-info="userInfo"></slot>
      <user-item v-else :user-info="userInfo" />
    </template>
  </div>
</template>

<script setup lang="ts">
import UserItem from '../UserItem';
import { ComputedRef, computed, defineProps, withDefaults } from 'vue';
import { useUserState } from '../../hooks';
import { UserInfo } from '../../type';
import { Comparator } from '../../../utils/utils';

interface Props {
  searchFn?: (userInfo: UserInfo, searchText: string) => boolean;
  sortFn?: Comparator<UserInfo>;
  filterFn?: (userInfo: UserInfo) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  searchFn: (userInfo: UserInfo, searchText: string) =>
    userInfo.nameCard?.includes(searchText) ||
    userInfo.userName?.includes(searchText) ||
    userInfo.userId.includes(searchText),
});

const { userList, userSearchText } = useUserState();

const showUserList: ComputedRef<UserInfo[]> = computed(() => {
  let tempUserList = userList.value;
  if (props.filterFn) {
    tempUserList = tempUserList.filter(props.filterFn);
  }
  if (userSearchText) {
    tempUserList = tempUserList.filter(item =>
      props.searchFn(item, userSearchText.value)
    );
  }
  return tempUserList;
});
</script>

<style lang="scss" scoped>
.user-list-content {
  flex: 1;
  margin-top: 10px;
  overflow-y: scroll;

  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
