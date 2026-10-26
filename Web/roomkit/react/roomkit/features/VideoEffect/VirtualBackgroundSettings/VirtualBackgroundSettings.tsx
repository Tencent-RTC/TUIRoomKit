import { useEffect, useRef, useState } from 'react';
import {
  useVirtualBackgroundState,
  VirtualBackgroundEvent,
  VirtualBackgroundType,
} from 'tuikit-atomicx-react/room';
import type { VirtualBackgroundConfig } from 'tuikit-atomicx-react/room';
import { IconClose, IconVirtualBg, TUIToast } from '../../../base';
import { t, useI18n } from '../../../i18n';
import backdrop from './assets/backdrop.jpeg';
import cafe from './assets/cafe.jpeg';
import classroom from './assets/classroom.jpeg';
import cityscape from './assets/cityscape.jpeg';
import livingRoom from './assets/living-room.jpeg';
import meetingRoom from './assets/meeting-room.jpeg';
import {
  cachedBackgroundImage,
  createDefaultBackgroundOptions,
  ERR_VIRTUAL_BACKGROUND_PACKAGE_REQUIRED,
  recalledBackgroundId,
  resolveBackgroundImagePath,
  resolveSelectedBackgroundId,
  toVirtualBackgroundParams,
  VIRTUAL_BACKGROUND_ASSETS_PATH,
} from './virtualBackground';
import type { BackgroundOption, VirtualBackgroundParams } from './virtualBackground';
import './VirtualBackgroundSettings.scss';

