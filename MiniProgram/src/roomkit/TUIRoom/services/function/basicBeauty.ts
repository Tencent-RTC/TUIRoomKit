import { isElectron, isWeChat } from '../../utils/environment';
import { IRoomService } from '../types';
import { TRTCBeautyStyle } from '../../constants/room';

interface IBasicBeauty {
  dispose(): void;
  initBasicBeauty(): Promise<void>;
  setBasicBeauty(
    style: TRTCBeautyStyle,
    beautyLevel: number,
    whitenessLevel: number,
    ruddinessLevel: number
  ): Promise<void>;
  setTestBasicBeauty(
    style: TRTCBeautyStyle,
    beautyLevel: number,
    whitenessLevel: number,
    ruddinessLevel: number
  ): Promise<void>;
}

export class BasicBeauty implements IBasicBeauty {
  constructor(service: IRoomService) {
    this.service = service;
    if (isElectron || isWeChat) return;
    this.bindEvent();
  }

  public dispose() {
    this.service.lifeCycleManager.off('unmount', this.handleUnmount);
  }

  public async initBasicBeauty(): Promise<void> {
    if (!this.basicBeautyPluginReady && this.trtcCloud?.useBeautyStyle) {
      await this.trtcCloud.useBeautyStyle();
      this.basicBeautyPluginReady = true;
    }
  }

  public async setBasicBeauty(
    style: TRTCBeautyStyle,
    beautyLevel: number,
    whitenessLevel: number,
    ruddinessLevel: number
  ): Promise<void> {
    await this.initBasicBeauty();
    await this.trtcCloud.setBeautyStyle(
      style,
      beautyLevel,
      whitenessLevel,
      ruddinessLevel
    );
  }

  public async setTestBasicBeauty(
    style: TRTCBeautyStyle,
    beautyLevel: number,
    whitenessLevel: number,
    ruddinessLevel: number
  ): Promise<void> {
    await this.initBasicBeauty();
    await this.trtcCloud.callExperimentalAPI(
      JSON.stringify({
        api: 'enableTestBeautyStyle',
        params: { style, beautyLevel, whitenessLevel, ruddinessLevel },
      })
    );
  }

  private service: IRoomService;
  private basicBeautyPluginReady = false;

  private get trtcCloud() {
    return this.service.roomEngine?.instance?.getTRTCCloud();
  }

  private bindEvent() {
    this.service.lifeCycleManager.on('unmount', this.handleUnmount);
  }

  private handleUnmount = async () => {
    await this.setBasicBeauty(TRTCBeautyStyle.TRTCBeautyStyleNature, 0, 0, 0);
    await this.setTestBasicBeauty(
      TRTCBeautyStyle.TRTCBeautyStyleNature,
      0,
      0,
      0
    );
  };
}
