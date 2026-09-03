import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconSearch, useUIKit } from '@tencentcloud/uikit-base-component-react';
import classNames from 'classnames';
import {
  useRoomParticipantState,
  useRoomState,
  DeviceStatus,
  RoomParticipantRole,
  RoomParticipantStatus,
  RoomType,
} from 'tuikit-atomicx-react/room';
import { combineComparators, createComparator } from '../../utils/compare';
import { AudienceAction } from './AudienceAction';
import { AudienceItem } from './AudienceItem';
import { ParticipantAction } from './ParticipantAction';
import { ParticipantItem } from './ParticipantItem';
import { PendingParticipantItem } from './PendingParticipantItem';
import { RoomAction } from './RoomAction';
import type { RoomParticipant, RoomUser } from 'tuikit-atomicx-react/room';
import styles from './RoomParticipantList.module.scss';

type StandardTab = 'joined' | 'unjoined';
type WebinarTab = 'Guest' | 'Audience';

const getParticipantSortName = (p: RoomParticipant) =>
  (p?.nameCard || p?.userName || p?.userId || '').trim();

const getAudienceSortName = (u: RoomUser) =>
  (u?.userName || u?.userId || '').trim();

export function RoomParticipantList() {
  const { t } = useUIKit();
  const { currentRoom, callUserToRoom } = useRoomState();
  const {
    pendingParticipantList,
    participantList,
    audienceList,
    adminList,
    localParticipant,
    participantListCursor,
    audienceListCursor,
    getParticipantList,
    getAudienceList,
  } = useRoomParticipantState();

  const isWebinar = currentRoom?.roomType === RoomType.Webinar;
  const prevRoomIdRef = useRef<string>();

  useEffect(() => {
    const newRoomId = currentRoom?.roomId;
    if (!newRoomId || newRoomId === prevRoomIdRef.current) {
      return;
    }

    prevRoomIdRef.current = newRoomId;
    if (participantListCursor === '') {
      getParticipantList({ cursor: participantListCursor });
    }
    if (audienceListCursor === '') {
      getAudienceList({ cursor: audienceListCursor });
    }
  }, [
    currentRoom?.roomId,
    participantListCursor,
    audienceListCursor,
    getParticipantList,
    getAudienceList,
  ]);

  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<StandardTab>('joined');
  const [activeTabWebinar, setActiveTabWebinar] = useState<WebinarTab>('Guest');
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);

  const participantComparator = useMemo(() =>
    combineComparators<RoomParticipant>(
      createComparator((p: RoomParticipant) => Boolean(p.userId === localParticipant?.userId)),
      createComparator((p: RoomParticipant) => Boolean(p.role === RoomParticipantRole.Owner)),
      createComparator((p: RoomParticipant) => Boolean(p.role === RoomParticipantRole.Admin)),
      createComparator((p: RoomParticipant) => Boolean(p.screenShareStatus === DeviceStatus.On)),
      createComparator((p: RoomParticipant) =>
        Boolean(p.cameraStatus === DeviceStatus.On && p.microphoneStatus === DeviceStatus.On),
      ),
      createComparator((p: RoomParticipant) => Boolean(p.cameraStatus === DeviceStatus.On)),
      createComparator((p: RoomParticipant) => Boolean(p.microphoneStatus === DeviceStatus.On)),
      createComparator((p: RoomParticipant) => Boolean(p.roomStatus === RoomParticipantStatus.InCalling)),
      createComparator((a: RoomParticipant, b: RoomParticipant) =>
        getParticipantSortName(a) < getParticipantSortName(b),
      ),
    )
  , [localParticipant?.userId]);

  const audienceComparator = useMemo(() =>
    combineComparators<RoomUser>(
      createComparator((u: RoomUser) => Boolean(u.userId === localParticipant?.userId)),
      createComparator((u: RoomUser) => Boolean(u.userId === currentRoom?.roomOwner?.userId)),
      createComparator((u: RoomUser) => Boolean(adminList.some(admin => admin.userId === u.userId))),
      createComparator((a: RoomUser, b: RoomUser) =>
        getAudienceSortName(a) < getAudienceSortName(b),
      ),
    )
  , [adminList, currentRoom?.roomOwner?.userId, localParticipant?.userId]);

  const sortedAudienceList = useMemo(
    () => [...audienceList].sort(audienceComparator),
    [audienceComparator, audienceList],
  );

  const showParticipantList = useMemo<RoomParticipant[]>(() => {
    if (activeTab === 'joined') {
      return [...participantList].sort(participantComparator);
    }
    if (activeTab === 'unjoined') {
      return [...pendingParticipantList].sort(participantComparator);
    }
    return [];
  }, [activeTab, participantComparator, participantList, pendingParticipantList]);

  const filteredParticipants = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return showParticipantList;
    }
    return showParticipantList.filter(p =>
      p.userName.toLowerCase().includes(query)
      || p.nameCard.toLowerCase().includes(query)
      || p.userId.toLowerCase().includes(query),
    );
  }, [searchText, showParticipantList]);

  async function handleCallAllPendingParticipant() {
    if (!currentRoom?.roomId) {
      return;
    }
    const userIdList = pendingParticipantList.map(participant => participant.userId);
    await callUserToRoom({
      roomId: currentRoom.roomId,
      userIdList,
      timeout: 60,
    });
  }

  const renderJoinedParticipantList = () => (
    <>
      <div className={styles['participant-container']}>
        {filteredParticipants.length === 0
          ? (
            <div className={styles['empty-state']}>{t('ParticipantList.NoMember')}</div>
          )
          : (
            filteredParticipants.map(participant => (
              <ParticipantItem
                key={participant.userId}
                participant={participant}
                isLocal={participant.userId === localParticipant?.userId}
                isActive={hoveredUserId === participant.userId}
                onActivate={() => setHoveredUserId(participant.userId)}
                onDeactivate={() => setHoveredUserId(null)}
              >
                <ParticipantAction
                  participant={participant}
                  isLocal={participant.userId === localParticipant?.userId}
                />
              </ParticipantItem>
            ))
          )}
      </div>
      <div className={styles.footer}>
        <RoomAction />
      </div>
    </>
  );

  return (
    <div className={styles['participant-list']}>
      {!isWebinar
        ? (
          <div className={styles['search-container']}>
            <div className={styles['search-box']}>
              <IconSearch size="20" />
              <input
                value={searchText}
                className={styles['search-input']}
                type="text"
                placeholder={t('ParticipantList.Search')}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
          </div>
        )
        : (
          <div className={styles['webinar-top-placeholder']} />
        )}

      {!isWebinar
        ? (
          <div className={styles.tabs}>
            <div
              className={classNames(styles.tab, { [styles.active]: activeTab === 'joined' })}
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
              className={classNames(styles.tab, { [styles.active]: activeTab === 'unjoined' })}
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
        )
        : (
          <div className={styles.tabs}>
            <div
              className={classNames(styles.tab, { [styles.active]: activeTabWebinar === 'Guest' })}
              onClick={() => setActiveTabWebinar('Guest')}
            >
              <span className={styles.title}>
                {t('ParticipantList.Guest')}
                (
                {currentRoom?.participantCount || 0}
                )
              </span>
            </div>
            <div
              className={classNames(styles.tab, { [styles.active]: activeTabWebinar === 'Audience' })}
              onClick={() => setActiveTabWebinar('Audience')}
            >
              <span className={styles.title}>
                {t('ParticipantList.Audience')}
                (
                {(currentRoom as { audienceCount?: number })?.audienceCount || 0}
                )
              </span>
            </div>
          </div>
        )}

      {!isWebinar && activeTab === 'joined' && renderJoinedParticipantList()}

      {!isWebinar && activeTab === 'unjoined' && (
        <>
          <div className={styles['unjoined-user-container']}>
            {filteredParticipants.map(userInfo => (
              <PendingParticipantItem key={userInfo.userId} userInfo={userInfo} />
            ))}
          </div>
          <div className={styles.footer}>
            {pendingParticipantList.length > 0 && (
              <Button type="primary" className={styles['call-all-button']} onClick={handleCallAllPendingParticipant}>
                {t('ParticipantList.CallAll')}
              </Button>
            )}
          </div>
        </>
      )}

      {isWebinar && activeTabWebinar === 'Guest' && renderJoinedParticipantList()}

      {isWebinar && activeTabWebinar === 'Audience' && (
        <>
          <div className={styles['participant-container']}>
            {sortedAudienceList.length === 0
              ? (
                <div className={styles['empty-state']}>{t('ParticipantList.NoMember')}</div>
              )
              : (
                sortedAudienceList.map(audience => (
                  <AudienceItem
                    key={audience.userId}
                    audience={audience}
                    isLocal={audience.userId === localParticipant?.userId}
                  >
                    <AudienceAction
                      audience={audience}
                      isLocal={audience.userId === localParticipant?.userId}
                    />
                  </AudienceItem>
                ))
              )}
          </div>
          <div className={styles.footer}>
            <RoomAction />
          </div>
        </>
      )}
    </div>
  );
}
