import ConferenceMainView from './conference.vue';
import PreConferenceView from './preConference.vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { conference, RoomEvent, FeatureButton } from './conference';
import RoomMessageCard from './extension/RoomMessageCard/RoomMessageCard.vue';
import { roomService } from './services';
export * from './components/common/base/index';
export * from './services/manager/scheduleConferenceManager';
export {
  ConferenceMainView,
  PreConferenceView,
  TUIRoomEngine,
  roomService,
  conference,
  RoomEvent,
  FeatureButton,
  RoomMessageCard,
};

ConferenceMainView.install = (app) => {
  app.component('ConferenceView', ConferenceMainView);
};

export default ConferenceMainView;


