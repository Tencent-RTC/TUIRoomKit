#include "MessageDispatcher.h"
#include <QMetaType>
#include "TUIRoomCore.h"

MessageDispatcher& MessageDispatcher::Instance(){
	static MessageDispatcher instance(nullptr);
	return instance;
}

MessageDispatcher::MessageDispatcher(QObject *parent)
	: QObject(parent){

	qRegisterMetaType<TUISpeechMode>("TUISpeechMode");
    qRegisterMetaType<TUIStreamType>("TUIStreamType");
    qRegisterMetaType<TUIExitRoomType>("TXTypeExitRoom");
    qRegisterMetaType<liteav::TRTCStatistics>("liteav::TRTCStatistics");
    qRegisterMetaType <UserNetQualityInfo>("UserNetQualityInfo");
}

MessageDispatcher::~MessageDispatcher(){
}

void MessageDispatcher::OnError(int code, const std::string& message) {
	emit SignalOnError(code, QString::fromStdString(message));
}

void MessageDispatcher::OnLogin(int code, const std::string& message) {
	emit SignalOnLogin(code, QString::fromStdString(message));
}

void MessageDispatcher::OnLogout(int code, const std::string& message) {
	emit SignalOnLogout(code, QString::fromStdString(message));
}

void MessageDispatcher::OnCreateRoom(int code, const std::string& message) {
	emit SignalOnCreateRoom(code, QString::fromStdString(message));
}

void MessageDispatcher::OnDestroyRoom(int code, const std::string& message) {
	emit SignalOnDestroyRoom(code, QString::fromStdString(message));
}

void MessageDispatcher::OnEnterRoom(int code, const std::string& message) {
	emit SignalOnEnterRoom(code, QString::fromStdString(message));
}

void MessageDispatcher::OnExitRoom(TUIExitRoomType code, const std::string& message) {
	emit SignalOnExitRoom(code, QString::fromStdString(message));
}

void MessageDispatcher::OnRoomMasterChanged(const std::string& user_id) {
    emit SignalOnRoomMasterChanged(QString::fromStdString(user_id));
}

void MessageDispatcher::OnRemoteUserEnter(const std::string& user_id) {
	emit SignalOnRemoteUserEnter(QString::fromStdString(user_id));
}

void MessageDispatcher::OnRemoteUserLeave(const std::string& user_id) {
	emit SignalOnRemoteUserLeave(QString::fromStdString(user_id));
}

void MessageDispatcher::OnRemoteUserCameraAvailable(const std::string& user_id, bool available) {
	emit SignalOnRemoteUserCameraAvailable(QString::fromStdString(user_id), available);
}

void MessageDispatcher::OnRemoteUserScreenAvailable(const std::string& user_id, bool available) {
	emit SignalOnRemoteUserScreenAvailable(QString::fromStdString(user_id), available);
}

void MessageDispatcher::OnRemoteUserAudioAvailable(const std::string& user_id, bool available) {
	emit SignalOnRemoteUserAudioAvailable(QString::fromStdString(user_id), available);
}

void MessageDispatcher::OnRemoteUserEnterSpeechState(const std::string& user_id) {
    emit SignalOnRemoteUserEnterSpeechState(QString::fromStdString(user_id));
}

void MessageDispatcher::OnRemoteUserExitSpeechState(const std::string& user_id) {
    emit SignalOnRemoteUserExitSpeechState(QString::fromStdString(user_id));
}

void MessageDispatcher::OnReceiveChatMessage(const std::string& user_id, const std::string& message) {
	emit SignalOnReceiveChatMessage(QString::fromStdString(user_id), QString::fromStdString(message));
}

void MessageDispatcher::OnReceiveCustomMessage(const std::string& user_id, const std::string& message) {
	emit SignalOnReceiveCustomMessage(QString::fromStdString(user_id), QString::fromStdString(message));
}

void MessageDispatcher::OnReceiveSpeechInvitation() {
    emit SignalOnReceiveSpeechInvitation();
}

void MessageDispatcher::OnReceiveInvitationCancelled() {
    emit SignalOnReceiveInvitationCancelled();
}

