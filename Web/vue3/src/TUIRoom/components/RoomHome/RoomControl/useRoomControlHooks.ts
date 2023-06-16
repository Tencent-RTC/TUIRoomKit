import i18n from '../../../../TUIRoom/locales/index';
import { ref, computed } from 'vue';
import { useI18n } from '../../../locales';
import logoCn from '../../../assets/imgs/logo.png';
import logoEn from '../../../assets/imgs/logo-en.png';
export default function useRoomControl() {
  const logo = computed(() => (i18n.global.locale.value === 'zh-CN' ? logoCn : logoEn));
  const isEN = computed(() => i18n.global.locale.value === 'en-US');
  const showCreateRoomOption = ref(false);

  const { t } = useI18n();


  return {
    logo,
    isEN,
    logoEn,
    t,
    showCreateRoomOption,
  };
}
