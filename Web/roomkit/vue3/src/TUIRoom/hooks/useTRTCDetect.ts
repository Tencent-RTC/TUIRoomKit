import { useI18n } from '../locales';
import TUIMessageBox from '../components/common/base/MessageBox/index';
import { onBeforeMount, ref } from 'vue';
import {
  isGetUserMediaSupported,
  isEnumerateDevicesSupported,
} from '../utils/mediaAbility';
import RTCDetect from 'rtc-detect';

const isSupportTRTC = ref(true);
const detect = new RTCDetect();
detect.isTRTCSupported().then((res: any) => {
  isSupportTRTC.value = !!res?.result;
});

export default function () {
  const { t } = useI18n();

  async function rtcDetect() {
    if (!isGetUserMediaSupported) {
      TUIMessageBox({
        title: t('Note'),
        message: t(
          'The current browser does not support capturing audio and video'
        ),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (!isEnumerateDevicesSupported) {
      TUIMessageBox({
        title: t('Note'),
        message: t(
          'The current browser does not support getting microphone and camera list'
        ),
        confirmButtonText: t('Sure'),
      });
      return;
    }
    if (!isSupportTRTC.value) {
      TUIMessageBox({
        title: t('Note'),
        message: t(
          'The current browser does not support audio and video communication capabilities'
        ),
        confirmButtonText: t('Sure'),
      });
    }
  }

  onBeforeMount(() => {
    rtcDetect();
  });

  return {
    isSupportTRTC,
  };
}
