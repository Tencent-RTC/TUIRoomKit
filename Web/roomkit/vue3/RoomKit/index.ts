import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { i18next } from '@tencentcloud/uikit-base-component-vue3';
import { conference } from './adapter/conference';
import { enResource, zhResource } from './i18n';
import ConferenceMainView from './views/ConferenceMainView/index.vue';
import ConferenceMainViewH5 from './views/ConferenceMainViewH5/index.vue';
import PreConferenceView from './views/PreConferenceView/index.vue';
import PreConferenceViewH5 from './views/PreConferenceViewH5/index.vue';

export * from './adapter/type';

export const addI18n = (lng: string, resource: any, deep = true, overwrite = false) => {
  i18next.addResourceBundle(lng, 'translation', resource.translation, deep, overwrite);
};

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export {
  ConferenceMainView,
  ConferenceMainViewH5,
  PreConferenceView,
  PreConferenceViewH5,
  TUIRoomEngine,
  conference,
};

export { useRoomInvitation } from './hooks/useRoomInvitation';
export { useRoomInvitationH5 } from './hooks/useRoomInvitationH5';

(ConferenceMainView as any).install = (app: any) => {
  app.component('ConferenceView', ConferenceMainView);
};

export default ConferenceMainView;
