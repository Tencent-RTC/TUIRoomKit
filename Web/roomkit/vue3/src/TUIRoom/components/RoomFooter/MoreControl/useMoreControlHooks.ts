import { computed } from 'vue';
import { useBasicStore } from '../../../stores/basic';
import { storeToRefs } from 'pinia';
import { useI18n } from '../../../locales';
import { ICON_NAME } from '../../../constants/icon';

export default function useControl() {
  const { t } = useI18n();

  const basicStore = useBasicStore();
  const { sidebarName } = storeToRefs(basicStore);

  const iconName = computed(() =>
    sidebarName.value === 'more' ? ICON_NAME.MoreActive : ICON_NAME.More
  );

  return {
    t,
    basicStore,
    iconName,
    sidebarName,
  };
}
