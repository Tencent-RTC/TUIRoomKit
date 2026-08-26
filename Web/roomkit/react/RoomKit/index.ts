import TUIRoomEngine from '@tencentcloud/tuiroom-engine-js';
import { i18next } from '@tencentcloud/uikit-base-component-react';
import { conference } from './adapter/conference';
import { useRoomInvitation } from './hooks/useRoomInvitation';
import { useRoomInvitationH5 } from './hooks/useRoomInvitationH5';
import { enResource, zhResource } from './i18n';
import { ConferenceMainView } from './views/ConferenceMainView/index';
import { ConferenceMainViewH5 } from './views/ConferenceMainViewH5/index';
import { PreConferenceView } from './views/PreConferenceView/index';
import { PreConferenceViewH5 } from './views/PreConferenceViewH5/index';

export * from './adapter/type';
export type {
  AcceptCallParams,
  UseRoomInvitationOptions,
} from './hooks/useRoomInvitation';
export type { UseRoomInvitationH5Options } from './hooks/useRoomInvitationH5';

export const addI18n = (
  lng: string,
  resource: { translation: Record<string, unknown> },
  deep = true,
  overwrite = false,
) => {
  i18next.addResourceBundle(
    lng,
    'translation',
    resource.translation,
    deep,
    overwrite,
  );
};

addI18n('en-US', { translation: enResource });
addI18n('zh-CN', { translation: zhResource });

export {
  TUIRoomEngine,
  ConferenceMainView,
  ConferenceMainViewH5,
  PreConferenceView,
  PreConferenceViewH5,
  conference,
  useRoomInvitation,
  useRoomInvitationH5,
};

// Debug-only helper for local development / quickstart.
// Do not use secretKey-based UserSig generation in production clients.
export { genTestUserSig } from './debug/genTestUserSig';
export type {
  GenTestUserSigParams,
  GenTestUserSigResult,
} from './debug/genTestUserSig';

TUIRoomEngine.once('ready', () => {
  TUIRoomEngine.callExperimentalAPI(
    JSON.stringify({
      api: 'setFramework',
      params: {
        component: 'TUIRoomKit',
        language: 'react',
      },
    }),
  );
});
