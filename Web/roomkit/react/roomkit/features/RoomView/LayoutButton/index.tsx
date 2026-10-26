import { useState } from 'react';
import { IconLayout, TUIDropdown, TUIDropdownItem } from '../../../base';
import { useI18n } from '../../../i18n';
import { RoomLayoutTemplate } from '../../../core/types';
import TopbarButton from '../../../layouts/TopbarButton';
import './index.scss';

export interface LayoutButtonProps {
  layoutTemplate: RoomLayoutTemplate;
  onUpdateLayoutTemplate?: (template: RoomLayoutTemplate) => void;
}

/** `cells` is how many blocks the preview thumbnail draws; the shape comes from CSS. */
const options = [
  { label: 'Layout.Grid', value: RoomLayoutTemplate.GridLayout, preview: 'grid', cells: 9 },
  { label: 'Layout.GalleryRight', value: RoomLayoutTemplate.SidebarLayout, preview: 'sidebar', cells: 4 },
  { label: 'Layout.GalleryTop', value: RoomLayoutTemplate.CinemaLayout, preview: 'cinema', cells: 4 },
] as const;

export function LayoutButton({
  layoutTemplate,
  onUpdateLayoutTemplate,
}: LayoutButtonProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  function handleCommand(command: string | number) {
    if (
      command === RoomLayoutTemplate.GridLayout
      || command === RoomLayoutTemplate.SidebarLayout
      || command === RoomLayoutTemplate.CinemaLayout
    ) {
      onUpdateLayoutTemplate?.(command);
    }
  }

  return (
    <TUIDropdown
      placement="bottom-end"
      onCommand={handleCommand}
      onUpdateOpen={setOpen}
      menuSlot={options.map(option => (
        <TUIDropdownItem
          key={option.value}
          command={option.value}
        >
          <span
            className={['layout-button-option', layoutTemplate === option.value ? 'is-current' : ''].filter(Boolean).join(' ')}
          >
            <span
              className={`layout-button-preview layout-button-preview-${option.preview}`}
              aria-hidden="true"
            >
              {Array.from({ length: option.cells }, (_, index) => index + 1).map(cell => <i key={cell} />)}
            </span>
            <span className="layout-button-label">{t(option.label)}</span>
          </span>
        </TUIDropdownItem>
      ))}
    >
      <TopbarButton icon={IconLayout} label={t('Layout.Title')} active={open} />
    </TUIDropdown>
  );
}

export default LayoutButton;
