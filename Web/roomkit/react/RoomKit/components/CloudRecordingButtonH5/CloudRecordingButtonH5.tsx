import {
  IconRecording,
  IconStartRecord,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { IconButtonH5 } from '../base/IconButtonH5';
import { useCloudRecordingAction } from '../CloudRecording/useCloudRecordingAction';

// Vue reference: CloudRecording/CloudRecordingButtonH5.vue.
export function CloudRecordingButtonH5() {
  const { t } = useUIKit();
  const { isRecording, handleRecordingClick } = useCloudRecordingAction();
  return (
    <IconButtonH5
      title={
        isRecording
          ? t('CloudRecording.RecordingLabel')
          : t('CloudRecording.RecordLabel')
      }
      onClick={handleRecordingClick}
    >
      {isRecording ? <IconRecording size="24" /> : <IconStartRecord size="24" />}
    </IconButtonH5>
  );
}
