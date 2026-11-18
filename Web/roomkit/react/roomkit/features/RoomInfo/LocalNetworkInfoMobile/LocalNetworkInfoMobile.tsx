import { useEffect, useState } from 'react';
import { NetworkQuality, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconArrowRight, TUIPopup } from '../../../base';
import { useI18n } from '../../../i18n';
import LocalNetworkInfoPC from '../LocalNetworkInfoPC/LocalNetworkInfoPC';
import './LocalNetworkInfoMobile.scss';

const LEVELS = {
  [NetworkQuality.Excellent]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Good]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Poor]: { level: 'fluctuation', label: 'Network.Fluctuation' },
  [NetworkQuality.Bad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.VeryBad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.Down]: { level: 'disconnected', label: 'Network.Disconnected' },
} as const;

export interface LocalNetworkInfoMobileProps {
  /** Education H5 passes this. Conference leaves it portrait and keeps the sheet. */
  orientation?: 'portrait' | 'landscape';
}

export function LocalNetworkInfoMobile(props: LocalNetworkInfoMobileProps) {
  const { orientation = 'portrait' } = props;
  const { t } = useI18n();
  const { networkInfo } = useDeviceState();

  /**
   * The engine reports Unknown while nothing is published, which is the usual H5 entry
   * state with mic and camera off. The mobile topbar keeps the bars in place, so with
   * no report there is no sign of trouble to show.
   */
  const quality = networkInfo?.quality ?? NetworkQuality.Unknown;
  const displayState = LEVELS[quality as keyof typeof LEVELS] ?? LEVELS[NetworkQuality.Good];

  /**
   * Both loss figures share the one label the previous RoomKit used; the arrow tells the
   * direction apart, the way it did there.
   */
  const metrics = [
    { id: 'delay', label: 'Network.Latency', value: networkInfo?.delay ?? 0, unit: 'ms', direction: null },
    { id: 'up', label: 'Network.PacketLoss', value: networkInfo?.upLoss ?? 0, unit: '%', direction: 'up' },
    { id: 'down', label: 'Network.PacketLoss', value: networkInfo?.downLoss ?? 0, unit: '%', direction: 'down' },
  ];

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [orientation]);

  // Landscape opens the same popover as PC. Portrait keeps the bottom sheet.
  if (orientation === 'landscape') {
    return <LocalNetworkInfoPC showWhenUnknown />;
  }

  return (
    <>
      <div
        className="local-network-info-mobile"
        role="button"
        tabIndex={0}
        aria-label={t(displayState.label)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`local-network-info-mobile-bars local-network-info-mobile-${displayState.level}`}>
          <i />
          <i />
          <i />
        </span>
      </div>

      <TUIPopup
        open={isOpen}
        height="auto"
        title={t(displayState.label)}
        onUpdateOpen={setIsOpen}
      >
        <div className="local-network-sheet-metrics">
          {metrics.map(metric => (
            <div key={metric.id} className="local-network-sheet-metric">
              <span className="local-network-sheet-label">
                {t(metric.label)}
                {metric.direction && (
                  <IconArrowRight
                    size={14}
                    className={`local-network-sheet-arrow local-network-sheet-arrow-${metric.direction}`}
                  />
                )}
              </span>
              <span className="local-network-sheet-value">
                {metric.value}
                <span className="local-network-sheet-unit">{metric.unit}</span>
              </span>
            </div>
          ))}
        </div>
      </TUIPopup>
    </>
  );
}

export default LocalNetworkInfoMobile;
