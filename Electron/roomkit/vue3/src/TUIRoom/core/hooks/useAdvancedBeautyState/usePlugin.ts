import useGetRoomEngine from '../../../hooks/useRoomEngine';
import logger from '../../../utils/common/logger';
import { getPluginPath, getResourcePath } from './usePluginConfig';

const roomEngine = useGetRoomEngine();

export class BeautyPlugin {
  plugin: any;
  pluginEnabled: boolean;
  pluginId: string;

  constructor() {
    this.pluginEnabled = false;
    this.pluginId = '';
  }

  initPlugin(licenseURL: string, licenseKey: string): void {
    if (!this.plugin) {
      this.createPlugin();
    }
    const resourcePath = getResourcePath();
    if (this.plugin) {
      this.plugin.setParameter(
        JSON.stringify({ licenseURL, licenseKey, resPath: resourcePath })
      );
    }
  }

  unInitPlugin(): void {
    this.destroyPlugin();
  }

  setParameter(params: string): void {
    if (!this.plugin) {
      return;
    }
    if (!this.pluginEnabled) {
      this.pluginEnabled = true;
      this.plugin.enable();
    }
    this.plugin.setParameter(params);
  }

  clearBeautyEffect(): void {
    if (!this.plugin) {
      logger.log('clearBeautyEffect failed, plugin has not init');
      return;
    }

    const beautySetting = [
      {
        category: 4,
        effKey: '',
        effValue: 0,
        resPath: '',
        bgPath: '',
      },
    ];

    // clear background, motion, advanced makeup;
    this.plugin.setParameter(
      JSON.stringify({
        beautySetting,
      })
    );

    // clear other effects;
    this.plugin.setParameter(
      JSON.stringify({
        control: {
          clearEffect: true,
        },
      })
    );
    this.pluginEnabled = false;
    this.plugin.disable();
  }

  private createPlugin(): void {
    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    if (!trtcCloud) {
      logger.error('trtcCloud is null');
      return;
    }
    trtcCloud.setPluginCallback(
      (pluginId: string, errorCode: number, msg: string) => {
        logger.log(
          `plugin callback, pluginId:${pluginId}, errorCode:${errorCode}, msg:${msg}`
        );
      }
    );

    const pluginPath = getPluginPath();
    const currentCamera = trtcCloud.getCurrentCameraDevice();
    this.pluginId = currentCamera ? currentCamera.deviceId : '';
    trtcCloud.initPluginManager({ pixelFormat: 3, bufferType: 1 });
    this.plugin = trtcCloud.addPlugin({
      id: this.pluginId,
      path: pluginPath,
      type: 1,
    });
  }

  private destroyPlugin(): void {
    if (!this.plugin) {
      return;
    }

    const trtcCloud = roomEngine.instance?.getTRTCCloud();
    if (!trtcCloud) {
      logger.error('trtcCloud is null');
      return;
    }
    this.plugin.disable();
    trtcCloud.removePlugin(this.pluginId);
    this.plugin = null;
  }
}

const plugin = new BeautyPlugin();

export { plugin };
