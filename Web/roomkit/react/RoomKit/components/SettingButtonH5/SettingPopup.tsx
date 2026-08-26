import { useEffect, useState } from 'react';
import {
  IconArrowStrokeSelectDown,
  IconArrowStrokeUp,
  Popup,
  Switch,
  Toast,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  MirrorType,
  VideoQuality,
  useDeviceState,
} from 'tuikit-atomicx-react/room';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import styles from './SettingPopup.module.scss';

export interface SettingPopupProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}

// Vue reference: SettingButtonH5/SettingPopup.vue (395 lines).
export function SettingPopup({ visible, onVisibleChange }: SettingPopupProps) {
  const { t } = useUIKit();
  const {
    isFrontCamera,
    localMirrorType,
    switchMirror,
    localVideoQuality,
    updateVideoQuality,
    networkInfo,
  } = useDeviceState();

  const [isResolutionPopupVisible, setResolutionPopupVisible] = useState(false);
  const [isQualityCheckPopupVisible, setQualityCheckPopupVisible] = useState(false);
  const [isLocalMirror, setIsLocalMirror] = useState(
    () => isFrontCamera && localMirrorType !== MirrorType.Disable,
  );

  useEffect(() => {
    setIsLocalMirror(isFrontCamera && localMirrorType !== MirrorType.Disable);
  }, [localMirrorType, isFrontCamera]);

  const handleClose = () => {
    onVisibleChange(false);
  };

  const handleLocalMirrorChange = async (value: boolean) => {
    if (!isFrontCamera) {
      return;
    }
    if (value) {
      await switchMirror({ mirror: MirrorType.Enable });
      Toast.success({ message: t('Setting.SetMirrorSuccess') });
    } else {
      await switchMirror({ mirror: MirrorType.Disable });
      Toast.success({ message: t('Setting.CancelMirrorSuccess') });
    }
  };

  const resolutionOptions: Array<{ label: string; value: VideoQuality }> = [
    { label: t('Setting.LowDefinition'), value: VideoQuality.Quality360P },
    { label: t('Setting.StandardDefinition'), value: VideoQuality.Quality540P },
    { label: t('Setting.HighDefinition'), value: VideoQuality.Quality720P },
    { label: t('Setting.SuperDefinition'), value: VideoQuality.Quality1080P },
  ];
  const currentResolutionLabel = resolutionOptions.find(
    option => option.value === localVideoQuality,
  )?.label;

  const handleResolutionClick = (value: VideoQuality) => {
    updateVideoQuality({ quality: value });
    setResolutionPopupVisible(false);
  };

  return (
    <>
      <Popup
        visible={visible}
        onUpdateVisible={onVisibleChange}
        placement="bottom"
      >
        <div className={styles.settingPopupContainer}>
          <PopUpArrowDown onClick={handleClose} />
          <div className={styles.settingPopupContent}>
            <div className={styles.sectionTitle}>
              {t('Setting.VideoSetting')}
            </div>
            <div className={styles.settingSection}>
              <div
                className={styles.settingItem}
                onClick={() => setResolutionPopupVisible(true)}
              >
                <span className={styles.settingLabel}>
                  {t('Setting.Resolution')}
                </span>
                <div className={styles.settingValue}>
                  <span className={styles.settingValueText}>
                    {currentResolutionLabel}
                  </span>
                  <IconArrowStrokeSelectDown size="12" />
                </div>
              </div>
              <div className={styles.settingItem}>
                <span
                  className={classNames(styles.settingLabel, {
                    [styles.disabled]: !isFrontCamera,
                  })}
                >
                  {t('Setting.LocalMirror')}
                </span>
                <Switch
                  value={isLocalMirror}
                  disabled={!isFrontCamera}
                  onChange={(value) => {
                    setIsLocalMirror(value);
                    handleLocalMirrorChange(value);
                  }}
                />
              </div>
            </div>
            <div className={styles.sectionTitle}>
              {t('Setting.OtherSetting')}
            </div>
            <div className={styles.settingSection}>
              <div
                className={styles.settingItem}
                onClick={() => setQualityCheckPopupVisible(true)}
              >
                <span className={styles.settingLabel}>
                  {t('Setting.QualityCheck')}
                </span>
                <IconArrowStrokeSelectDown
                  size="12"
                  className={styles.qualityCheckArrow}
                />
              </div>
            </div>
          </div>
        </div>
      </Popup>

      <Popup
        visible={isResolutionPopupVisible}
        onUpdateVisible={setResolutionPopupVisible}
        placement="bottom"
      >
        <div className={styles.resolutionPopupContainer}>
          <PopUpArrowDown onClick={() => setResolutionPopupVisible(false)} />
          <div className={styles.resolutionPopupContent}>
            {resolutionOptions.map(option => (
              <div
                key={option.value}
                className={classNames(styles.resolutionItem, {
                  [styles.selected]: localVideoQuality === option.value,
                })}
                onClick={() => handleResolutionClick(option.value)}
              >
                <span className={styles.resolutionItemText}>{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Popup>

      <Popup
        visible={isQualityCheckPopupVisible}
        onUpdateVisible={setQualityCheckPopupVisible}
        placement="bottom"
      >
        <div className={styles.qualityPopupContainer}>
          <PopUpArrowDown onClick={() => setQualityCheckPopupVisible(false)} />
          <div className={styles.qualityPopupContent}>
            <div className={styles.sectionTitle}>
              {t('Setting.NetworkQuality')}
            </div>
            <div className={styles.qualitySection}>
              <div className={styles.qualityItem}>
                <span className={styles.settingLabel}>
                  {t('Network.Latency')}
                </span>
                <span className={styles.settingValue}>
                  {networkInfo?.delay ?? 0}
                  {' '}
                  ms
                </span>
              </div>
              <div className={styles.qualityItem}>
                <span className={styles.settingLabel}>
                  {t('Network.PacketLoss')}
                </span>
                <div className={styles.packetLossContainer}>
                  <div className={styles.packetLossItem}>
                    <span className={styles.itemValue}>
                      {networkInfo?.upLoss ?? 0}
                      %
                    </span>
                    <IconArrowStrokeUp
                      className={classNames(styles.arrowIcon, styles.arrowUp)}
                    />
                  </div>
                  <div className={styles.packetLossItem}>
                    <span className={styles.itemValue}>
                      {networkInfo?.downLoss ?? 0}
                      %
                    </span>
                    <IconArrowStrokeUp
                      className={classNames(styles.arrowIcon, styles.arrowDown)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </>
  );
}
