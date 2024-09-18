import { isElectron, isWeChat } from '../../utils/environment';
import { IRoomService } from '../types';

interface IVirtualBackground {
  dispose(): void;
  initVirtualBackground(): Promise<void>;
  toggleVirtualBackground(enabled: boolean): Promise<void>;
  toggleTestVirtualBackground(enabled: boolean): Promise<void>;
}

export class VirtualBackground implements IVirtualBackground {
  private service: IRoomService;
  private virtualBackgroundPluginReady = false;

  private get trtcCloud() {
    return this.service.roomEngine?.instance?.getTRTCCloud();
  }

  constructor(service: IRoomService) {
    this.service = service;
    if (isElectron || isWeChat) return;
    this.bindEvent();
  }

  private bindEvent() {
    this.service.lifeCycleManager.on('unmount', this.handleUnmount);
  }

  private handleUnmount = async () => {
    await this.toggleVirtualBackground(false);
    await this.toggleTestVirtualBackground(false);
  };

  public dispose() {
    this.service.lifeCycleManager.off('unmount', this.handleUnmount);
  }

  public async initVirtualBackground(): Promise<void> {
    if (
      !this.virtualBackgroundPluginReady &&
      this.trtcCloud?.useVirtualBackground
    ) {
      await this.trtcCloud.useVirtualBackground();
      this.virtualBackgroundPluginReady = true;
    }
  }

  public async toggleVirtualBackground(enabled: boolean): Promise<void> {
    await this.initVirtualBackground();
    const { sdkAppId, userId, userSig } = this.service.basicStore;
    const params = {
      sdkAppId,
      userId,
      userSig,
      enable: enabled,
    };
    await this.trtcCloud.callExperimentalAPI(
      JSON.stringify({ api: 'enableVirtualBackground', params })
    );
  }

  public async toggleTestVirtualBackground(enabled: boolean): Promise<void> {
    await this.initVirtualBackground();
    const { sdkAppId, userId, userSig } = this.service.basicStore;
    const params = {
      sdkAppId,
      userId,
      userSig,
      enable: enabled,
    };
    await this.trtcCloud.callExperimentalAPI(
      JSON.stringify({ api: 'enableTestVirtualBackground', params })
    );
  }
}
