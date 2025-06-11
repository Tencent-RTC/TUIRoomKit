import TUIRoomEngine, {
  TUIRoomEvents,
  TUIRequest,
  TUIRequestAction,
} from '@tencentcloud/tuiroom-engine-js';
import useRoomEngine from '../../hooks/useRoomEngine';

const roomEngine = useRoomEngine();

export default class RequestEventManager {
  static instance: RequestEventManager;
  private store: any;
  constructor(options: { store: any }) {
    if (!RequestEventManager.instance) {
      RequestEventManager.instance = this;
    }
    this.store = options.store;
    this.onRequestReceived = this.onRequestReceived.bind(this);
    this.onRequestCancelled = this.onRequestCancelled.bind(this);
    this.onRequestProcessed = this.onRequestProcessed.bind(this);

    this.bindRoomEngineEvents();
    return RequestEventManager.instance;
  }

  private onRequestReceived(eventInfo: { request: TUIRequest }) {
    const { userId, requestAction } = eventInfo.request;
    if (!this.store.getUserInfo(userId)) {
      return;
    }
    switch (requestAction) {
      case TUIRequestAction.kRequestToTakeSeat:
        this.store.addSeatApplicationRequest(eventInfo.request);
        break;
      case TUIRequestAction.kRequestRemoteUserOnSeat:
        this.store.setSeatInvitationRequest(eventInfo.request);
        break;
      default:
        break;
    }
  }

  // The remote user cancels the application to connect to the stage
  private onRequestCancelled(eventInfo: {
    request: TUIRequest;
    userInfo: string;
  }) {
    const { requestAction } = eventInfo.request;
    switch (requestAction) {
      case TUIRequestAction.kRequestToTakeSeat:
        this.store.removeSeatApplicationRequest(eventInfo.request);
        break;
      case TUIRequestAction.kRequestRemoteUserOnSeat:
        this.store.setSeatInvitationRequest(null);
        break;
      default:
        break;
    }
  }

  // The remote user's request is handled by other administrators/hosts.
  private onRequestProcessed(eventInfo: {
    request: TUIRequest;
    userInfo: string;
  }) {
    const { requestAction } = eventInfo.request;
    switch (requestAction) {
      case TUIRequestAction.kRequestToTakeSeat:
        this.store.removeSeatApplicationRequest(eventInfo.request);
        break;
      case TUIRequestAction.kRequestRemoteUserOnSeat:
        this.store.setSeatInvitationRequest(null);
        break;
      default:
        break;
    }
  }

  private bindRoomEngineEvents() {
    TUIRoomEngine.once('ready', () => {
      roomEngine.instance?.on(
        TUIRoomEvents.onRequestReceived,
        this.onRequestReceived
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onRequestCancelled,
        this.onRequestCancelled
      );
      roomEngine.instance?.on(
        TUIRoomEvents.onRequestProcessed,
        this.onRequestProcessed
      );
    });
  }
}
