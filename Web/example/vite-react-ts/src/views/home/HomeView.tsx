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
  const { currentRoom, getRoomInfo } = useRoomState();
  const {
    isCameraTesting,
    isMicrophoneTesting,
    openLocalCamera,
    openLocalMicrophone,
    unmuteLocalAudio,
  } = useDeviceState();

  const roomContainer = useRef<HTMLDivElement>(null);
  const [showConference, setShowConference] = useState(false);
  const [roomKit] = useState(() => RoomKit.getInstance(credentials));

  // Read after an await, so these must be the values of the latest render.
  const latestRef = useRef({ currentRoom, setSearchParams });
  latestRef.current = { currentRoom, setSearchParams };

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

  async function createMeeting() {
    const devices = { camera: isCameraTesting, microphone: isMicrophoneTesting };
    setShowConference(true);

    const roomId = await generateRoomId(candidate => getRoomInfo({ roomId: candidate }));
    if (!roomId) {
      setShowConference(false);
      return;
    }
    const name = loginUserInfo?.userName || credentials.userId;
    await roomKit.createAndJoin({
      roomId,
      roomName: t('Schedule.DefaultTopic', { name }),
      container: { appendTo: roomContainer.current! },
    });
    setRoomQuery(roomId);
    await openPreviewDevices(devices);
  }

  async function joinMeeting(roomId: string, password?: string) {
    const devices = { camera: isCameraTesting, microphone: isMicrophoneTesting };
    setShowConference(true);

    await roomKit.join({ roomId, password, container: { appendTo: roomContainer.current! } });
    setRoomQuery(roomId);
    await openPreviewDevices(devices);
  }

  async function openPreviewDevices(devices: { camera: boolean; microphone: boolean }) {
    if (!latestRef.current.currentRoom) {
      return;
    }
    if (devices.camera) {
      await openLocalCamera().catch(error => console.error('Failed to open camera:', error));
    }
    if (devices.microphone) {
      await openLocalMicrophone()
        .then(() => unmuteLocalAudio())
        .catch(error => console.error('Failed to open microphone:', error));
    }
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
