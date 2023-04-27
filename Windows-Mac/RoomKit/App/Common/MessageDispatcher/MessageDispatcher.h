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

    void OnRoomNameChanged(const std::string& room_id, const std::string& room_name) override;

    void OnAllUserMicrophoneDisableChanged(const std::string& room_id,
                                           bool is_disable);

    void OnAllUserCameraDisableChanged(const std::string& room_id,
                                       bool is_disable);

    void OnSendMessageForAllUserDisableChanged(const std::string& room_id,
                                               bool is_disable);
    
	void OnRemoteUserEnter(const std::string& user_id) override;

	void OnRemoteUserLeave(const std::string& user_id) override;

	void OnRemoteUserCameraAvailable(const std::string& user_id, bool available) override;

	void OnRemoteUserScreenAvailable(const std::string& user_id, bool available) override;

	void OnRemoteUserAudioAvailable(const std::string& user_id, bool available) override;

    void OnRequestOpenCameraByAdmin(const std::string& request_id) override;

    void OnRequestOpenMicrophoneByAdmin(const std::string& request_id) override;

    void OnMicrophoneStateChanged(bool has_audio, tuikit::TUIChangeReason reason) override;

    void OnCameraStateChanged(bool has_video, tuikit::TUIChangeReason reason) override;

    void OnScreenSharingStateChanged(bool has_video, tuikit::TUIChangeReason reason) override;

	void OnReceiveChatMessage(const std::string& user_id, const std::string& message) override;

	void OnReceiveCustomMessage(const std::string& user_id, const std::string& message) override;

	void OnSendMessageForUserDisableChanged(const std::string& room_id, const std::string& user_id, bool is_disable) override;

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

    void SignalOnRoomNameChanged(const QString& room_id, const QString& room_name);

    void SignalOnAllUserMicrophoneDisableChanged(const QString& room_id, bool is_disable);

    void SignalOnAllUserCameraDisableChanged(const QString& room_id, bool is_disable);

    void SignalOnSendMessageForAllUserDisableChanged(const QString& room_id,
                                                     bool is_disable);

	void SignalOnRemoteUserEnter(const QString& user_id);

	void SignalOnRemoteUserLeave(const QString& user_id);

	void SignalOnRemoteUserCameraAvailable(const QString& user_id, bool available);

	void SignalOnRemoteUserScreenAvailable(const QString& user_id, bool available);

	void SignalOnRemoteUserAudioAvailable(const QString& user_id, bool available);

    void SignalOnRequestOpenCameraByAdmin(const QString& request_id);

    void SignalOnRequestOpenMicrophoneByAdmin(const QString& request_id);

    void SignalOnMicrophoneStateChanged(bool has_audio, tuikit::TUIChangeReason reason);

    void SignalOnCameraStateChanged(bool has_video, tuikit::TUIChangeReason reason);

    void SignalOnScreenSharingStateChanged(bool has_video, tuikit::TUIChangeReason reason);

	void SignalOnReceiveChatMessage(const QString& user_id, const QString& message);

	void SignalOnReceiveCustomMessage(const QString& user_id, const QString& message);

	void SignalOnSendMessageForUserDisableChanged(const QString& room_id, const QString& user_id, bool is_disable);

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
