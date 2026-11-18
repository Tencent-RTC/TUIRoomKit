import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginStatus, useDeviceState, useLoginState, useRoomState } from 'tuikit-atomicx-react/room';
import { RoomKit, RoomKitProvider, RoomScene } from '@tencentcloud/roomkit-web-react';
import { Preclass } from '../../features/Preclass';
import { forgetResumeRoom, rememberResumeRoom } from '../../features/Preclass/useResumeRoom';
import './HomeView.scss';

function readCredentials() {
  const user = JSON.parse(sessionStorage.getItem('tuiRoom-userInfo') || '{}');
  return { sdkAppId: user.SDKAppID, userId: user.userID, userSig: user.userSig };
}

export function HomeView() {
  const [credentials] = useState(readCredentials);
  const navigate = useNavigate();
  const { login, logout: logoutUser, loginStatus } = useLoginState();
  const roomState = useRoomState();
  const {
    isCameraTesting,
    isMicrophoneTesting,
    openLocalCamera,
    openLocalMicrophone,
    unmuteLocalAudio,
  } = useDeviceState();
  const roomContainer = useRef<HTMLDivElement>(null);
  const [showClass, setShowClass] = useState(false);
  const [roomKit] = useState(() => RoomKit.getInstance(credentials));

  async function joinClass(roomId: string) {
    const devices = { camera: isCameraTesting, microphone: isMicrophoneTesting };
    setShowClass(true);
    await roomKit.join({
      roomId,
      scene: RoomScene.Education,
      container: { appendTo: roomContainer.current! },
    });
    rememberResumeRoom(roomId);
    if (!roomState.currentRoom) {
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

  function enterFromLobby(roomId: string) {
    // RoomKit owns entry alerts and emits exited on failure.
    joinClass(roomId).catch(error => console.error('[Home] Failed to enter the class:', error));
  }

  async function logout() {
    sessionStorage.removeItem('tuiRoom-userInfo');
    forgetResumeRoom();
    await logoutUser().catch(() => {});
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    const offExited = roomKit.on('exited', () => {
      forgetResumeRoom();
      setShowClass(false);
    });
    if (loginStatus !== LoginStatus.LOGINED) {
      login(credentials).catch(error => console.error('[Home] Failed to log in:', error));
    }
    return () => {
      offExited();
      RoomKit.destroyInstance();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <RoomKitProvider className="home-host" scene="education">
      <div className="home-view">
        {!showClass && <Preclass className="home-preclass" onJoin={enterFromLobby} onLogout={logout} />}
        <div
          ref={roomContainer}
          className="home-classroom"
          style={{ display: showClass ? undefined : 'none' }}
        />
      </div>
    </RoomKitProvider>
  );
}

export default HomeView;
