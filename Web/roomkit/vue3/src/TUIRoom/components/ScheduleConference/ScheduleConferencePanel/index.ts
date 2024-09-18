import ScheduleConferencePanelH5 from './ScheduleConferencePanelH5.vue';
import ScheduleConferencePanelPC from './ScheduleConferencePanelPC.vue';
import { isMobile } from '../../../utils/environment';

const ScheduleConferencePanel = isMobile
  ? ScheduleConferencePanelH5
  : ScheduleConferencePanelPC;

export default ScheduleConferencePanel;
