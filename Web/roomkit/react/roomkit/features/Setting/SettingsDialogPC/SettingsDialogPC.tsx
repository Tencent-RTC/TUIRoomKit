import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  IconCam,
  IconChevron,
  IconClose,
  IconImage,
  IconMic,
  IconSettings,
  IconShare,
} from '../../../base';
import type { IconProps } from '../../../base';
import { useModality, useOverlay, useVisibleCenter } from '../../../base/headless';
import { useI18n } from '../../../i18n';
import AudioSettings from '../../Device/AudioSettings';
import VideoSettings from '../../Device/VideoSettings/index';
import ShareSettings from '../../ScreenShare/ShareSettings/ShareSettings';
import GeneralSettings from '../GeneralSettings/GeneralSettings';
import VideoEffectSettings from './VideoEffectSettings';
import './SettingsDialogPC.scss';

export type SettingsTab = 'audio' | 'video' | 'videoEffect' | 'share' | 'general';

interface SettingsTabConfig {
  id: SettingsTab;
  icon: ComponentType<IconProps>;
  labelKey: string;
  titleKey: string;
  component: ComponentType;
}

/** Tab order matches the design nav; VideoEffectSettings composes the two feature pages. */
const TABS: SettingsTabConfig[] = [
  { id: 'audio', icon: IconMic, labelKey: 'Settings.TabAudio', titleKey: 'Settings.AudioTitle', component: AudioSettings },
  { id: 'video', icon: IconCam, labelKey: 'Settings.TabVideo', titleKey: 'Settings.VideoTitle', component: VideoSettings },
  { id: 'videoEffect', icon: IconImage, labelKey: 'Settings.TabVideoEffect', titleKey: 'Settings.VideoEffectTitle', component: VideoEffectSettings },
  { id: 'share', icon: IconShare, labelKey: 'Settings.TabShare', titleKey: 'Settings.ShareTitle', component: ShareSettings },
  { id: 'general', icon: IconSettings, labelKey: 'Settings.TabGeneral', titleKey: 'Settings.GeneralTitle', component: GeneralSettings },
];

export interface SettingsDialogPCProps {
  open: boolean;
  activeTab: SettingsTab;
  onClose?: () => void;
  onSelect?: (tab: SettingsTab) => void;
}

const NAV_COMPACT_WIDTH = 560;

export function SettingsDialogPC(props: SettingsDialogPCProps) {
  const { open, activeTab, onClose, onSelect } = props;
  const { t } = useI18n();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [compactNav, setCompactNav] = useState(false);
  const compactNavRef = useRef(false);
  const currentTab = TABS.find(tab => tab.id === activeTab) ?? TABS[0];

  const navCompactObserverRef = useRef<ResizeObserver | null>(null);

  const updateCompactNav = useCallback((width: number) => {
    const next = width > 0 && width < NAV_COMPACT_WIDTH;
    if (compactNavRef.current && !next) {
      setNavOpen(false);
    }
    compactNavRef.current = next;
    setCompactNav(next);
  }, []);

  const bindNavCompactObserver = useCallback((el: HTMLElement | null) => {
    navCompactObserverRef.current?.disconnect();
    navCompactObserverRef.current = null;
    if (!el) {
      return;
    }
    navCompactObserverRef.current = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      updateCompactNav(width);
    });
    navCompactObserverRef.current.observe(el);
  }, [updateCompactNav]);

  const setPanelRef = useCallback((el: HTMLDivElement | null) => {
    panelRef.current = el;
    bindNavCompactObserver(el);
  }, [bindNavCompactObserver]);

  function selectTab(id: SettingsTab) {
    onSelect?.(id);
    if (compactNav) {
      setNavOpen(false);
    }
  }

  const isFirstOpenRunRef = useRef(true);
  useEffect(() => {
    if (isFirstOpenRunRef.current) {
      isFirstOpenRunRef.current = false;
      return;
    }
    if (!open) {
      setNavOpen(false);
      return;
    }
    if (panelRef.current) {
      updateCompactNav(panelRef.current.offsetWidth);
    }
  }, [open, updateCompactNav]);

  useEffect(() => () => {
    navCompactObserverRef.current?.disconnect();
  }, []);

  const { host, zIndex, ctx } = useOverlay({
    lane: 'dialog',
    open,
    closeOnOutside: false,
    modal: true,
    onClose: () => onClose?.(),
  }, [panelRef]);

  useModality(open, panelRef, ctx?.root);
  const { x, y } = useVisibleCenter(host, panelRef, open);

  function onMaskClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) {
      return;
    }
    onClose?.();
  }

  if (!host) {
    return null;
  }

  const CurrentTabComponent = currentTab.component;

  return createPortal(
    open
      ? (
        <div
          className="settings-mask"
          style={{ zIndex }}
          onClick={onMaskClick}
        >
          <div
            ref={setPanelRef}
            className={[
              'settings-dialog',
              compactNav ? 'is-nav-compact' : '',
              navOpen ? 'is-nav-open' : '',
            ].filter(Boolean).join(' ')}
            role="dialog"
            aria-modal="true"
            aria-label={t('Settings.Title')}
            tabIndex={-1}
            style={{ left: `${x}px`, top: `${y}px` }}
          >
            {compactNav && navOpen && (
              <div
                className="settings-nav-backdrop"
                onClick={() => setNavOpen(false)}
              />
            )}
            <nav className="settings-nav" aria-label={t('Settings.Nav')}>
              <div className="settings-nav-title">
                {t('Settings.Title')}
              </div>
              {TABS.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={['settings-nav-item', tab.id === activeTab ? 'is-active' : ''].filter(Boolean).join(' ')}
                    type="button"
                    aria-current={tab.id === activeTab}
                    onClick={() => selectTab(tab.id)}
                  >
                    <TabIcon />
                    <span className="settings-nav-name">{t(tab.labelKey)}</span>
                  </button>
                );
              })}
            </nav>

            <section className="settings-content">
              <header className="settings-header">
                {compactNav && (
                  <button
                    className="settings-nav-toggle"
                    type="button"
                    aria-label={navOpen ? t('Settings.CloseNav') : t('Settings.OpenNav')}
                    aria-expanded={navOpen}
                    onClick={() => setNavOpen(!navOpen)}
                  >
                    <IconChevron size={16} />
                  </button>
                )}
                <h3 className="settings-content-title">{t(currentTab.titleKey)}</h3>
                <button
                  className="settings-close"
                  type="button"
                  aria-label={t('Settings.Close')}
                  onClick={() => onClose?.()}
                >
                  <IconClose />
                </button>
              </header>
              <div className="settings-body">
                <CurrentTabComponent />
              </div>
            </section>
          </div>
        </div>
      )
      : null,
    host,
  );
}

export default SettingsDialogPC;
