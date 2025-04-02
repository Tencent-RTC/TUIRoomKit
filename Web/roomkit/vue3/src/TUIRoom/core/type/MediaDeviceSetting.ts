export enum MediaDeviceState {
  NoDeviceDetected = 'NoDeviceDetected',
  NotSupportCapture = 'NotSupportCapture',
  DeviceOff = 'DeviceOff',
  DeviceOn = 'DeviceOn',
  DeviceOffAndDisabled = 'DeviceOffAndDisabled',
}

export enum MediaSettingDisplayMode {
  Icon = 'Icon',
  IconWithPanel = 'IconWithPanel',
  Panel = 'Panel',
}

export interface VideoSettingProps {
  displayMode: MediaSettingDisplayMode;
  supportSwitchCamera?: boolean;
  supportSwitchResolution?: boolean;
  supportVideoPreview?: boolean;
  supportSwitchMirror?: boolean;
}

export interface AudioSettingProps {
  displayMode: MediaSettingDisplayMode;
  supportSwitchMicrophone?: boolean;
  supportSwitchSpeaker?: boolean;
  supportAudioLevel?: boolean;
}
