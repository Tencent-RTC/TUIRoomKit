import { useNavigate } from 'react-router-dom';
import { PreConferenceViewH5 } from '@tencentcloud/roomkit-web-react';
import { useMediaPreference } from '@/hooks/useMediaPreference';

export default function HomeH5() {
  const navigate = useNavigate();
  const { setCameraPreference, setMicrophonePreference } = useMediaPreference();

  const handleLogout = () => {
    navigate('/login');
  };

  const handleCreateRoom = (roomId: string) => {
    const targetRoomId = sessionStorage.getItem('manualRoomId') || roomId;
    sessionStorage.setItem(`room-${targetRoomId}-isCreate`, 'true');
    const search = new URLSearchParams({ roomId: targetRoomId }).toString();
    navigate({ pathname: '/room', search });
  };

  const handleJoinRoom = (roomId: string) => {
    sessionStorage.setItem(`room-${roomId}-isCreate`, 'false');
    const search = new URLSearchParams({ roomId }).toString();
    navigate({ pathname: '/room', search });
  };

  const handleCameraPreferenceChange = (isOpen: boolean) => {
    setCameraPreference(isOpen);
  };

  const handleMicrophonePreferenceChange = (isOpen: boolean) => {
    setMicrophonePreference(isOpen);
  };

  return (
    <PreConferenceViewH5
      onLogout={handleLogout}
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      onCameraPreferenceChange={handleCameraPreferenceChange}
      onMicrophonePreferenceChange={handleMicrophonePreferenceChange}
    />
  );
}
