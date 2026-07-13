import { useNavigate } from 'react-router-dom';
import { PreConferenceView } from '@tencentcloud/roomkit-web-react';
import { RoomType } from 'tuikit-atomicx-react/room';
import { MessageBox, useUIKit } from '@tencentcloud/uikit-base-component-react';
import { useMediaPreference } from '@/hooks/useMediaPreference';
import './home.scss';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useUIKit();

  const { setCameraPreference, setMicrophonePreference } = useMediaPreference();

  const handleLogout = () => {
    navigate('/login');
  };

  const handleCreateRoom = (roomId: string, roomType: RoomType) => {
    const targetRoomId = sessionStorage.getItem('manualRoomId') || roomId;
    sessionStorage.setItem(`room-${targetRoomId}-isCreate`, 'true');
    const search = new URLSearchParams({
      roomId: targetRoomId,
      roomType: String(roomType),
    }).toString();
    navigate({ pathname: '/room', search });
  };

  const handleJoinRoom = (roomId: string, roomType: RoomType) => {
    if (roomType === RoomType.Webinar) {
      MessageBox.alert({
        type: 'error',
        modal: false,
        showClose: false,
        title: t('Room.Alert'),
        content: t('Room.NotSupportWebinar'),
      });
      return;
    }
    sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
    const search = new URLSearchParams({
      roomId,
      roomType: String(roomType),
    }).toString();
    navigate({ pathname: '/room', search });
  };

  const handleCameraPreferenceChange = (isOpen: boolean) => {
    setCameraPreference(isOpen);
  };

  const handleMicrophonePreferenceChange = (isOpen: boolean) => {
    setMicrophonePreference(isOpen);
  };

  return (
    <div className="home-view">
      <PreConferenceView
        onLogout={handleLogout}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onCameraPreferenceChange={handleCameraPreferenceChange}
        onMicrophonePreferenceChange={handleMicrophonePreferenceChange}
      />
    </div>
  );
}
