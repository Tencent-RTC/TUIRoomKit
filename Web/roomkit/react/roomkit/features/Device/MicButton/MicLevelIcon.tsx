import type { CSSProperties } from 'react';
import { useDeviceState } from 'tuikit-atomicx-react/room';
import { IconMic } from '../../../base';
import './MicLevelIcon.scss';

export interface MicLevelIconProps {
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function MicLevelIcon(props: MicLevelIconProps) {
  const { size = 22, className, style } = props;

  const { currentMicVolume, testingMicVolume, isMicrophoneTesting } = useDeviceState();

  /** Device test reports its own volume; the published-mic value is empty before a room. */
  const volume = isMicrophoneTesting ? testingMicVolume : currentMicVolume;
  const levelPercent = Math.min(100, Math.max(0, volume));

  return (
    <span className={['mic-level-icon', className ?? ''].filter(Boolean).join(' ')} style={style}>
      {/* Green bar shows through the hollow mic capsule and grows from its bottom */}
      <span className="mic-level-icon-track">
        <span className="mic-level-icon-fill" style={{ height: `${levelPercent}%` }} />
      </span>
      <IconMic size={size} />
    </span>
  );
}

export default MicLevelIcon;
