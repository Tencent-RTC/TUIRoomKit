import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  IconSearch,
  useUIKit,
} from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  DeviceStatus,
  RoomParticipantRole,
  RoomParticipantStatus,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { combineComparators, createComparator } from '../../utils/compare';
import { ParticipantActionH5 } from './ParticipantActionH5';
import { ParticipantItemH5 } from './ParticipantItemH5';
import { PendingParticipantItemH5 } from './PendingParticipantItemH5';
import { RoomActionH5 } from './RoomActionH5';
import styles from './RoomParticipantListH5.module.scss';
import type { RoomParticipant } from 'tuikit-atomicx-react/room';

type Tab = 'joined' | 'unjoined';

function makeComparator(localUserId?: string) {
  return combineComparators<RoomParticipant>(
    createComparator(p => Boolean(p.userId === localUserId)),
    createComparator(p => Boolean(p.role === RoomParticipantRole.Owner)),
    createComparator(p => Boolean(p.role === RoomParticipantRole.Admin)),
    createComparator(p => Boolean(p.screenShareStatus === DeviceStatus.On)),
    createComparator(
      p =>
        Boolean(
          p.cameraStatus === DeviceStatus.On
          && p.microphoneStatus === DeviceStatus.On,
        ),
    ),
    createComparator(p => Boolean(p.cameraStatus === DeviceStatus.On)),
    createComparator(p => Boolean(p.microphoneStatus === DeviceStatus.On)),
    createComparator(p => Boolean(p.roomStatus === RoomParticipantStatus.InCalling)),
  );
}

// Vue reference: RoomParticipantList/RoomParticipantListH5.vue (293 lines).
export function RoomParticipantListH5() {
  const { t } = useUIKit();
  const { currentRoom, callUserToRoom } = useRoomState();
  const {
    participantList,
    pendingParticipantList,
    localParticipant,
    participantListCursor,
    getParticipantList,
  } = useRoomParticipantState();

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('joined');
  const [selectedParticipant, setSelectedParticipant]
    = useState<RoomParticipant | null>(null);
  const [actionPopupVisible, setActionPopupVisible] = useState(false);

  const roomId = currentRoom?.roomId;
  const cursorRef = useRef(participantListCursor);
  cursorRef.current = participantListCursor;
  useEffect(() => {
    if (roomId && cursorRef.current === '') {
      getParticipantList({ cursor: cursorRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const comparator = useMemo(
    () => makeComparator(localParticipant?.userId),
    [localParticipant?.userId],
  );

  const showParticipantList = useMemo(() => {
    const list
      = activeTab === 'joined' ? participantList : pendingParticipantList;
    return [...list].sort(comparator);
  }, [activeTab, participantList, pendingParticipantList, comparator]);

  const filteredParticipants = useMemo(() => {
    if (!searchText.trim()) {
      return showParticipantList;
    }
    const q = searchText.toLowerCase();
    return showParticipantList.filter(
      p =>
        (p.userName ?? '').toLowerCase().includes(q)
        || (p.nameCard ?? '').toLowerCase().includes(q)
        || (p.userId ?? '').toLowerCase().includes(q),
    );
  }, [searchText, showParticipantList]);

  // ParticipantItemH5 already no-ops when controlList is empty (Vue parity).
  const handleParticipantClick = (participant: RoomParticipant) => {
    setSelectedParticipant(participant);
    setActionPopupVisible(true);
  };

  const handleCallAllPending = async () => {
    if (!currentRoom?.roomId) {
      return;
    }
    await callUserToRoom({
      roomId: currentRoom.roomId,
      userIdList: pendingParticipantList.map(p => p.userId),
      timeout: 60,
    });
  };

  return (
    <div className={styles.participantListH5}>
      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <IconSearch className={styles.searchIcon} size="20" />
          <input
            className={styles.searchInput}
            type="text"
            value={searchText}
            placeholder={t('ParticipantList.Search')}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tabs}>
        <div
          className={classNames(styles.tab, {
            [styles.active]: activeTab === 'joined',
          })}
          onClick={() => setActiveTab('joined')}
        >
          <span className={styles.title}>
            {t('ParticipantList.Joined')}
            (
            {currentRoom?.participantCount || 0}
            )
          </span>
        </div>
        <div
          className={classNames(styles.tab, {
            [styles.active]: activeTab === 'unjoined',
          })}
          onClick={() => setActiveTab('unjoined')}
        >
          <span className={styles.title}>
            {t('ParticipantList.NotJoined')}
            (
            {pendingParticipantList.length}
            )
          </span>
        </div>
      </div>

      {activeTab === 'joined' && (
        <>
          <div className={styles.participantContainer}>
            {filteredParticipants.length === 0
              ? (
                <div className={styles.emptyState}>
                  {t('ParticipantList.NoMember')}
                </div>
              )
              : (
                filteredParticipants.map(p => (
                  <ParticipantItemH5
                    key={p.userId}
                    participant={p}
                    isLocal={p.userId === localParticipant?.userId}
                    onClick={handleParticipantClick}
                  />
                ))
              )}
          </div>
          <div className={styles.footer}>
            <RoomActionH5 />
          </div>
        </>
      )}

      {activeTab === 'unjoined' && (
        <>
          <div className={styles.unjoinedUserContainer}>
            {filteredParticipants.map(u => (
              <PendingParticipantItemH5 key={u.userId} userInfo={u} />
            ))}
          </div>
          <div className={styles.footer}>
            {pendingParticipantList.length > 0 && (
              <Button
                type="primary"
                size="big"
                style={{ minWidth: '80%' }}
                onClick={() => handleCallAllPending()}
              >
                {t('ParticipantList.CallAll')}
              </Button>
            )}
          </div>
        </>
      )}

      {actionPopupVisible && selectedParticipant && (
        <ParticipantActionH5
          visible={actionPopupVisible}
          participant={selectedParticipant}
          onVisibleChange={(visible) => {
            setActionPopupVisible(visible);
            if (!visible) {
              setSelectedParticipant(null);
            }
          }}
        />
      )}
    </div>
  );
}
