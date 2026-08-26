import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUIKit } from '@tencentcloud/uikit-base-component-react';
import {
  ConferenceMainViewH5,
  RoomEvent as ConferenceRoomEvent,
  conference,
} from '@tencentcloud/roomkit-web-react';
import {
  VideoQuality,
  useDeviceState,
  useLoginState,
  useRoomModal,
  useRoomParticipantState,
  useRoomState,
} from 'tuikit-atomicx-react/room';
import { useMediaPreference } from '@/hooks/useMediaPreference';

export default function RoomH5() {
  const { t } = useUIKit();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { loginUserInfo } = useLoginState();
  const { currentRoom } = useRoomState();
  const {
    localVideoQuality,
    openLocalCamera,
    updateVideoQuality,
    openLocalMicrophone,
    closeLocalMicrophone,
  } = useDeviceState();
  const { muteMicrophone, unmuteMicrophone } = useRoomParticipantState();
  const { getMicrophonePreference, getCameraPreference } = useMediaPreference();
  const { handleErrorWithModal } = useRoomModal();

  const roomId = searchParams.get('roomId') || '';
  const password = searchParams.get('password') ?? undefined;

  const loginUserInfoRef = useRef(loginUserInfo);
  loginUserInfoRef.current = loginUserInfo;
  const localVideoQualityRef = useRef(localVideoQuality);
  localVideoQualityRef.current = localVideoQuality;

  useEffect(() => {
    if (!roomId) {
      navigate('/home', { replace: true });
    }
  }, []);

  const userId = loginUserInfo?.userId;
  const hasEnteredRoomRef = useRef(false);
  useEffect(() => {
    if (!userId || !roomId || hasEnteredRoomRef.current) {
      return;
    }
    if (currentRoom?.roomId) {
      return;
    }
    hasEnteredRoomRef.current = true;

    const enterRoom = async () => {
      const isCreateKey = `room-${roomId}-isCreate`;
      const isCreate = sessionStorage.getItem(isCreateKey) === 'true';
      sessionStorage.removeItem(isCreateKey);
      try {
        if (isCreate) {
          await handleStartConference();
        } else {
          await handleJoinConference();
        }
      } catch (error) {
        handleErrorWithModal(error as { code?: number; message?: string });
        navigate('/home', { replace: true });
      }
    };

    const handleStartConference = async () => {
      await handleOpenMicrophone();
      try {
        const ownerName =
          loginUserInfoRef.current?.userName ||
          loginUserInfoRef.current?.userId ||
          '';
        await conference.createAndJoinRoom({
          roomId,
          options: {
            roomName: `${ownerName}${t('Room.TemporaryMeeting')}`,
          },
        });
      } catch (error) {
        await closeLocalMicrophone();
        throw error;
      }
    };

    const handleJoinConference = async () => {
      await handleOpenMicrophone();
      try {
        await conference.joinRoom({ roomId, password });
      } catch (error) {
        await closeLocalMicrophone();
        throw error;
      }
    };

    const handleOpenMicrophone = async () => {
      try {
        await muteMicrophone();
        await openLocalMicrophone();
      } catch (error) {
        handleErrorWithModal(error as { code?: number; message?: string });
      }
      if (getMicrophonePreference()) {
        await unmuteMicrophone();
      }
    };

    void enterRoom();
  }, [userId]);

  const currentRoomId = currentRoom?.roomId;
  const prevRoomIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const prevRoomId = prevRoomIdRef.current;
    prevRoomIdRef.current = currentRoomId;
    if (prevRoomId || !currentRoomId) {
      return;
    }
    const openCamera = async () => {
      if (!localVideoQualityRef.current) {
        updateVideoQuality({ quality: VideoQuality.Quality720P });
      }
      if (getCameraPreference()) {
        try {
          await openLocalCamera();
        } catch (error) {
          handleErrorWithModal(error as { code?: number; message?: string });
        }
      }
    };
    void openCamera();
  }, [currentRoomId]);

  useEffect(() => {
    const handleBackHome = () => {
      navigate('/home', { replace: true });
    };
    conference.on(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
    conference.on(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
    conference.on(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
    conference.on(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
    return () => {
      conference.off(ConferenceRoomEvent.ROOM_DISMISS, handleBackHome);
      conference.off(ConferenceRoomEvent.ROOM_LEAVE, handleBackHome);
      conference.off(ConferenceRoomEvent.ROOM_ERROR, handleBackHome);
      conference.off(ConferenceRoomEvent.KICKED_OUT, handleBackHome);
    };
  }, []);

  return <ConferenceMainViewH5 />;
}
