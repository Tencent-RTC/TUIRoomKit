<template>
  <TuiDialog
    v-model="isDialogVisible"
    :title="t('Contacts')"
    :modal="true"
    :append-to-body="true"
    :close-on-click-modal="false"
  >
    <div class="contacts-container">
      <div class="contact">
        <div class="contact-search">
          <TuiInput
            v-model="searchValue" class="contact-search-input" :search="searchContact"
            @focus="(element) => { element.classList.add('focus') }"
            @blur="(element) => { element.classList.remove('focus') }"
          >
            <template #suffixIcon>
              <SearchIcon class="search-icon" @mousedown.prevent />
            </template>
          </TuiInput>
        </div>
        <div class="contact-list">
          <div v-if="showList.length === 0 && searchValue" class="no-result">{{ t('No relevant members found') }}</div>
          <template v-else>
            <div v-for="item in showList" :key="item.userInfo.userID" class="contact-list-item">
              <TuiCheckbox
                :model-value="item.selected"
                class="contact-list-item-checkbox"
                @input="item.selected = $event"
              >
                <span class="contact-list-item-checkbox-container">
                  <TuiAvatar class="contact-list-item-avatar" :img-src="item.userInfo.profile.avatar"></TuiAvatar>
                  <p class="contact-list-item-name" :title="item.userInfo.profile.nick">
                    {{ item.userInfo.profile.nick || item.userInfo.profile.userID }}
                  </p>
                </span>
              </TuiCheckbox>
            </div>
          </template>
        </div>
      </div>
      <div class="chosen">
        <div class="chosen-title">{{ t(`Selected Contact`) + `(${selectedContacts.length})` }}</div>
        <div class="chosen-list">
          <div v-for="item in selectedContacts" :key="item.userInfo.userID" class="chosen-list-item">
            <TuiAvatar class="chosen-list-item-avatar" :img-src="item.userInfo.profile.avatar"></TuiAvatar>
            <p class="chosen-list-item-name" :title="item.userInfo.profile.nick">
              {{ item.userInfo.profile.nick || item.userInfo.profile.userID }}
            </p>
            <CloseIcon class="chosen-list-item-remove" @click="removeSelectUser(item)"></CloseIcon>
          </div>
        </div>
        <div class="chosen-footer">
          <TuiButton class="chosen-footer-button" type="primary" @click="cancel">{{ t('Cancel') }}</TuiButton>
          <TuiButton class="chosen-footer-button" @click="confirm">{{ t('Confirm') }}</TuiButton>
        </div>
      </div>
    </div>
  </TuiDialog>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import TuiDialog from '../common/base/Dialog';
import TuiInput from '../common/base/Input';
import TuiCheckbox from '../common/base/Checkbox.vue';
import TuiButton from '../common/base/Button.vue';
import TuiAvatar from '../common/Avatar.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import CloseIcon from '../common/icons/CloseIcon.vue';

import { useI18n } from '../../locales';

const { t } = useI18n();

interface Props {
  visible: boolean,
  contacts: any[],
  selectedList?: any[],
}
const props = defineProps<Props>();
const emit = defineEmits(['input', 'confirm']);
const isDialogVisible = ref(false);
const searchValue = ref('');
const updateContacts = () => {
  contacts.value = props.contacts.map((user) => {
    const index = props.selectedList?.findIndex(selectedUser => selectedUser.userId === user.userID);
    return { selected: index !== undefined && index !== -1, userInfo: user };
  });
};
const updateVisible = (val: boolean) => {
  updateContacts();
  emit('input', val);
};

const contacts = ref(props.contacts.map((user) => {
  const index = props.selectedList?.findIndex(selectedUser => selectedUser.userId === user.userID);
  return { selected: !!index && index !== -1, userInfo: user };
}));
const selectedContacts = computed(() => contacts.value.filter(user => user.selected));
const searchResult = ref<any>([]);
const showList = computed(() => (searchValue.value ? searchResult.value : contacts.value));
const searchContact = (v: any) => {
  if (!v) return [];
  searchResult.value = contacts.value
    .filter(item => item.userInfo.profile.nick.includes(v) || item.userInfo.userID.includes(v));
};
const removeSelectUser = (user: { selected: boolean; userInfo: any }) => {
  const index = contacts.value.findIndex(item => user.userInfo.userID === item.userInfo.userID);
  contacts.value[index].selected = false;
};
const confirm = () => {
  emit('confirm', selectedContacts.value.map((item) => {
    const { userID, profile } = item.userInfo;
    return {
      userId: userID,
      userName: profile.nick,
      avatarUrl: profile.avatar,
    };
  }));
  updateVisible(false);
};

const cancel = () => {
  updateVisible(false);
};

watch(
  () => props.visible,
  (val) => {
    isDialogVisible.value = val;
  },
  {
    immediate: true,
  },
);

watch(isDialogVisible, (val) => {
  searchValue.value = '';
  updateVisible(val);
}, { immediate: true });
</script>
<style lang="scss" scoped>
.contacts-container {
  display: flex;
  max-height: 400px;

  .contact,
  .chosen {
    height: 400px;
  }

  .contact {
    width: 50%;
    border-right: 1px solid #e5e5e5;
    padding-right: 1rem;

    .contact-search {
      &-input.focus {
        .search-icon {
          color: var(--active-color-1);
        }
      }
    }

    .contact-list {
      height: 80%;

      .no-result {
        font-size: 12px;
        text-align: center;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .chosen {
    width: 50%;
    padding-left: 1rem;
    overflow: hidden;

    .chosen-title {
      font-size: 14px;
      font-weight: 600;
    }

    .chosen-list {}

    .chosen-footer {
      display: flex;
      justify-content: center;
      gap: 10px;

      .chosen-footer-button {
        width: 76px;
        height: 26px;
      }
    }

  }

  .contact-list,
  .chosen-list {
    margin: 10px 0;
    height: 80%;
    max-height: calc(100% - 68px);
    overflow: auto;
    box-sizing: border-box;

    &-item {
      display: flex;
      align-items: center;
      height: 34px;
      line-height: 34px;
      cursor: pointer;

      &-checkbox {
        display: flex;
        width: 100%;
        height: 100%;

        &-container {
          display: flex;
          align-items: center;
        }
      }


      &-avatar {
        min-width: 20px;
        min-height: 20px;
        width: 20px;
        height: 20px;
        margin-right: 6px;
        margin-left: 8px;
      }

      &-name {
        box-sizing: border-box;
        margin: initial;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 70%;
      }

      &-remove {
        cursor: pointer;
        margin-left: auto;
        color: #6B758A;
        min-width: 10px;
        width: 10px;
        margin-right: 10px;
      }
    }

    &-item:hover {
      background-color: #ecf5ff;
    }
  }
}
</style>
