import { inviteNotification } from './Notification/InviteNotification';
import { WidgetsManager } from '../../../services/manager/widgetsManager';
const widgetsProvider = {
  notification: {
    openInviteNotification: inviteNotification.openInviteNotification,
  },
};
export default function initWidgets(widgetsManager: WidgetsManager) {
  widgetsManager.registerNotificationProvider(widgetsProvider);
}
