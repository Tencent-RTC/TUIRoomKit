import { IRoomService } from '../';
import logger from '../../utils/common/logger';

interface IComponentManager {
  getComponentConfig(name: ComponentName): ComponentConfigItem;
  setComponentConfig(options: Partial<ComponentConfig>): boolean;
}

const componentNames = [
  'SwitchTheme',
  'LayoutControl',
  'RoomInfo',
  'RoomLink',
  'Language',
  'UserInfo',
  'ScreenShare',
  'FullScreen',
  'ManageMemberControl',
  'InviteControl',
  'ChatControl',
  'MoreControl',
  'VirtualBackground',
  'BasicBeauty',
  'AIControl',
] as const;

export type ComponentName = (typeof componentNames)[number];

type ComponentConfigItem = {
  visible: boolean;
  [key: string]: any;
};

export type ComponentConfig = {
  [key in ComponentName]: ComponentConfigItem;
};

const logPrefix = '[RoomService ComponentManager]';

const defaultConfig = {
  SwitchTheme: { visible: true },
  LayoutControl: { visible: true },
  RoomInfo: { visible: true },
  RoomLink: { visible: true },
  Language: { visible: true },
  UserInfo: { visible: true },
  ScreenShare: { visible: true },
  FullScreen: { visible: true },
  ManageMemberControl: { visible: true },
  InviteControl: { visible: true },
  ChatControl: { visible: true },
  MoreControl: { visible: true },
  VirtualBackground: { visible: false },
  AIControl: { visible: false },
  BasicBeauty: { visible: true },
};

export class ComponentManager implements IComponentManager {
  static instance?: ComponentManager;

  private service: IRoomService;

  private componentConfig: ComponentConfig = Object.fromEntries(
    componentNames.map(name => [
      name,
      {
        ...defaultConfig[name],
      },
    ])
  ) as ComponentConfig;

  constructor(service: IRoomService) {
    this.service = service;
  }

  static getInstance(ctx: IRoomService): ComponentManager {
    if (!ComponentManager.instance) {
      ComponentManager.instance = new ComponentManager(ctx);
    }
    return ComponentManager.instance;
  }

  static destroyInstance(): void {
    if (!ComponentManager.instance) return;
    ComponentManager.instance = undefined;
  }

  public getComponentConfig(name: ComponentName) {
    return this.componentConfig[name];
  }

  public setComponentConfig(options: Partial<ComponentConfig>) {
    try {
      Object.entries(options).forEach(([name, current]) => {
        this.componentConfig[name as ComponentName] = Object.assign(
          {},
          this.componentConfig[name as ComponentName],
          current
        );
      });
      return true;
    } catch (error) {
      logger.error(`${logPrefix}setComponentConfig error: ${error}`);
      return false;
    }
  }
}
