<template>
  <TUIButton
    v-if="singleControl"
    type="primary"
    @click="singleControl?.handler"
  >
    {{ singleControl?.label }}
  </TUIButton>
  <div class="actions">
    <!-- 更多操作 -->
    <div
      v-if="showMoreActions"
      class="more-actions"
      @click.stop
    >
      <TUIButton @click="toggleMoreMenu">
        {{ t('ParticipantList.More') }}
        <IconArrowUp
          size="12"
          :class="['more-arrow', showMenu ? 'up' : 'down']"
        />
      </TUIButton>

      <!-- 下拉菜单 -->
      <div v-show="showMenu" class="dropdown-menu">
        <div
          v-for="item in moreControlList"
          :key="item.key"
          class="menu-item"
          :style="item?.style || {}"
          @click="item.handler"
        >
          <TUIIcon
            v-if="item?.icon"
            :icon="item?.icon"
            size="16"
          />
          <span class="operate-text">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { TUIButton, IconArrowUp, useUIKit, TUIIcon } from '@tencentcloud/uikit-base-component-vue3';
import { useAudienceAction } from './useParticpantAction';
import type { RoomUser } from 'tuikit-atomicx-vue3';

interface Props {
  audience: RoomUser;
  isLocal: boolean;
}

const props = defineProps<Props>();

const { t } = useUIKit();

const showMenu = ref(false);

const toggleMoreMenu = () => {
  showMenu.value = !showMenu.value;
};

const { controlList } = useAudienceAction({ targetAudience: props.audience });
const singleControl = computed(() => !props.isLocal ? controlList.value[0] : null);
const moreControlList = computed(() => !props.isLocal ? controlList.value.slice(1) : controlList.value);
const showMoreActions = computed(() => moreControlList.value.length >= 1);

// 点击外部关闭菜单
const handleClickOutside = () => {
  if (showMenu.value) {
    showMenu.value = false;
  }
};

// 监听点击外部事件
if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside);
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style scoped lang="scss">
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666666;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }

  &.active {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }
}

.more-actions {
  position: relative;
}

.more-arrow {
  margin-left: 2px;

  &.down {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  max-width: 160px;
  padding: 20px;
  background-color: var(--dropdown-color-default);
  border-radius: 8px;
  box-shadow:
    0 3px 8px var(--uikit-color-black-8),
    0 6px 40px var(--uikit-color-black-8);
  z-index: 1;
  margin-top: 10px;

  &::before {
    position: absolute;
    top: -20px;
    right: 20px;
    width: 0;
    content: '';
    border-top: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid var(--dropdown-color-default);
    border-left: 10px solid transparent;
  }

  &::after {
    position: absolute;
    top: -20px;
    right: 0;
    width: 100%;
    height: 20px;
    content: '';
    background-color: transparent;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  height: 20px;
  color: var(--text-color-secondary);
  cursor: pointer;
  gap: 10px;

  .operate-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    white-space: nowrap;
  }

  &:not(:first-child) {
    margin-top: 20px;
  }
}
</style>
