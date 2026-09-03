import { useState } from 'react';
import { CreateRoomView } from './CreateRoomView';
import { JoinRoomView } from './JoinRoomView';
import { PreviewView } from './PreviewView';
import styles from './PreConferenceViewH5.module.scss';

export interface PreConferenceViewH5Props {
  /** Fired when the user clicks "Logout" inside the login info dropdown. */
  onLogout?: () => void;
  /** Fired after a fresh room id is generated for the local user to host. */
  onCreateRoom?: (roomId: string) => void;
  /** Fired after the local user resolves a valid room id to join. */
  onJoinRoom?: (roomId: string) => void;
  /** Fired whenever the camera preference toggles. */
  onCameraPreferenceChange?: (isOpen: boolean) => void;
  /** Fired whenever the microphone preference toggles. */
  onMicrophonePreferenceChange?: (isOpen: boolean) => void;
}

export function PreConferenceViewH5(props: PreConferenceViewH5Props) {
  const {
    onLogout,
    onCreateRoom,
    onJoinRoom,
    onCameraPreferenceChange,
    onMicrophonePreferenceChange,
  } = props;

  const [cameraPreference, setCameraPreference] = useState(true);
  const [microphonePreference, setMicrophonePreference] = useState(true);
  const [createRoomVisible, setCreateRoomVisible] = useState(false);
  const [joinRoomVisible, setJoinRoomVisible] = useState(false);
  // Lifted from PreviewView so the "permission denied" badges survive when the
  // user navigates to CreateRoom/JoinRoom and back (PreviewView unmounts there).
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [microphonePermissionDenied, setMicrophonePermissionDenied] = useState(false);

  const handleCameraPreferenceChange = (isOpen: boolean) => {
    setCameraPreference(isOpen);
    onCameraPreferenceChange?.(isOpen);
  };

  const handleMicrophonePreferenceChange = (isOpen: boolean) => {
    setMicrophonePreference(isOpen);
    onMicrophonePreferenceChange?.(isOpen);
  };

  if (createRoomVisible) {
    return (
      <div id="preConferencePage" className={styles.preConferencePage}>
        <CreateRoomView
          cameraPreference={cameraPreference}
          microphonePreference={microphonePreference}
          onCreateRoom={onCreateRoom}
          onBack={() => setCreateRoomVisible(false)}
          onCameraPreferenceChange={handleCameraPreferenceChange}
          onMicrophonePreferenceChange={handleMicrophonePreferenceChange}
        />
      </div>
    );
  }

  if (joinRoomVisible) {
    return (
      <div id="preConferencePage" className={styles.preConferencePage}>
        <JoinRoomView
          cameraPreference={cameraPreference}
          microphonePreference={microphonePreference}
          onJoinRoom={onJoinRoom}
          onBack={() => setJoinRoomVisible(false)}
          onCameraPreferenceChange={handleCameraPreferenceChange}
          onMicrophonePreferenceChange={handleMicrophonePreferenceChange}
        />
      </div>
    );
  }

  return (
    <div id="preConferencePage" className={styles.preConferencePage}>
      <PreviewView
        onLogout={onLogout}
        onCreateRoom={() => setCreateRoomVisible(true)}
        onJoinRoom={() => setJoinRoomVisible(true)}
        onCameraPreferenceChange={handleCameraPreferenceChange}
        onMicrophonePreferenceChange={handleMicrophonePreferenceChange}
        cameraPermissionDenied={cameraPermissionDenied}
        microphonePermissionDenied={microphonePermissionDenied}
        onCameraPermissionDeniedChange={setCameraPermissionDenied}
        onMicrophonePermissionDeniedChange={setMicrophonePermissionDenied}
      />
    </div>
  );
}
