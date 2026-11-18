import { IconMore, TUIDropdown, TUIDropdownItem, useI18n } from '@tencentcloud/roomkit-web-react';
import type { CourseMoreCommand } from './useClassSchedule';

export default function CourseMoreMenu({ live, onCommand }: { live: boolean;
  onCommand: (command: CourseMoreCommand) => void; }) {
  const { t } = useI18n();
  return (
    <TUIDropdown
      placement="bottom-end"
      onCommand={command => onCommand(command as CourseMoreCommand)}
      menuSlot={(
        <>
          <TUIDropdownItem className="preclass-more-item" command="detail">{t('Preclass.ViewDetail')}</TUIDropdownItem>
          {!live && (
            <>
              <TUIDropdownItem className="preclass-more-item" command="edit">{t('Preclass.EditClass')}</TUIDropdownItem>
              <TUIDropdownItem className="preclass-more-item" command="cancel" danger>{t('Preclass.CancelClass')}</TUIDropdownItem>
            </>
          )}
        </>
      )}
    >
      <button type="button" className="preclass-more" aria-label={t('Preclass.More')}><IconMore size={16} /></button>
    </TUIDropdown>
  );
}
