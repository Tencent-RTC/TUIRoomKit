import RoomMessageCardVue from './RoomMessageCard/RoomMessageCard.vue';
import { chatExtension } from './chatExtension';
import VoidTemplate from './VoidTemplate.vue';
import { VueVersion } from './utils/common';

const RoomMessageCard = VueVersion >= 3 ? RoomMessageCardVue : VoidTemplate;
export { RoomMessageCard, chatExtension };