void MessageDispatcher::OnReceiveReplyToSpeechInvitation(const std::string& user_id, bool agree) {
    emit SignalOnReceiveReplyToSpeechInvitation(QString::fromStdString(user_id), agree);
}

void MessageDispatcher::OnReceiveSpeechApplication(const std::string& user_id) {
    emit SignalOnReceiveSpeechApplication(QString::fromStdString(user_id));
}

void MessageDispatcher::OnSpeechApplicationCancelled(const std::string& user_id) {
    emit SignalOnSpeechApplicationCancelled(QString::fromStdString(user_id));
}

void MessageDispatcher::OnReceiveReplyToSpeechApplication(bool agree) {
    emit SignalOnReceiveReplyToSpeechApplication(agree);
}

void MessageDispatcher::OnSpeechApplicationForbidden(bool forbidden) {
    emit SignalOnSpeechApplicationForbidden(forbidden);
}

void MessageDispatcher::OnOrderedToExitSpeechState() {
	emit SignalOnOrderedToExitSpeechState();
}

void MessageDispatcher::OnCallingRollStarted() {
    emit SignalOnCallingRollStarted();
}

void MessageDispatcher::OnCallingRollStopped() {
    emit SignalOnCallingRollStopped();
}

void MessageDispatcher::OnMemberReplyCallingRoll(const std::string& user_id) {
    emit SignalOnMemberReplyCallingRoll(QString::fromStdString(user_id));
}

void MessageDispatcher::OnChatRoomMuted(bool mute) {
	emit SignalOnChatRoomMuted(mute);
}

void MessageDispatcher::OnMicrophoneMuted(bool mute) {
	emit SignalOnMicrophoneMuted(mute);
}

void MessageDispatcher::OnCameraMuted(bool mute) {
	emit SignalOnCameraMuted(mute);
}

void MessageDispatcher::OnStatistics(const liteav::TRTCStatistics& statis) {
    liteav::TRTCStatistics statistic;
    statistic.appCpu = statis.appCpu;
    statistic.downLoss = statis.downLoss;
    statistic.receivedBytes = statis.receivedBytes;
    statistic.rtt = statis.rtt;
    statistic.sentBytes = statis.sentBytes;
    statistic.systemCpu = statis.systemCpu;
    statistic.upLoss = statis.upLoss;

    liteav::TRTCLocalStatistics* local_statistic = new (std::nothrow) liteav::TRTCLocalStatistics[statis.localStatisticsArraySize];
    if (local_statistic == nullptr) {
        return;
    }
    for (int i = 0; i < statis.localStatisticsArraySize; ++i) {
        local_statistic[i].width = statis.localStatisticsArray[i].width;
        local_statistic[i].height = statis.localStatisticsArray[i].height;
        local_statistic[i].frameRate = statis.localStatisticsArray[i].frameRate;
        local_statistic[i].videoBitrate = statis.localStatisticsArray[i].videoBitrate;
        local_statistic[i].audioSampleRate = statis.localStatisticsArray[i].audioSampleRate;
        local_statistic[i].audioBitrate = statis.localStatisticsArray[i].audioBitrate;
        local_statistic[i].streamType = statis.localStatisticsArray[i].streamType;
        local_statistic[i].audioCaptureState = statis.localStatisticsArray[i].audioCaptureState;
    }
    statistic.localStatisticsArray = local_statistic;
    statistic.localStatisticsArraySize = statis.localStatisticsArraySize;

    std::vector<std::string> user_ids;
    liteav::TRTCRemoteStatistics* remote_statistic = new (std::nothrow) liteav::TRTCRemoteStatistics[statis.remoteStatisticsArraySize];
    if (remote_statistic == nullptr) {
        return;
    }
    for (int i = 0; i < statis.remoteStatisticsArraySize; ++i) {
        std::string user_id = "";
        if (statis.remoteStatisticsArray[i].userId != nullptr) {
            user_id = statis.remoteStatisticsArray[i].userId;
        }
        user_ids.push_back(user_id);
        remote_statistic[i].userId = user_ids[i].c_str();
        remote_statistic[i].finalLoss = statis.remoteStatisticsArray[i].finalLoss;
        remote_statistic[i].width = statis.remoteStatisticsArray[i].width;
        remote_statistic[i].height = statis.remoteStatisticsArray[i].height;
        remote_statistic[i].frameRate = statis.remoteStatisticsArray[i].frameRate;
        remote_statistic[i].videoBitrate = statis.remoteStatisticsArray[i].videoBitrate;
        remote_statistic[i].audioSampleRate = statis.remoteStatisticsArray[i].audioSampleRate;
        remote_statistic[i].audioBitrate = statis.remoteStatisticsArray[i].audioBitrate;
        remote_statistic[i].jitterBufferDelay = statis.remoteStatisticsArray[i].jitterBufferDelay;
        remote_statistic[i].point2PointDelay = statis.remoteStatisticsArray[i].point2PointDelay;
        remote_statistic[i].audioTotalBlockTime = statis.remoteStatisticsArray[i].audioTotalBlockTime;
        remote_statistic[i].audioBlockRate = statis.remoteStatisticsArray[i].audioBlockRate;
        remote_statistic[i].videoTotalBlockTime = statis.remoteStatisticsArray[i].videoTotalBlockTime;
        remote_statistic[i].videoBlockRate = statis.remoteStatisticsArray[i].videoBlockRate;
        remote_statistic[i].streamType = statis.remoteStatisticsArray[i].streamType;
    }
    statistic.remoteStatisticsArray = remote_statistic;
    statistic.remoteStatisticsArraySize = statis.remoteStatisticsArraySize;
    emit SignalOnStatistics(statistic);

    if (local_statistic != nullptr) {
        delete[] local_statistic;
        local_statistic = nullptr;
    }
    if (remote_statistic != nullptr) {
        delete[] remote_statistic;
        remote_statistic = nullptr;
    }
}

