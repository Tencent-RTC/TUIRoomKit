import type { CSSProperties } from 'react';
import { useDeviceState, useRoomParticipantState } from 'tuikit-atomicx-react/room';
import { IconMic } from '../../../base';
import './MicLevelIcon.scss';

export interface MicLevelIconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/** Conversation sits far below the reported ceiling of 100, so the bar tops out here. */
const SPEECH_PEAK = 40;
const WAVE_MIN_SCALE = 0.3;
const WAVE_MAX_SCALE = 1;

export function MicLevelIcon(props: MicLevelIconProps) {
  const { size = 22, className, style } = props;

  const { currentMicVolume, testingMicVolume, isMicrophoneTesting } = useDeviceState();
  const { localParticipant, speakingUsers } = useRoomParticipantState();

  /**
   * Device test has its own meter. In a room, the tile reads `speakingUsers`
   * while `currentMicVolume` looks up the login id and stays 0 when the engine
   * reports the local user as "".
   */
  let volume: number;
  if (isMicrophoneTesting) {
    volume = testingMicVolume;
  } else {
    const userId = localParticipant?.userId;
    const speaking = userId ? speakingUsers.get(userId) ?? 0 : 0;
    const localEngine = speakingUsers.get('') ?? 0;
    volume = Math.max(speaking, localEngine, currentMicVolume);
  }

  /**
   * Top inset of the whole icon. The fill is a viewBox rect of the capsule
   * (y 2, height 8.5), so the cut is measured on the icon, not on the rect.
   */
  const level = Math.min(volume / SPEECH_PEAK, 1);
  const scale = WAVE_MIN_SCALE + (WAVE_MAX_SCALE - WAVE_MIN_SCALE) * level;
  const capsuleTop = 12.5;
  const capsuleHeight = 53.125;
  const waveInset = (capsuleTop + (1 - scale) * capsuleHeight).toFixed(1);

  return (
    <span
      className={['mic-level-icon', className ?? ''].filter(Boolean).join(' ')}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      <IconMic size={size} />
      {volume > 0 && (
        <svg
          className="mic-level-icon-core"
          viewBox="0 0 16 16"
          aria-hidden="true"
          style={{ clipPath: `inset(${waveInset}% 0 0 0)` }}
        >
          <rect x="5.5" y="2" width="5" height="8.5" rx="2.5" />
        </svg>
      )}
    </span>
  );
}

export default MicLevelIcon;
