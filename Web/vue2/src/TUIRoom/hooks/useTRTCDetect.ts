import { useI18n } from '../locales';
import TUIMessageBox from '../components/common/base/MessageBox/index';
import { onBeforeMount, ref } from 'vue';
import RTCDetect from 'rtc-detect';


const isSupportTRTC = ref(true);
const detect = new RTCDetect();
export default function () {
  async function rtcDetect(t:any) {
    const res = await detect.isTRTCSupported();
    isSupportTRTC.value = !!res?.result;
    if (!isSupportTRTC.value) {
      TUIMessageBox({
        title: t('Note'),
        message: t('The current browser does not support TRTC capability'),
        appendToRoomContainer: true,
        confirmButtonText: t('Sure'),
      });
    }
  }
  onBeforeMount(() => {
    const { t } = useI18n();
    rtcDetect(t);
  });

  return {
    isSupportTRTC,
  };
}