export interface VirtualBackgroundSettingsProps {
  previewReady?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const BACKGROUND_PHOTOS = [
  { id: 'g1', imagePath: meetingRoom },
  { id: 'g2', imagePath: cafe },
  { id: 'g3', imagePath: cityscape },
  { id: 'g4', imagePath: livingRoom },
  { id: 'g5', imagePath: classroom },
  { id: 'g6', imagePath: backdrop },
];

function hydratePhotoPaths(list: BackgroundOption[]): BackgroundOption[] {
  return list.map((option) => {
    if (option.kind !== 'image') {
      return option;
    }
    const imagePath = cachedBackgroundImage(option.id);
    return imagePath ? { ...option, imagePath } : option;
  });
}

function toAtomicConfig(params: VirtualBackgroundParams): VirtualBackgroundConfig {
  if (!params.enable) {
    return { enable: false };
  }
  if (params.type === 'blur') {
    return { enable: true, type: VirtualBackgroundType.blur };
  }
  return {
    enable: true,
    type: VirtualBackgroundType.image,
    imagePath: params.imagePath,
  };
}

function showError(error: unknown, fallbackKey: string) {
  const code = (error as { code?: number } | undefined)?.code;
  const messageKey = code === ERR_VIRTUAL_BACKGROUND_PACKAGE_REQUIRED
    ? 'VirtualBackground.PackageRequired'
    : fallbackKey;
  TUIToast.error(t(messageKey));
}

function handleAbort() {
  TUIToast.error(t('VirtualBackground.Aborted'));
}

export function VirtualBackgroundSettings(props: VirtualBackgroundSettingsProps) {
  const { previewReady = true, className, style } = props;
  const { t: translate } = useI18n();
  const {
    virtualBackgroundConfig,
    initVirtualBackground,
    setVirtualBackground,
    saveVirtualBackground,
    isSupported,
    subscribeEvent,
    unsubscribeEvent,
  } = useVirtualBackgroundState();

  const [options, setOptionsState] = useState<BackgroundOption[]>(
    () => hydratePhotoPaths(createDefaultBackgroundOptions(BACKGROUND_PHOTOS)),
  );
  const [selectedId, setSelectedIdState] = useState('none');
  const [isReady, setIsReadyState] = useState(false);
  // Async flows read these between renders, like Vue refs.
  const optionsRef = useRef(options);
  const selectedIdRef = useRef(selectedId);
  const isReadyRef = useRef(isReady);
  const previewReadyRef = useRef(previewReady);
  previewReadyRef.current = previewReady;
  const configRef = useRef(virtualBackgroundConfig);
  configRef.current = virtualBackgroundConfig;
  const stateRef = useRef({
    initVirtualBackground,
    setVirtualBackground,
    saveVirtualBackground,
    isSupported,
    subscribeEvent,
    unsubscribeEvent,
  });
  stateRef.current = {
    initVirtualBackground,
    setVirtualBackground,
    saveVirtualBackground,
    isSupported,
    subscribeEvent,
    unsubscribeEvent,
  };

  function setOptions(next: BackgroundOption[]) {
    optionsRef.current = next;
    setOptionsState(next);
  }

  function setSelectedId(next: string) {
    selectedIdRef.current = next;
    setSelectedIdState(next);
  }

  function setIsReady(next: boolean) {
    isReadyRef.current = next;
    setIsReadyState(next);
  }

  function isEnvSupported() {
    try {
      return stateRef.current.isSupported();
    } catch {
      return false;
    }
  }

  function labelFor(option: BackgroundOption): string {
    if (option.kind === 'none') {
      return translate('VirtualBackground.Close');
    }
    if (option.kind === 'blur') {
      return translate('VirtualBackground.Blurred');
    }
    return translate('VirtualBackground.Custom');
  }

  function restoreSelection() {
    const config = configRef.current as VirtualBackgroundParams | undefined;
    const recalled = config?.type === 'image' ? recalledBackgroundId(config.imagePath) : undefined;
    setSelectedId(recalled ?? resolveSelectedBackgroundId(config, optionsRef.current));
  }

  async function apply(option: BackgroundOption) {
    const imagePath = await resolveBackgroundImagePath(option);
    const next = option.kind === 'image' ? { ...option, imagePath } : option;
    if (option.kind === 'image') {
      setOptions(optionsRef.current.map(item => (item.id === option.id ? next : item)));
    }
    const config = toAtomicConfig(toVirtualBackgroundParams(next));
    await stateRef.current.setVirtualBackground(config);
    // setVirtualBackground only enables the camera-test preview. Persist onto
    // the published conference stream immediately so the in-room view updates.
    await stateRef.current.saveVirtualBackground();
  }

  async function applyCurrent() {
    const current = optionsRef.current.find(item => item.id === selectedIdRef.current) ?? optionsRef.current[0];
    if (!current || !previewReadyRef.current) {
      return;
    }
    await apply(current);
  }

  async function select(id: string) {
    if (!isReadyRef.current) {
      return;
    }
    const option = optionsRef.current.find(item => item.id === id);
    if (!option) {
      return;
    }
    setSelectedId(id);
    try {
      await apply(option);
    } catch (error) {
      showError(error, 'VirtualBackground.ApplyFailed');
    }
  }

  const fnsRef = useRef({ restoreSelection, applyCurrent, isEnvSupported });
  fnsRef.current = { restoreSelection, applyCurrent, isEnvSupported };

  useEffect(() => {
    let disposed = false;
    const { subscribeEvent: subscribe, unsubscribeEvent: unsubscribe } = stateRef.current;
    subscribe(VirtualBackgroundEvent.onAbort, handleAbort);
    (async () => {
      if (!fnsRef.current.isEnvSupported()) {
        TUIToast.error(t('VirtualBackground.NotSupported'));
        return;
      }
      try {
        await stateRef.current.initVirtualBackground({ assetsPath: VIRTUAL_BACKGROUND_ASSETS_PATH });
        if (disposed) {
          return;
        }
        fnsRef.current.restoreSelection();
        setIsReady(true);
        await fnsRef.current.applyCurrent();
      } catch (error) {
        showError(error, 'VirtualBackground.InitializeFailed');
      }
    })();
    return () => {
      disposed = true;
      unsubscribe(VirtualBackgroundEvent.onAbort, handleAbort);
    };
  }, []);

  const isFirstPreviewReadyRef = useRef(true);
  useEffect(() => {
    if (isFirstPreviewReadyRef.current) {
      isFirstPreviewReadyRef.current = false;
      return;
    }
    if (previewReady && isReadyRef.current) {
      fnsRef.current.applyCurrent().catch((error: unknown) => {
        showError(error, 'VirtualBackground.ApplyFailed');
      });
    }
  }, [previewReady]);

  return (
    <div
      className={['virtual-background-settings', className ?? ''].filter(Boolean).join(' ')}
      style={style}
      role="tabpanel"
    >
      <div className="virtual-background-grid">
        {options.map(option => (
          <button
            key={option.id}
            className={[
              'virtual-background-item',
              option.id === selectedId ? 'is-active' : '',
              option.kind !== 'image' ? 'is-soft' : '',
              option.kind === 'blur' ? 'is-blur' : '',
            ].filter(Boolean).join(' ')}
            type="button"
            disabled={!isReady}
            title={labelFor(option)}
            aria-pressed={option.id === selectedId}
            onClick={() => {
              void select(option.id);
            }}
          >
            <span
              className="virtual-background-face"
              style={option.thumbnail ? { backgroundImage: option.thumbnail } : undefined}
            >
              {option.kind === 'none' && <IconClose size={22} />}
              {option.kind === 'blur' && <IconVirtualBg size={22} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default VirtualBackgroundSettings;
