import {
  Popup,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import { Avatar } from 'tuikit-atomicx-react/room';
import { useParticipantAction } from './useParticipantAction';
import { PopUpArrowDown } from '../base/PopUpArrowDown';
import styles from './ParticipantActionH5.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

export interface ParticipantActionH5Props {
  visible: boolean;
  participant: RoomParticipant | null;
  onVisibleChange: (visible: boolean) => void;
}

// Vue reference: RoomParticipantList/ParticipantActionH5.vue (135 lines).
// Business logic (per-participant action list) reused from atomicx-react's
// shared `useParticipantAction` hook (same hook the PC ParticipantAction uses).
//
// `useParticipantAction` inside atomicx dereferences `targetParticipant.userId`
// unconditionally, so we only mount the inner component when a participant has
// actually been selected.
export function ParticipantActionH5(props: ParticipantActionH5Props) {
  if (!props.participant) {
    return null;
  }
  return <ParticipantActionH5Inner {...props} participant={props.participant} />;
}

function ParticipantActionH5Inner({
  visible,
  participant,
  onVisibleChange,
}: ParticipantActionH5Props & { participant: RoomParticipant }) {
  useUIKit();
  const { controlList } = useParticipantAction({ targetParticipant: participant });

  const title
    = participant.nameCard || participant.userName || participant.userId;

  const handleActionClick = (handler: () => void) => {
    handler();
    onVisibleChange(false);
  };

  return (
    <Popup visible={visible} onUpdateVisible={onVisibleChange}>
      <PopUpArrowDown onClick={() => onVisibleChange(false)} />
      <div className={styles.participantActionH5}>
        <div className={styles.header}>
          <Avatar src={participant.avatarUrl} />
          <span className={styles.headerTitle}>{title}</span>
        </div>
        {controlList.map((item) => {
          const IconComponent = item.icon;
          return (
            <div
              key={item.key}
              className={styles.actionItem}
              style={item.style}
              onClick={() => handleActionClick(item.handler)}
            >
              {IconComponent && (
                <IconComponent
                  size="20"
                  className={styles.actionIcon}
                />
              )}
              <span className={styles.actionText}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </Popup>
  );
}
