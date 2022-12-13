#pragma once

#include <QObject>
#include <QString>
#include "TUIRoomCoreCallback.h"
#include "CommonDef.h"

class MessageDispatcher : public QObject ,public TUIRoomCoreCallback, public liteav::ITXDeviceObserver
{
	Q_OBJECT

public:

	static MessageDispatcher& Instance();

	void OnError(int code, const std::string& message) override;

	void OnLogin(int code, const std::string& message) override;

	void OnLogout(int code, const std::string& message) override;

	void OnCreateRoom(int code, const std::string& message) override;

	void OnDestroyRoom(int code, const std::string& message) override;

	void OnEnterRoom(int code, const std::string& message) override;

	void OnExitRoom(TUIExitRoomType code, const std::string& message) override;

    void OnRoomMasterChanged(const std::string& user_id) override;
    
	void OnRemoteUserEnter(const std::string& user_id) override;

	void OnRemoteUserLeave(const std::string& user_id) override;

	void OnRemoteUserCameraAvailable(const std::string& user_id, bool available) override;

	void OnRemoteUserScreenAvailable(const std::string& user_id, bool available) override;

	void OnRemoteUserAudioAvailable(const std::string& user_id, bool available) override;

    void OnRemoteUserEnterSpeechState(const std::string& user_id) override;

    void OnRemoteUserExitSpeechState(const std::string& user_id) override;

	void OnReceiveChatMessage(const std::string& user_id, const std::string& message) override;

	void OnReceiveCustomMessage(const std::string& user_id, const std::string& message) override;

    void OnReceiveSpeechInvitation() override;

    void OnReceiveInvitationCancelled() override;

    void OnReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) override;

    void OnReceiveSpeechApplication(const std::string& user_id) override;

    void OnSpeechApplicationCancelled(const std::string& user_id) override;

    void OnReceiveReplyToSpeechApplication(bool agree) override;

    void OnSpeechApplicationForbidden(bool forbidden) override;

    void OnOrderedToExitSpeechState() override;

    void OnCallingRollStarted() override;

    void OnCallingRollStopped() override;

    void OnMemberReplyCallingRoll(const std::string& user_id) override;

	void OnChatRoomMuted(uint32_t request_id, bool mute, TUIMutedReason reason) override;

	void OnMicrophoneMuted(uint32_t request_id, bool mute, TUIMutedReason reason) override;

	void OnCameraMuted(uint32_t request_id, bool mute, TUIMutedReason reason) override;

    void OnStatistics(const liteav::TRTCStatistics& statis) override;

    void OnNetworkQuality(const std::vector <tuikit::TUINetwork>& network_list) override;

	void OnScreenCaptureStarted() override;

	void OnScreenCaptureStopped(int reason) override;

	void OnTestSpeakerVolume(uint32_t volume) override;

	void OnTestMicrophoneVolume(uint32_t volume) override;

    void OnAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) override;

    void OnAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) override;

    void OnFirstVideoFrame(const std::string& user_id, const TUIStreamType stream_type) override;

    void OnUserVoiceVolume(const std::string& user_id, int volume) override;

    void onDeviceChanged(const char* deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state) override;
signals:
	void SignalOnError(int code, const QString& message);

	void SignalOnLogin(int code, const QString& message);

	void SignalOnLogout(int code, const QString& message);

	void SignalOnCreateRoom(int code, const QString& message);

	void SignalOnDestroyRoom(int code, const QString& message);

	void SignalOnEnterRoom(int code, const QString& message);

	void SignalOnExitRoom(TUIExitRoomType code, const QString& message);

    void SignalOnRoomMasterChanged(const QString& user_id);

	void SignalOnRemoteUserEnter(const QString& user_id);

	void SignalOnRemoteUserLeave(const QString& user_id);

	void SignalOnRemoteUserCameraAvailable(const QString& user_id, bool available);

	void SignalOnRemoteUserScreenAvailable(const QString& user_id, bool available);

	void SignalOnRemoteUserAudioAvailable(const QString& user_id, bool available);

    void SignalOnRemoteUserEnterSpeechState(const QString& user_id);

    void SignalOnRemoteUserExitSpeechState(const QString& user_id);

	void SignalOnReceiveChatMessage(const QString& user_id, const QString& message);

	void SignalOnReceiveCustomMessage(const QString& user_id, const QString& message);

    void SignalOnReceiveSpeechInvitation();

    void SignalOnReceiveInvitationCancelled();

    void SignalOnReceiveReplyToSpeechInvitation(const QString& user_id, bool agree);

    void SignalOnReceiveSpeechApplication(const QString& user_id);

    void SignalOnSpeechApplicationCancelled(const QString& user_id);

    void SignalOnReceiveReplyToSpeechApplication(bool agree);

    void SignalOnSpeechApplicationForbidden(bool forbidden);

	void SignalOnOrderedToExitSpeechState();

    void SignalOnCallingRollStarted();

    void SignalOnCallingRollStopped();

    void SignalOnMemberReplyCallingRoll(const QString& user_id);

	void SignalOnChatRoomMuted(uint32_t request_id, bool mute, TUIMutedReason reason);

	void SignalOnMicrophoneMuted(uint32_t request_id, bool mute, TUIMutedReason reason);

	void SignalOnCameraMuted(uint32_t request_id, bool mute, TUIMutedReason reason);

    void SignalOnStatistics(const liteav::TRTCStatistics& statis);

    void SignalOnNetworkQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality);

	void SignalOnScreenCaptureStarted();

	void SignalOnScreenCaptureStopped(int reason);

	void SignalOnRecordComplete(const QString& path);

	void SignalOnRecordProgress(int duration, int file_size);

	void SignalOnTestSpeakerVolume(uint32_t volume);

	void SignalOnTestMicrophoneVolume(uint32_t volume);

    void SignalAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted);
    
    void SignalAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted);

    void SignalOnFirstVideoFrame(const QString& user_id, const TUIStreamType stream_type);

    void SignalOnUserVoiceVolume(const QString& user_id, int volume);

    void SignalDeviceChanged(const QString& deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state);
private:

	MessageDispatcher(QObject *parent);
	~MessageDispatcher();
};
