interface ITrackingManager {
  sendMessage: (cmd: string) => void;
  registerProvider: (provider: any) => void;
}

export class TrackingManager implements ITrackingManager {
  private provider: any;

  constructor() {
    this.provider = null;
  }

  public registerProvider = (provider: any): void => {
    this.provider = provider;
  };

  public sendMessage = (cmd: string): void => {
    if (this.provider) {
      this.provider.sendMessage(cmd, {});
    }
  };
}