void MessageDispatcher::OnNetworkQuality(const liteav::TRTCQualityInfo& local_quality, liteav::TRTCQualityInfo* remote_quality, uint32_t remote_quality_count) {
    UserNetQualityInfo local_user_quality;
    local_user_quality.user_id = (local_quality.userId == nullptr ? "" : local_quality.userId);
    local_user_quality.quality = local_quality.quality;

    std::vector<UserNetQualityInfo> remote_users_quality;
    if (remote_quality_count > 0) {
		for (int i = 0; i < remote_quality_count; ++i) {
			UserNetQualityInfo tmp_remote_user_quality;
            tmp_remote_user_quality.user_id = (remote_quality[i].userId == nullptr ? "" : remote_quality[i].userId);
            tmp_remote_user_quality.quality = remote_quality[i].quality;
            remote_users_quality.push_back(tmp_remote_user_quality);
        }
    }

    emit SignalOnNetworkQuality(local_user_quality, remote_users_quality);
}

void MessageDispatcher::OnScreenCaptureStarted() {
	emit SignalOnScreenCaptureStarted();
}

void MessageDispatcher::OnScreenCaptureStopped(int reason) {
	emit SignalOnScreenCaptureStopped(reason);
}

void MessageDispatcher::OnTestSpeakerVolume(uint32_t volume) {
	emit SignalOnTestSpeakerVolume(volume);
}

void MessageDispatcher::OnTestMicrophoneVolume(uint32_t volume) {
	emit SignalOnTestMicrophoneVolume(volume);
}

void MessageDispatcher::OnAudioDeviceCaptureVolumeChanged(uint32_t volume, bool muted) {
    emit SignalAudioDeviceCaptureVolumeChanged(volume, muted);
}

void MessageDispatcher::OnAudioDevicePlayoutVolumeChanged(uint32_t volume, bool muted) {
    emit SignalAudioDevicePlayoutVolumeChanged(volume, muted);
}

void MessageDispatcher::OnFirstVideoFrame(const std::string& user_id, const TUIStreamType stream_type) {
    emit SignalOnFirstVideoFrame(QString::fromStdString(user_id), stream_type);
}

void MessageDispatcher::OnUserVoiceVolume(const std::string& user_id, int volume) {
    emit SignalOnUserVoiceVolume(QString::fromStdString(user_id), volume);
}

void MessageDispatcher::onDeviceChanged(const char* deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state) {
    emit SignalDeviceChanged(deviceId, type, state);
}