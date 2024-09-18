import RoomMessageCardVue from './RoomMessageCard/RoomMessageCard.vue';
import VoidTemplate from './VoidTemplate.vue';
import { VueVersion } from './utils/common';

const RoomMessageCard = VueVersion >= 3 ? RoomMessageCardVue : VoidTemplate;
export { RoomMessageCard };
