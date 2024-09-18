import { version } from 'vue';
const [major] = version.split('.').map(Number);
export const VueVersion = major;
