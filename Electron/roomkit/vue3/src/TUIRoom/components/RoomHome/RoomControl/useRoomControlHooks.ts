import i18n from '../../../locales/index';
import { computed } from 'vue';
import { useI18n } from '../../../locales';
export default function useRoomControl() {
  const isEN = computed(() => i18n.global.locale.value === 'en-US');

  const { t } = useI18n();

  return {
    isEN,
    t,
  };
}
