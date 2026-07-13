import { IconRecording, IconStartRecord, useUIKit } from '@tencentcloud/uikit-base-component-react';
import { IconButton } from '../base/IconButton';
import { useCloudRecordingAction } from './useCloudRecordingAction';

export function CloudRecordingButton() {
  const { t } = useUIKit();
  const { isRecording, handleRecordingClick } = useCloudRecordingAction();

  return (
    <IconButton
      title={isRecording ? t('CloudRecording.RecordingLabel') : t('CloudRecording.RecordLabel')}
      onClickIcon={handleRecordingClick}
    >
      {isRecording ? <IconRecording size="24" /> : <IconStartRecord size="24" />}
    </IconButton>
  );
}
