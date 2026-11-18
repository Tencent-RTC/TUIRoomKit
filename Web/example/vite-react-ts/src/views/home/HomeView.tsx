import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginStatus, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { RoomKit, RoomKitProvider, t } from '@tencentcloud/roomkit-web-react';
import { Preconference } from '../../features/Preconference';
import { RoomInvitation, useRoomInvitation } from '../../features/Invitation';
import { generateRoomId } from '../../utils/generateRoomId';
import './HomeView.scss';

function readCredentials() {
  const user = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') || '{}');
  return { sdkAppId: user.SDKAppID, userId: user.userID, userSig: user.userSig };
}

export function HomeView() {
  const [credentials] = useState(readCredentials);
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { login, logout: logoutUser, loginStatus, loginUserInfo } = useLoginState();
  const { getRoomInfo } = useRoomState();
  const { isCameraTesting, isMicrophoneTesting } = useDeviceState();

  const roomContainer = useRef<HTMLDivElement>(null);
  const [showConference, setShowConference] = useState(false);
  const [roomKit] = useState(() => RoomKit.getInstance(credentials));

  // Read after an await, so these must be the values of the latest render.
  const latestRef = useRef({ setSearchParams });
  latestRef.current = { setSearchParams };

  function setRoomQuery(roomId?: string) {
    latestRef.current.setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (roomId) {
        next.set('roomId', roomId);
      } else {
        next.delete('roomId');
      }
      return next;
    }, { replace: true });
  }

  /** Carry the preconference preview into the room. */
  function getMediaPreference() {
    return { preferCameraOn: isCameraTesting, preferMicrophoneOn: isMicrophoneTesting };
  }

  async function createMeeting() {
    const mediaPreference = getMediaPreference();
    setShowConference(true);

    const roomId = await generateRoomId(candidate => getRoomInfo({ roomId: candidate }));
    if (!roomId) {
      setShowConference(false);
      return;
    }
    // Cap the name so a long nickname can't push roomName past the create limit.
    const name = [...(loginUserInfo?.userName || credentials.userId)].slice(0, 10).join('');
    await roomKit.createAndJoin({
      roomId,
      roomName: t('Schedule.DefaultTopic', { name }),
      container: { appendTo: roomContainer.current! },
      mediaPreference,
    });
    setRoomQuery(roomId);
  }

  async function joinMeeting(roomId: string, password?: string) {
    const mediaPreference = getMediaPreference();
    setShowConference(true);

    await roomKit.join({ roomId, password, container: { appendTo: roomContainer.current! }, mediaPreference });
    setRoomQuery(roomId);
  }

  async function logout() {
    sessionStorage.removeItem('tuiRoom-userInfo');
    await logoutUser().catch(() => {});
    navigate('/login', { replace: true });
  }

  const { incoming, countdown, accept: acceptInvitation, reject: rejectInvitation } = useRoomInvitation({
    onAcceptCall: params => joinMeeting(params.roomId, params.password),
  });

  useEffect(() => {
    if (loginStatus !== LoginStatus.LOGINED) {
      login(credentials);
    }
    const offExited = roomKit.on('exited', () => {
      setRoomQuery();
      setShowConference(false);
    });
    return () => {
      offExited();
      RoomKit.destroyInstance();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RoomKitProvider
      className="home-host"
      scene="conference"
    >
      <div className="home-view">
        {!showConference && (
          <Preconference
            className="home-preconference"
            onCreate={createMeeting}
            onJoin={joinMeeting}
            onLogout={logout}
          />
        )}
        <div
          ref={roomContainer}
          className="home-conference"
          style={{ display: showConference ? undefined : 'none' }}
        />
        <RoomInvitation
          invitation={incoming}
          countdown={countdown}
          onAccept={acceptInvitation}
          onReject={rejectInvitation}
        />
      </div>
    </RoomKitProvider>
  );
}

export default HomeView;
