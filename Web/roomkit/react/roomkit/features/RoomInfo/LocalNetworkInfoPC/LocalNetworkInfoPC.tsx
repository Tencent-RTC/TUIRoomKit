import { NetworkQuality, useDeviceState } from 'tuikit-atomicx-react/room';
import { IconArrowRight, IconClose } from '../../../base';
import { useI18n } from '../../../i18n';
import TopbarButton from '../../../layouts/TopbarButton';
import './LocalNetworkInfoPC.scss';

/**
 * Four steps, as in the previous RoomKit: a dropped connection reads differently from
 * a bad one. Lit bars stand for the level; the rest stay in place at low opacity.
 */
const LEVELS = {
  [NetworkQuality.Excellent]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Good]: { level: 'stability', label: 'Network.Stability' },
  [NetworkQuality.Poor]: { level: 'fluctuation', label: 'Network.Fluctuation' },
  [NetworkQuality.Bad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.VeryBad]: { level: 'lag', label: 'Network.Lag' },
  [NetworkQuality.Down]: { level: 'disconnected', label: 'Network.Disconnected' },
} as const;

export function LocalNetworkInfoPC() {
  const { t } = useI18n();
  const { networkInfo } = useDeviceState();

  /** Unknown has nothing to report, so the chip stays out of the topbar until stats arrive */
  const quality = networkInfo?.quality ?? NetworkQuality.Unknown;
  const state = LEVELS[quality as keyof typeof LEVELS] ?? null;

  /**
   * Both loss figures share the one label the previous RoomKit used; the arrow tells the
   * direction apart, the way it did there.
   */
  const metrics = [
    { id: 'delay', label: 'Network.Latency', value: networkInfo?.delay ?? 0, unit: 'ms', direction: null },
    { id: 'up', label: 'Network.PacketLoss', value: networkInfo?.upLoss ?? 0, unit: '%', direction: 'up' },
    { id: 'down', label: 'Network.PacketLoss', value: networkInfo?.downLoss ?? 0, unit: '%', direction: 'down' },
  ];

  if (!state) {
    return null;
  }

  return (
    <TopbarButton
      dropdownSlot={({ close }) => (
        <div className="local-network-panel">
          <header className="local-network-panel-head">
            <span className="local-network-panel-title">{t(state.label)}</span>
            <button
              className="local-network-panel-close"
              type="button"
              aria-label={t('Network.Close')}
              onClick={close}
            >
              <IconClose size={12} />
            </button>
          </header>

          <div className="local-network-panel-metrics">
            {metrics.map(metric => (
              <div key={metric.id} className="local-network-metric">
                <span className="local-network-metric-label">
                  {t(metric.label)}
                  {metric.direction && (
                    <IconArrowRight
                      size={14}
                      className={`local-network-metric-arrow local-network-metric-arrow-${metric.direction}`}
                    />
                  )}
                </span>
                <span className="local-network-metric-value">
                  {metric.value}
                  <span className="local-network-metric-unit">{metric.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    >
      <span className={`local-network-info local-network-info-${state.level}`}>
        <i />
        <i />
        <i />
      </span>
    </TopbarButton>
  );
}

export default LocalNetworkInfoPC;
