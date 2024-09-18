<template>
  <PanelContainer
    :visible="isDialogVisible"
    :title="t('Contacts')"
    @input="isDialogVisible = $event"
  >
    <div :class="['contacts-container', props.isMobile && 'h5']" @click.stop>
      <div class="contact">
        <div class="contact-search">
          <TuiInput
            v-model="searchValue"
            class="contact-search-input"
            :placeholder="t('Please enter the member name')"
            :search="searchContact"
            @focus="
              element => {
                element.classList.add('focus');
              }
            "
            @blur="
              element => {
                element.classList.remove('focus');
              }
            "
          >
            <template #suffixIcon>
              <SearchIcon class="search-icon" @mousedown.prevent />
            </template>
          </TuiInput>
        </div>
        <div class="contact-list">
          <div v-if="showList.length === 0 && searchValue" class="no-result">
            {{ t('No relevant members found') }}
          </div>
          <template v-else>
            <div
              v-for="item in showList"
              :key="item.userInfo.userID"
              :class="[
                'contact-list-item',
                item.disabled && 'contact-list-item-disabled',
              ]"
            >
              <TuiCheckbox
                :model-value="item.selected"
                :disabled="item.disabled"
                class="contact-list-item-checkbox"
                @input="item.selected = $event"
              >
                <span class="contact-list-item-checkbox-container">
                  <TuiAvatar
                    class="contact-list-item-avatar"
                    :img-src="item.userInfo.profile.avatar"
                  />
                  <p
                    class="contact-list-item-name"
                    :title="item.userInfo.profile.nick"
                  >
                    {{
                      item.userInfo.profile.nick || item.userInfo.profile.userID
                    }}
                  </p>
                </span>
              </TuiCheckbox>
            </div>
          </template>
        </div>
      </div>
      <div class="chosen" v-if="!props.isMobile">
        <div class="chosen-title">
          {{ t(`Selected Contact`) + `(${selectedContacts.length})` }}
        </div>
        <div class="chosen-list">
          <div
            v-for="item in selectedContacts"
            :key="item.userInfo.userID"
            class="chosen-list-item"
          >
            <TuiAvatar
              class="chosen-list-item-avatar"
              :img-src="item.userInfo.profile.avatar"
            />
            <p
              class="chosen-list-item-name"
              :title="item.userInfo.profile.nick"
            >
              {{ item.userInfo.profile.nick || item.userInfo.profile.userID }}
            </p>
            <CloseIcon
              class="chosen-list-item-remove"
              @click="removeSelectUser(item)"
            />
          </div>
        </div>
        <div class="chosen-footer">
          <TuiButton
            class="chosen-footer-button"
            type="primary"
            @click="cancel"
          >
            {{ t('Cancel') }}
          </TuiButton>
          <TuiButton class="chosen-footer-button" @click="confirm">{{
            t('Confirm')
          }}</TuiButton>
        </div>
      </div>
    </div>

    <template v-if="props.isMobile" #footer>
      <div class="contact-footer">
        <div class="chosen-member">
          <span v-if="selectedContacts.length">
            {{ t('x people selected', { number: selectedContacts.length }) }}
          </span>
        </div>
        <TuiButton :disabled="!selectedContacts.length" @click="confirm">
          {{ t('Confirm') + `(${selectedContacts.length})` }}
        </TuiButton>
      </div>
    </template>
  </PanelContainer>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  computed,
  withDefaults,
} from 'vue';
import TuiInput from '../common/base/Input';
import TuiCheckbox from '../common/base/Checkbox';
import TuiButton from '../common/base/Button.vue';
import TuiAvatar from '../common/Avatar.vue';
import SearchIcon from '../common/icons/SearchIcon.vue';
import CloseIcon from '../common/icons/CloseIcon.vue';
import PanelContainer from './PanelContainer.vue';

import { useI18n } from '../../locales';

const { t } = useI18n();

