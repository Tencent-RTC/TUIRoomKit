﻿// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_TUIROOMCOREIMPL_H_
#define MODULE_TUIROOMCOREIMPL_H_

#include "include/TUIRoomCore.h"

#include "ITRTCCloud.h"

#include "ITUIRoomEngine.h"
#include "ITUIRoomDefine.h"
#include "ITUIRoomObserver.h"

#include "CommonDef.h"
#include <unordered_map>

class TUIRoomCoreImpl : public TUIRoomCore,
    public tuikit::TUIRoomObserver {
 public:
    TUIRoomCoreImpl();
    ~TUIRoomCoreImpl() override;

    /*************************
    * 回调事件接口。(Callback event APIs)
    *************************/
    void SetCallback(TUIRoomCoreCallback* callback) override;

    /*************************
    * 基础接口。(Basic APIs)
    *************************/
    int Login(int sdk_appid, const std::string& user_id, const std::string& user_sig) override;
    int Logout() override;
    int CreateRoom(const std::string& room_id, tuikit::TUISpeechMode speech_mode) override;
    int DestroyRoom() override;
    int EnterRoom(const std::string& room_id) override;
    int LeaveRoom() override;
    TUIRoomInfo GetRoomInfo() override;
    std::vector<TUIUserInfo> GetRoomUsers() override;
    const TUIUserInfo* GetUserInfo(const std::string& user_id) override;
    int SetSelfProfile(const std::string& user_name, const std::string& avatar_url) override;
    int TransferRoomMaster(const std::string& user_id) override;

    /***************************************
    * 获取SDK版本。(Get the SDK version)
    ***************************************/
    const char* GetSDKVersion() override;

    /**************************************
    * 本地用户接口。(Local user APIs)
    **************************************/
    int StartCameraDeviceTest(bool start, const liteav::TXView& view = nullptr);
    int StartCameraPreview(const liteav::TXView& view) override;
    int StopCameraPreview() override;
    int UpdateCameraPreview(const liteav::TXView& view) override;
    int StartLocalAudio(tuikit::TUIAudioQuality quality) override;
    int StopLocalAudio() override;
    int StartSystemAudioLoopback() override;
    int StopSystemAudioLoopback() override;
    int SetVideoMirror(bool mirror) override;
    int OpenAINoiseReduction() override;
    int CloseAINoiseReduction() override;

    /************************************
    * 远端用户接口。(Remote user APIs)
    ************************************/
    int StartRemoteView(const std::string& user_id, const liteav::TXView& view, TUIStreamType type = TUIStreamType::kStreamTypeCamera) override;
    int StopRemoteView(const std::string& user_id, TUIStreamType type = TUIStreamType::kStreamTypeCamera) override;
    int UpdateRemoteView(const std::string& user_id, TUIStreamType type, const liteav::TXView& view) override;
    /***********************************
    * 发送消息。(Message sending APIs)
    ***********************************/
    int SendChatMessage(const std::string& message) override;
    int SendCustomMessage(const std::string& message) override;

    /*************************************
    * 场控相关。(Room control APIs)
    *************************************/
    // 主持人邀请成员关闭/打开麦克风。
    // When the host calls this API to invite a member to close / open the mic.
    int MuteUserMicrophone(const std::string& user_id, bool mute, Callback callback) override;
    int MuteAllUsersMicrophone(bool mute) override;

    // 主持人邀请成员关闭/打开摄像头。
    // When the host calls this API to invite a member to close / open the camera.
    int MuteUserCamera(const std::string& user_id, bool mute, Callback callback) override;
    int MuteAllUsersCamera(bool mute) override;

    // 主持人禁止房间内IM聊天。
    // When the host calls this API to disable IM chat in the room.
    int MuteChatRoom(bool mute) override;

    // 主持人踢人，成员端会收到OnExitRoom(1, "")回调。
    // When the host calls this API to remove a member, the member will receive the `OnExitRoom(1, "")` callback.
    int KickOffUser(const std::string& user_id, Callback callback) override;

    // 主持人取消邀请成员发言。
    // This API is used by the anchor to cancel the mic-on invitation sent to a member.
    int CancelSpeechInvitation(const std::string& user_id, Callback callback) override;
    // 成员同意/拒绝主持人的发言邀请
    // This API is used by a member to accept/reject the invitation to speak from the host.
    int ReplySpeechInvitation(const std::string& request_id, bool agree, Callback callback) override;

    // 成员申请发言
    // This API is used by a member to request to speak.
    int SendSpeechApplication(Callback callback) override;
    // 成员取消申请发言
    // This API is used by a member to cancel their request to speak.
    int CancelSpeechApplication(Callback callback) override;
    // 主持人回复成员的发言申请
    // This API is used by the host to reply to a member's request to speak.
    int ReplySpeechApplication(const std::string& user_id, bool agree, Callback callback) override;
    // 主持人禁止申请发言
    // This API is used by the host to disable requests to speak.
    int ForbidSpeechApplication(bool forbid) override;

    // 主持人令成员停止发言
    // This API is used by the host to exit speech state of the specified member.
    int SendOffSpeaker(const std::string& user_id, Callback callback) override;
    // 主持人令所有成员停止发言
    // This API is used by the host to exit speech state of all members.
    int SendOffAllSpeakers(Callback callback) override;

    // 成员直接停止发言，如果成员在台上，则直接停止发言。
    // This API is used by a member to exit speech state.
    int ExitSpeechState() override;

    int EnterSpeechState(SuccessCallback success_callback,
                         ErrorCallback error_callback) override;

    /******************************************
    * 基础组件接口。(Basic component APIs)
    *******************************************/
    liteav::ITXDeviceManager* GetDeviceManager() override;
    IScreenShareManager* GetScreenShareManager() override;

    /*****************************************
    * 云录制接口。(On-cloud recording APIs)
    *****************************************/
    int StartCloudRecord() override;
    int StopCloudRecord() override;

    /***************************************
    * 美颜功能接口。(Beauty filter APIs)
    ***************************************/
    int SetBeautyStyle(liteav::TRTCBeautyStyle style, uint32_t beauty_level,
        uint32_t whiteness_level, uint32_t ruddiness_level) override;

    /*************************
    * 设置网络流控相关参数（例如弱网下是“保清晰”还是“保流畅”）。
    * Set QoS parameters (for example, whether to prioritize clarity or smoothness under poor network conditions)
    *************************/
    int SetVideoQosPreference(TUIVideoQosPreference preference) override;

    /*************************
    * 设置显示仪表盘。
    * Set whether to display the dashboard
    *************************/
    int ShowDebugView(int show_type) override;

private:
    void OnFirstVideoFrame(const char* user_id, const TUIStreamType stream_type);

private:
    // TRTC callback
    void onError(TXLiteAVError error_code, const char* error_message, void* extra_info);
    void onWarning(TXLiteAVWarning warning_code, const char* warning_message, void* extra_info);

    // TUIRoomEngine callback
    void onError(tuikit::TUIError error_code, const char* message) override;
    void onKickedOffLine(const char* message) override;
    void onUserSigExpired() override;
    void onRoomNameChanged(const char* room_id, const char* room_name) override;
    void onAllUserMicrophoneDisableChanged(const char* room_id, bool is_disable) override;
    void onAllUserCameraDisableChanged(const char* room_id, bool is_disable) override;
    void onSendMessageForAllUserDisableChanged(const char* room_id, bool is_disable) override;
    void onRoomDismissed(const char* room_id) override;
    void onKickedOutOfRoom(const char* room_id, tuikit::TUIKickedOutOfRoomReason reason, const char* message) override;
    void onRoomSpeechModeChanged(const char* room_id, tuikit::TUISpeechMode speech_mode) override;
    void onRemoteUserEnterRoom(const char* room_id, const tuikit::TUIUserInfo& user_info) override;
    void onRemoteUserLeaveRoom(const char* room_id, const tuikit::TUIUserInfo& user_info) override;
    void onUserRoleChanged(const char* user_id, tuikit::TUIRole role) override;
    void onUserVideoStateChanged(const char* user_id, tuikit::TUIVideoStreamType stream_type, bool has_video, tuikit::TUIChangeReason reason) override;
    void onUserAudioStateChanged(const char* user_id, bool has_video, tuikit::TUIChangeReason reason) override;
    void onUserVoiceVolumeChanged(tuikit::TUIMap<const char*, int>* volume_map) override;

    void onScreenShareForAllUserDisableChanged(const char* room_id, bool is_disable) override;
    void onSendMessageForUserDisableChanged(const char* room_id, const char* user_id, bool is_disable) override;
    void onUserNetworkQualityChanged(tuikit::TUIList<tuikit::TUINetwork>* network_list) override;
    void onUserScreenCaptureStopped(int reason) override;
    void onRoomMaxSeatCountChanged(const char* room_id, int max_seat_count) override;
    void onSeatListChanged(tuikit::TUIList<tuikit::TUISeatInfo>* seat_list, tuikit::TUIList<tuikit::TUISeatInfo>* seated_list, tuikit::TUIList<tuikit::TUISeatInfo>* left_list) override;
    void onKickedOffSeat(const char* user_id) override;
    void onRequestReceived(const tuikit::TUIRequest* request) override;
    void onRequestCancelled(const char* request_id, const char* user_id) override;
    void onRequestProcessed(const char* request_id, const char* user_id) override;
    void onReceiveTextMessage(const char* room_id, const tuikit::TUIMessage& message) override;
    void onReceiveCustomMessage(const char* room_id, const tuikit::TUIMessage& message) override;
    void onDeviceChanged(const char* deviceId, liteav::TXMediaDeviceType type, liteav::TXMediaDeviceState state) override;
    void onRoomSeatModeChanged(const char* room_id, tuikit::TUISeatMode seat_mode) override;
    ///

    void LocalUserVideoStateChanged(tuikit::TUIVideoStreamType stream_type, bool has_video, tuikit::TUIChangeReason reason);
    void LocalUserAudioStateChanged(bool has_audio, tuikit::TUIChangeReason reason);

    void RemoteUserVideoStateChanged(const std::string& user_id, tuikit::TUIVideoStreamType stream_type, bool has_video);
    void RemoteUserAduioStateChanged(const std::string& user_id, bool has_audio);

 private:
    void ClearRoomInfo();
    void TakeSeat(SuccessCallback success_callback, ErrorCallback error_callback);
    void GetSeatList();
    void GetUserList(uint64_t next_sequence, SuccessCallback success_callback,
                     ErrorCallback error_callback);

 private:
    ITRTCCloud*    trtc_cloud_ = nullptr;
    tuikit::TUIRoomEngine* room_engine_ = nullptr;
    TUIRoomCoreCallback*          room_core_callback_ = nullptr;
    std::vector<std::string> received_request_ids_;

    liteav::ITXDeviceManager*     device_manager_ = nullptr;
    IScreenShareManager* screen_share_manager_ = nullptr;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> screen_window_info_list_;

    TUIUserInfo                   local_user_info_;
    TUIRoomInfo                   room_info_;
    std::unordered_map<std::string, TUIUserInfo> room_user_map_;

    bool            enter_room_success_ = false;
    bool            camera_mirror_ = false;
    bool            open_ai_noise_reduction_ = false;
    int             sdk_app_id_;
    std::string     user_sig_;
    std::string     sdk_version_;
    tuikit::TUIAudioQuality audio_quality_ = tuikit::TUIAudioQuality::kAudioQualitySpeech;
};

#endif  //  MODULE_TUIROOMCOREIMPL_H_
