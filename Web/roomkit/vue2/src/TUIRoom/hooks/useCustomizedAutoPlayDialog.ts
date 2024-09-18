import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import useGetRoomEngine from './useRoomEngine';
import TUIMessageBox from '../components/common/base/MessageBox';
import { useI18n } from '../locales';

const roomEngine = useGetRoomEngine();

let isShowAutoPlayDialog = false;

export default function () {
  const { t } = useI18n();

  TUIRoomEngine.once('ready', () => {
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    trtcCloud.callExperimentalAPI(
      JSON.stringify({
        api: 'enableAutoPlayDialog',
        params: { enable: 0 },
      })
    );
    trtcCloud.on('onAutoPlayFailed', () => {
      if (!isShowAutoPlayDialog) {
        isShowAutoPlayDialog = true;
        TUIMessageBox({
          title: t('Attention'),
          message: t(
            'Audio playback failed. Click the "Confirm" to resume playback'
          ),
          confirmButtonText: t('Confirm'),
          callback: () => {
            isShowAutoPlayDialog = false;
          },
        });
      }
    });
  });
}
