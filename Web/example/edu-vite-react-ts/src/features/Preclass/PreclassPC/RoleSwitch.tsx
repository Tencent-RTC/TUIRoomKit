import { TUISegmented, useI18n } from '@tencentcloud/roomkit-web-react';
import { useClassRole, switchClassRole } from '../classRole';
import type { ClassRole } from '../types';

export default function RoleSwitch() {
  const { t } = useI18n();
  const role = useClassRole();
  return (
    <div className="preclass-role" aria-label={t('Preclass.Identity')}>
      <TUISegmented
        size="sm"
        modelValue={role}
        options={[
          { value: 'teacher', label: t('Preclass.RoleTeacher') },
          { value: 'student', label: t('Preclass.RoleStudent') },
        ]}
        onUpdateModelValue={value => switchClassRole(value as ClassRole)}
      />
    </div>
  );
}
