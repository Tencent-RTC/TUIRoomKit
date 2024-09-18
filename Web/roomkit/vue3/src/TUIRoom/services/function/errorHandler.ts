import { TUIErrorCode } from '@tencentcloud/tuiroom-engine-js';
import { EventType } from '../types';
import { isElectron } from '../../utils/environment';

type ErrorFunctionName = 'createRoom' | 'enterRoom' | 'onError';
export class ErrorHandler {
  private service: any;
  private handlerMap: Record<string, (error: any) => void> = {
    createRoom: this.handleCreateRoomError.bind(this),
    enterRoom: this.handleEnterRoomError.bind(this),
    onError: this.handleOnError.bind(this),
  };

  private mediaDeviceErrorHandler: MediaDeviceErrorHandler | null = null;

  constructor(service: any) {
    this.service = service;
  }

  public handleError(error: any, functionName: ErrorFunctionName) {
    this.handlerMap[functionName] && this.handlerMap[functionName](error);
  }

  private handleEnterRoomError(error: any) {
    if (error.code === TUIErrorCode.ERR_NEED_PASSWORD) {
      this.service.emit(EventType.ROOM_NEED_PASSWORD, error.code);
      return;
    }

    if (error.code === TUIErrorCode.ERR_WRONG_PASSWORD) {
      this.service.emit(EventType.ROOM_NOTICE_MESSAGE, {
        type: 'error',
        message: this.service.t('Wrong password, please re-enter'),
      });
      return;
    }

    let message = '';
    switch (error.code) {
      case TUIErrorCode.ERR_ROOM_ID_NOT_EXIST:
        message =
          'The room does not exist, please confirm the room number or create a room!';
        break;
      default:
        message = 'Failed to enter the meeting';
    }
    this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: this.service.t('Note'),
      message: this.service.t(message),
      confirmButtonText: this.service.t('Sure'),
      callback: async () => {
        this.service.emit(EventType.ROOM_ERROR, {
          code: error.code,
          message: error.message,
        });
        this.service.roomStore.reset();
      },
    });
  }

  private handleCreateRoomError(error: any) {
    this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
      title: this.service.t('Note'),
      message: this.service.t('Failed to initiate meeting'),
      confirmButtonText: this.service.t('Sure'),
      callback: async () => {
        this.service.emit(EventType.ROOM_ERROR, {
          code: error.code,
          message: error.message,
        });
        this.service.resetStore();
      },
    });
  }

  private handleOnError(error: any) {
    if (error.message === 'enter trtc room failed , error code : -1') {
      this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        type: 'warning',
        message: this.service.t('Failed to enter the meeting'),
        callback: () => {
          this.service.emit(EventType.ROOM_ERROR, {
            code: error.code,
            message: error.message,
          });
          this.service.resetStore();
        },
      });
    }
    if (error.code && String(error.code).indexOf('-11') === 0) {
      if (!this.mediaDeviceErrorHandler) {
        this.mediaDeviceErrorHandler = new MediaDeviceErrorHandler(
          this.service
        );
      }
      this.mediaDeviceErrorHandler.handleError(error);
    }
  }
}

type MediaDeviceType = 'camera' | 'microphone' | 'screenShare';
class MediaDeviceErrorHandler {
  private service: any;

  constructor(service: any) {
    this.service = service;
  }

  private getMediaDeviceErrorTitle(deviceType: MediaDeviceType) {
    return this.service.t('Unable to use the device', {
      deviceType: this.service.t(deviceType),
    });
  }

  private getMediaDeviceErrorMsg(deviceType: MediaDeviceType) {
    return this.service.t(
      'media device failed to open, please check the media device and try again',
      { deviceType: this.service.t(deviceType) }
    );
  }

  private getMediaDeviceNotAuthorizedMsg(deviceType: MediaDeviceType) {
    return this.service.t(
      'The current device is not authorized, please allow access to the device permissions',
      { deviceType: this.service.t(deviceType) }
    );
  }

  private getMediaDeviceOccupiedMsg(deviceType: MediaDeviceType) {
    return this.service.t(
      'The current device is occupied by other apps, try to close other apps or change the device',
      { deviceType: this.service.t(deviceType) }
    );
  }

  private getTurnOnDevicePrivilegesTitle(deviceType: MediaDeviceType) {
    return this.service.t('Turn on device privileges', {
      deviceType: this.service.t(deviceType),
    });
  }

  private getTurnOnDevicePrivilegesMsg(deviceType: MediaDeviceType) {
    return this.service.t(
      'You can go to "System Preferences - Security & Privacy - Device" to enable device permissions',
      { deviceType: this.service.t(deviceType) }
    );
  }

  public handleError(error: any) {
    let mediaType: MediaDeviceType;
    let mediaErrorTitle = '';
    let mediaErrorMsg = '';
    let cancelButtonText = '';
    let confirmButtonText = '';
    let callback = null;
    switch (error.code) {
      case TUIErrorCode.ERR_CAMERA_START_FAILED:
      case TUIErrorCode.ERR_MICROPHONE_START_FAILED:
        mediaType =
          error.code === TUIErrorCode.ERR_CAMERA_START_FAILED
            ? 'camera'
            : 'microphone';
        mediaErrorTitle = this.getMediaDeviceErrorTitle(mediaType);
        mediaErrorMsg = this.getMediaDeviceErrorMsg(mediaType);
        break;
      case TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED:
      case TUIErrorCode.ERR_MICROPHONE_NOT_AUTHORIZED:
        mediaType =
          error.code === TUIErrorCode.ERR_CAMERA_NOT_AUTHORIZED
            ? 'camera'
            : 'microphone';
        if (isElectron) {
          mediaErrorTitle = this.getTurnOnDevicePrivilegesTitle(mediaType);
          mediaErrorMsg = this.getTurnOnDevicePrivilegesMsg(mediaType);
          cancelButtonText = this.service.t('Cancel');
          confirmButtonText = this.service.t('Go to Settings');
          callback = (action: 'cancel' | 'confirm' | 'close') => {
            if (action === 'confirm') {
              this.goToPermissionSettings(mediaType);
            }
          };
        } else {
          mediaErrorTitle = this.getMediaDeviceErrorTitle(mediaType);
          mediaErrorMsg = this.getMediaDeviceNotAuthorizedMsg(mediaType);
        }
        break;
      case TUIErrorCode.ERR_CAMERA_OCCUPIED:
      case TUIErrorCode.ERR_MICROPHONE_OCCUPIED:
        mediaType =
          error.code === TUIErrorCode.ERR_CAMERA_OCCUPIED
            ? 'camera'
            : 'microphone';
        mediaErrorTitle = this.getMediaDeviceErrorTitle(mediaType);
        mediaErrorMsg = this.getMediaDeviceOccupiedMsg(mediaType);
        break;
      default:
        break;
    }
    if (mediaErrorMsg) {
      this.service.emit(EventType.ROOM_NOTICE_MESSAGE_BOX, {
        type: 'error',
        title: mediaErrorTitle,
        message: mediaErrorMsg,
        cancelButtonText,
        confirmButtonText: confirmButtonText || this.service.t('I got it'),
        callback,
      });
    }
  }

  private goToPermissionSettings(deviceType: MediaDeviceType) {
    // const { shell } = require('electron');
    const shell = { openExternal: Function };
    const privacyTypeObj = {
      camera: 'Privacy_Camera',
      microphone: 'Privacy_Microphone',
      screenShare: 'Privacy_ScreenCapture',
    };
    shell.openExternal(
      `x-apple.systempreferences:com.apple.preference.security?${privacyTypeObj[deviceType]}`
    );
  }
}
