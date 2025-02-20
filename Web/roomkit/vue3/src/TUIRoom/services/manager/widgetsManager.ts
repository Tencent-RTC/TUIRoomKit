import { IRoomService } from '../types';
type NotificationProps = {
  appendTo?: string | undefined;
  customClass?: string;
  message: object;
  onConfirm?: () => Promise<void>;
  onCancel?: () => Promise<void>;
  confirmButtonText?: string;
  cancelButtonText?: string;
  duration?: number;
};

export class WidgetsManager {
  static instance?: WidgetsManager;
  private service: IRoomService;
  public notification: {
    openInviteNotification: (options: NotificationProps) => void;
  } | null = null;

  constructor(service: IRoomService) {
    this.service = service;
  }

  static getInstance(ctx: IRoomService): WidgetsManager {
    if (!WidgetsManager.instance) {
      WidgetsManager.instance = new WidgetsManager(ctx);
    }
    return WidgetsManager.instance;
  }

  static destroyInstance(): void {
    if (!WidgetsManager.instance) return;
    WidgetsManager.instance = undefined;
  }

  public registerNotificationProvider(provider: { notification: any }): void {
    this.notification = provider.notification;
  }
}