interface Props {
  visible: boolean;
  contacts: any[];
  selectedList?: any[];
  isMobile?: boolean;
  disabledList?: any[];
}
const props = withDefaults(defineProps<Props>(), {
  isMobile: false,
});
const emit = defineEmits(['input', 'confirm']);
const isDialogVisible = ref(false);
const searchValue = ref('');
const updateContacts = () => {
  contacts.value = props.contacts.map(user => {
    const index = props.selectedList?.findIndex(
      selectedUser => selectedUser.userId === user.userID
    );
    const disableUserIndex = props.disabledList?.findIndex(
      disableUser => disableUser.userId === user.userID
    );
    return {
      selected: index !== undefined && index !== -1,
      disabled: disableUserIndex !== undefined && disableUserIndex !== -1,
      userInfo: user,
    };
  });
};
const updateVisible = (val: boolean) => {
  updateContacts();
  emit('input', val);
};

const contacts = ref(
  props.contacts.map(user => {
    const index = props.selectedList?.findIndex(
      selectedUser => selectedUser.userId === user.userID
    );
    const disableUserIndex = props.disabledList?.findIndex(
      disabledUser => disabledUser.userId === user.userID
    );
    return {
      selected: !!index && index !== -1,
      disabled: !!disableUserIndex && disableUserIndex !== -1,
      userInfo: user,
    };
  })
);
const selectedContacts = computed(() =>
  contacts.value.filter(user => user.selected)
);
const searchResult = ref<any>([]);
const showList = computed(() =>
  searchValue.value ? searchResult.value : contacts.value
);
const searchContact = (v: any) => {
  if (!v) return [];
  searchResult.value = contacts.value.filter(
    item =>
      item.userInfo.profile.nick.includes(v) || item.userInfo.userID.includes(v)
  );
};

const removeSelectUser = (user: { selected: boolean; userInfo: any }) => {
  const index = contacts.value.findIndex(
    item => user.userInfo.userID === item.userInfo.userID
  );
  contacts.value[index].selected = false;
};
const confirm = () => {
  emit(
    'confirm',
    selectedContacts.value.map(item => {
      const { userID, profile } = item.userInfo;
      return {
        userId: userID,
        userName: profile.nick,
        avatarUrl: profile.avatar,
      };
    })
  );
  updateVisible(false);
};

const cancel = () => {
  updateVisible(false);
};

watch(
  () => props.visible,
  val => {
    isDialogVisible.value = val;
  },
  {
    immediate: true,
  }
);

watch(
  isDialogVisible,
  val => {
    searchValue.value = '';
    updateVisible(val);
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
.contacts-container {
  display: flex;
  max-height: 400px;

  .contact,
  .chosen {
    height: 400px;
  }

  .contact-list,
  .chosen-list {
    box-sizing: border-box;
    height: 80%;
    max-height: calc(100% - 68px);
    margin: 10px 0;
    overflow: auto;

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
        width: 20px;
        min-width: 20px;
        height: 20px;
        min-height: 20px;
        margin-right: 6px;
        margin-left: 8px;
      }

      &-name {
        box-sizing: border-box;
        max-width: 70%;
        margin: initial;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &-remove {
        width: 10px;
        min-width: 10px;
        margin-right: 10px;
        margin-left: auto;
        color: #6b758a;
        cursor: pointer;
      }
    }

    &-item:hover {
      background-color: #ecf5ff;
    }
  }

  .contact {
    width: 50%;
    padding-right: 1rem;
    border-right: 1px solid #e5e5e5;

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
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 12px;
        text-align: center;
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

    .chosen-footer {
      display: flex;
      gap: 10px;
      justify-content: center;

      .chosen-footer-button {
        width: 76px;
        height: 26px;
      }
    }
  }
}

.contact-list-item.contact-list-item-disabled {
  pointer-events: none;
  cursor: not-allowed;
}

.chosen-list-item.chosen-list-item-disabled {
  pointer-events: none;
  cursor: not-allowed;
}

.contacts-container.h5 {
  flex-direction: column;
  height: 100%;
  max-height: none;

  .contact {
    width: 100%;
    height: 100%;
    padding-right: 0;
    overflow: auto;
    border-right: none;

    .contact-list {
      height: 100%;

      &-item {
        height: 46px;
        line-height: 46px;
        border-bottom: 1px solid rgba(221, 226, 235, 0.3);
      }
    }
  }
}

.contact-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 20px;
  text-align: right;

  .chosen-member {
    font-size: 14px;
    font-weight: 400;
    color: #22262e;
  }

  .form-attendees:hover {
    overflow: auto;
  }

  button {
    padding: 6px 30px;
  }
}
</style>
