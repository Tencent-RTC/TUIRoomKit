import ConferenceMainView from './conference.vue';
import PreConferenceView from './preConference.vue';
import WhiteboardView from './components/Whiteboard/index.vue';
import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import {
  conference,
  RoomEvent,
  FeatureButton,
  ThemeOption,
} from './conference';
import RoomMessageCard from './extension/RoomMessageCard/RoomMessageCard.vue';
import { chatExtension } from './extension';
import { roomService } from './services';
export * from './components/common/base/index';
export * from './services/manager/scheduleConferenceManager';
export * from './services/manager/configManager';
export {
  ConferenceMainView,
  PreConferenceView,
  TUIRoomEngine,
  roomService,
  conference,
  RoomEvent,
  FeatureButton,
  RoomMessageCard,
  WhiteboardView,
  chatExtension,
};
export type { ThemeOption };

ConferenceMainView.install = app => {
  app.component('ConferenceView', ConferenceMainView);
};

export default ConferenceMainView;
