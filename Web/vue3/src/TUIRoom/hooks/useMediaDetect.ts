import { useI18n } from '../locales';
import TUIMessageBox from '../components/common/base/MessageBox/index';
import { onBeforeMount } from 'vue';
import { isWeChat } from '../utils/useMediaValue';
const isGetUserMediaSupported = isWeChat ? true : navigator?.mediaDevices && navigator?.mediaDevices.getUserMedia && typeof navigator?.mediaDevices.getUserMedia === 'function';
export default function () {
  const { t } = useI18n();
  function mediaDetect() {
    if (!isGetUserMediaSupported) {
      TUIMessageBox({
        title: t('Note'),
        message: t('The current browser does not support the use of media devices'),
        appendToRoomContainer: true,
        confirmButtonText: t('Sure'),
      });
    }
  }
  onBeforeMount(() => {
    mediaDetect();
  });

  return {
    isGetUserMediaSupported,
  };
}
