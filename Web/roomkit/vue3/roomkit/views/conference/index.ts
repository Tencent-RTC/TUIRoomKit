import { getPlatform } from '@tencentcloud/universal-api';
import ConferenceViewMobile from './ConferenceViewMobile.vue';
import ConferenceViewPC from './ConferenceViewPC.vue';

/**
 * The platform is read from the user agent once at load, so a static pick behaves the
 * same as switching inside a component. Anything that is not a desktop browser
 * (phones, tablets, embedded webviews) gets the mobile view.
 */
export const ConferenceView = getPlatform() === 'pc' ? ConferenceViewPC : ConferenceViewMobile;
