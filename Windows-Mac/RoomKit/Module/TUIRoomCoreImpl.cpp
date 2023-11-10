// Copyright (c) 2021 Tencent. All rights reserved.
#include <regex>
#include <algorithm>
#include <cstdlib>
#include <sstream>
#include "TUIRoomCoreImpl.h"
#include "ITRTCCloud.h"
#ifdef _WIN32
#include "TXLiteAVBase.h"
#endif
#include "ITXDeviceManager.h"
#include "ScreenShareManager.h"
#include "log.h"

#define TIMEOUT 15
#define MAX_SEAT_COUNT 0

static TUIRoomCore* room_core_ = nullptr;
static std::mutex room_core_mutex_;
TUIRoomCore* TUIRoomCore::GetInstance() {
    if (room_core_ == nullptr) {
        std::lock_guard<std::mutex> lock(room_core_mutex_);
        if (room_core_ == nullptr) {
            room_core_ = new (std::nothrow)TUIRoomCoreImpl;
        }
    }

    return room_core_;
}
void TUIRoomCore::DestroyInstance() {
    std::lock_guard<std::mutex> lock(room_core_mutex_);
    if (room_core_ != nullptr) {
        delete room_core_;
        room_core_ = nullptr;
    }
}

TUIRoomCoreImpl::TUIRoomCoreImpl() {
}

TUIRoomCoreImpl::~TUIRoomCoreImpl() {
    LINFO("destory TUIRoomCore");
    room_core_callback_ = nullptr;

    if (room_engine_ != nullptr) {
        room_engine_->removeObserver(this);
        destroyTUIRoomEngine(room_engine_);
        room_engine_ = nullptr;
        device_manager_ = nullptr;
        screen_share_manager_ = nullptr;
    }
}

void TUIRoomCoreImpl::SetCallback(TUIRoomCoreCallback* callback) {
    LINFO("---SetCallback----");
    room_core_callback_ = callback;
}

void TUIRoomCoreImpl::ClearRoomInfo() {
    local_user_info_.role = tuikit::TUIRole::kGeneralUser;
    local_user_info_.has_audio_stream = false;
    local_user_info_.has_video_stream = false;
    local_user_info_.has_screen_stream = false;

    room_user_map_.clear();
    enter_room_success_ = false;

    LINFO("ClearRoomInfo");
}

int TUIRoomCoreImpl::Login(int sdk_appid, const std::string& user_id, const std::string& user_sig) {
    local_user_info_.user_id = user_id;
    sdk_app_id_ = sdk_appid;
    user_sig_ = user_sig;
    room_user_map_[user_id] = local_user_info_;
    LINFO("User Login,sdk_app_id : %d , user_id : %s , user_sig : %s", sdk_appid, user_id.c_str(), user_sig.c_str());
    if (room_engine_ == nullptr) {
      room_engine_ = createTUIRoomEngine();
        if (room_engine_ != nullptr) {
            trtc_cloud_ = getTRTCShareInstance();
            room_engine_->addObserver(this);
        } else {
            LINFO("getRoomEngineInstance error,trtc_cloud is null");
            return -1;
        }
    }

    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    callback->SetCallback([=]() {
            LINFO("login success.");
            if (room_core_callback_ != nullptr) {
                room_core_callback_->OnLogin(0, "login success.");
            }
            delete callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine init failed: %d %s", code, message.c_str());
            if (room_core_callback_ != nullptr) {
                room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorLoginFailed), "login failed.");
            }

            delete callback;
        });
    tuikit::TUIRoomEngine::login(sdk_appid, user_id.c_str(), user_sig.c_str(),
                                 callback);

    return 0;
}

int TUIRoomCoreImpl::Logout() {
    LINFO("User Logout, user_id : %s", local_user_info_.user_id.c_str());
    local_user_info_.user_id = "";
    local_user_info_.role = tuikit::TUIRole::kGeneralUser;
    local_user_info_.user_name = "";
    local_user_info_.has_audio_stream = false;
    local_user_info_.has_video_stream = false;
    local_user_info_.has_screen_stream = false;
    trtc_cloud_ = nullptr;
    tuikit::TUIRoomEngine::logout(nullptr);
    ClearRoomInfo();
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnLogout(0, "logout success.");
    }

    destroyTUIRoomEngine(room_engine_);
    room_engine_ = nullptr;

    if (screen_share_manager_) {
      delete screen_share_manager_;
      screen_share_manager_ = nullptr;
    }

    device_manager_ = nullptr;
    return 0;
}
const char* TUIRoomCoreImpl::GetSDKVersion() {
#ifdef _WIN32
    sdk_version_ = TOSTRING(getLiteAvSDKVersion());
    return sdk_version_.c_str();
#else
    return "";
#endif
}
int TUIRoomCoreImpl::CreateRoom(const std::string& room_id, tuikit::TUISpeechMode speech_mode) {
    // 创建房间者为房主角色
    // The room creator is the room owner
    LINFO("User CreateRoom, user_id : %s,room_id :%s,speech_mode : %d",
        local_user_info_.user_id.c_str(), room_id.c_str(), speech_mode);

    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
      callback->SetCallback(
          [=]() {
            local_user_info_.role = tuikit::TUIRole::kRoomOwner;
            room_info_.room_id = room_id;
            room_info_.room_name = room_id;
            room_info_.mode = speech_mode;
            room_user_map_[local_user_info_.user_id] = local_user_info_;
            if (room_core_callback_ != nullptr) {
              room_core_callback_->OnCreateRoom(0, "create room success.");
            }
            delete callback;
          },
          [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine create room failed: %d %s", code,
                  message.c_str());
            if (room_core_callback_ != nullptr) {
              room_core_callback_->OnCreateRoom(-1, message);
            }
            delete callback;
          });

        tuikit::TUIRoomInfo roomInfo;
        //roomInfo.roomType = tuikit::TUIRoomType::kConference;
        roomInfo.roomId = room_id.c_str();
        roomInfo.maxSeatCount = 0;
        /*roomInfo.name = room_id.c_str();
        roomInfo.isCameraDisableForAllUser = false;
        roomInfo.isMicrophoneDisableForAllUser = false;
        roomInfo.isMessageDisableForAllUser = false;*/
        room_engine_->createRoom(roomInfo, callback);
    }
    return 0;
}
int TUIRoomCoreImpl::DestroyRoom() {
    LINFO("User DestroyRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_info_.room_id.c_str());
    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("logout success.");
            if (room_core_callback_ != nullptr) {
                room_core_callback_->OnDestroyRoom(0, "destroy success.");
                ClearRoomInfo();
            }
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine logout failed: %d %s", code, message.c_str());
                if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnDestroyRoom(-1, "logout failed.");
                }
                delete callback;
            });
        room_engine_->destroyRoom(callback);
    }
    return 0;
}
void TUIRoomCoreImpl::TakeSeat(SuccessCallback success_callback,
                               ErrorCallback error_callback) {
  if (room_engine_ != nullptr) {
    TUIRoomEngineRequestCallback* callback = new TUIRoomEngineRequestCallback;
    callback->SetCallback([=](RequestCallbackType type, tuikit::TUIError code,
                              const std::string& request_id,
                              const std::string& user_id,
                              const std::string& message) {
      LINFO("room engine TakeSeat callback.");
      switch (type) {
        case RequestCallbackType::kRequestAccepted:
          if (success_callback) {
            success_callback();
          }
          break;
        case RequestCallbackType::kRequestRejected:
          if (error_callback) {
            error_callback(0, "take seat failed");
          }
          break;
        case RequestCallbackType::kRequestTimeout:
          if (error_callback) {
            error_callback(0, "take seat failed");
          }
          break;
        case RequestCallbackType::kRequestError:
          if (error_callback) {
            error_callback(0, "take seat failed");
          }
          break;
        case RequestCallbackType::kRequestCancelled:
          if (error_callback) {
            error_callback(0, "take seat failed");
          }
          break;
        default:
          if (error_callback) {
            error_callback(0, "take seat failed");
          }
          break;
      }
      delete callback;
    });
    room_engine_->takeSeat(-1, TIMEOUT, callback);
  }
}

void TUIRoomCoreImpl::GetSeatList() {
    TUIRoomEngineSeatListCallback* user_list_callback = new TUIRoomEngineSeatListCallback;
    user_list_callback->SetCallback([=](tuikit::TUIList<tuikit::TUISeatInfo>* list) {
            for (int i = 0; i < list->getSize(); i++) {
                const tuikit::TUISeatInfo* member_info = list->getElement(i);
                if (std::string(member_info->userId) == local_user_info_.user_id) {
                    continue;
                }
                std::string remote_user_id = TOSTRING(member_info->userId);

                TUIRoomEngineUserInfoCallback* user_info_callback = new TUIRoomEngineUserInfoCallback;
                user_info_callback->SetCallback([=](tuikit::TUIUserInfo* value) {
                        std::string user_id = std::string(value->userId);
                        TUIUserInfo user;
                        user.user_id = user_id;
                        user.role = value->userRole;
                        user.user_name = TOSTRING(value->userName);
                        user.avatar_url = TOSTRING(value->avatarUrl);
                        user.has_audio_stream = value->hasAudioStream;
                        user.has_video_stream = value->hasVideoStream;
                        user.has_screen_stream = value->hasScreenStream;
                        room_user_map_[user.user_id] = user;

                        if (room_core_callback_ != nullptr) {
                            room_core_callback_->OnRemoteUserEnter(user_id);
                        }
                        delete user_info_callback;
                    }, [=](const tuikit::TUIError code, const std::string& message) {
                        if (room_core_callback_ != nullptr) {
                            room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorGetRoomMemberFailed), "tuikit room engine: get user info failed.");
                        }
                        delete user_info_callback;
                    });
                room_engine_->getUserInfo(remote_user_id.c_str(), user_info_callback); 
            }
            delete user_list_callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine get user list failed: %d %s", code, message.c_str());
            delete user_list_callback;
        });
    if (room_engine_ != nullptr) {
        room_engine_->getSeatList(user_list_callback);
    }
}
void TUIRoomCoreImpl::GetUserList(uint64_t next_sequence,
                                  SuccessCallback success_callback,
                                  ErrorCallback error_callback) {
    TUIRoomEngineUserListCallback* user_list_callback = new TUIRoomEngineUserListCallback;
    user_list_callback->SetCallback([=](const tuikit::TUIUserListResult* user_list) {
        for (int i = 0; i < user_list->userInfoList->getSize(); i++) {
            const tuikit::TUIUserInfo* member_info =
                user_list->userInfoList->getElement(i);
            if (std::string(member_info->userId) == local_user_info_.user_id) {
                continue;
            }
            std::string remote_user_id = TOSTRING(member_info->userId);
            TUIUserInfo user;
            user.user_id = remote_user_id;
            user.role = member_info->userRole;
            user.user_name = TOSTRING(member_info->userName);
            user.avatar_url = TOSTRING(member_info->avatarUrl);
            user.has_audio_stream = member_info->hasAudioStream;
            user.has_video_stream = member_info->hasVideoStream;
            user.has_screen_stream = member_info->hasScreenStream;
            room_user_map_[user.user_id] = user;
        }
        if (user_list->nextSequence) {
            GetUserList(user_list->nextSequence,success_callback, error_callback);
        }
        if (user_list->nextSequence == 0 && success_callback) {
          success_callback();
        }
        delete user_list_callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine get user list failed: %d %s", code, message.c_str());
          if (error_callback) {
            error_callback(static_cast<int>(code), message);
          }
            delete user_list_callback;
        });
    if (room_engine_ != nullptr) {
        room_engine_->getUserList(next_sequence, user_list_callback);
    }
}
int TUIRoomCoreImpl::EnterRoom(const std::string& room_id) {
    LINFO("User EnterRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_id.c_str());

    if (room_engine_ != nullptr) {
        LINFO("User EnterRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_id.c_str());
        TUIRoomEngineRoomInfoCallback* callback = new TUIRoomEngineRoomInfoCallback;
        callback->SetCallback([=](const tuikit::TUIRoomInfo* room_info) {
            LINFO("enterRoom success.");
            enter_room_success_ = true;

            room_info_.is_all_camera_muted = room_info->isCameraDisableForAllUser;
            room_info_.is_all_microphone_muted = room_info->isMicrophoneDisableForAllUser;
            room_info_.is_chat_room_muted = room_info->isMessageDisableForAllUser;
            room_info_.mode = room_info->speechMode;
            room_info_.start_time = room_info->createTime;
            room_info_.owner_id = room_info->ownerId;
            room_info_.room_name = room_info->name;
            room_info_.room_id = room_info->roomId;
            if (room_info_.owner_id == local_user_info_.user_id) {
                if (local_user_info_.role !=  tuikit::TUIRole::kRoomOwner) {
                    local_user_info_.role = tuikit::TUIRole::kRoomOwner;
                    room_user_map_[local_user_info_.user_id] = local_user_info_;
                }
            }
            delete callback;
            GetUserList(
                0,
                [=]() {
                  if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnEnterRoom(0, "enter room success.");
                  }
                },
                [=](int code, const std::string& message) {
                  LINFO("room engine enterRoom failed: %d %s", code,
                        message.c_str());
                  if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnEnterRoom(-1, "enter room failed.");
                  }
                });
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine enterRoom failed: %d %s", code, message.c_str());
                if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnEnterRoom(-1, "enter room failed.");
                }
                delete callback;
            });
        room_engine_->enterRoom(room_id.c_str(), callback);
    }

    return 0;
}
int TUIRoomCoreImpl::LeaveRoom() {
    LINFO("User LeaveRoom, user_id : %s,room_id :%s", local_user_info_.user_id.c_str(), room_info_.room_id.c_str());
    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("exitRoomAsync success.");
            enter_room_success_ = false;
            if (room_core_callback_ != nullptr) {
                //room_core_callback_->OnExitRoom(TUIExitRoomType::kNormal, "exit room success.");
                ClearRoomInfo();
            }
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine exitRoomAsync failed: %d %s", code, message.c_str());
                if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnError((int)TUIRoomError::kErrorExitRoomFailed, "exit room failed.");
                }
                delete callback;
            });
        room_engine_->exitRoom(true, callback);
    }
    return 0;
}
TUIRoomInfo TUIRoomCoreImpl::GetRoomInfo() {
     return room_info_;
}

std::vector<TUIUserInfo> TUIRoomCoreImpl::GetRoomUsers() {
    std::vector<TUIUserInfo> users;
    for (auto user : room_user_map_) {
        users.push_back(user.second);
    }
    return users;
}

const TUIUserInfo* TUIRoomCoreImpl::GetUserInfo(const std::string& user_id) {
    auto iter = room_user_map_.find(user_id);
    if (iter != room_user_map_.end()) {
        return &iter->second;
    }
    return nullptr;
}

int TUIRoomCoreImpl::SetSelfProfile(const std::string& user_name, const std::string& avatar_url) {
    local_user_info_.user_name = user_name;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    LINFO("User SetSelfProfile, user_name : %s, avatar_url", user_name.c_str(), avatar_url.c_str());
    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("room engine SetSelfProfile success.");
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine SetSelfProfile failed: %d %s", code, message.c_str());
                delete callback;
            });
        room_engine_->setSelfInfo(user_name.c_str(), avatar_url.c_str(), callback);
    }
    return 0;
}

int TUIRoomCoreImpl::TransferRoomMaster(const std::string& user_id) {
    LINFO("TransferRoomMasterToOther, user_id : %s", user_id.c_str());
    auto iter = room_user_map_.find(user_id);
    if (iter != room_user_map_.end()) {
        if (room_engine_) {
            TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
            callback->SetCallback([=]() {
                    LINFO("room engine changeUserRole success.");
                    delete callback;
                  LeaveRoom();
                }, [=](const tuikit::TUIError code, const std::string& message) {
                    LINFO("room engine changeUserRole failed: %d %s", code, message.c_str());
                    delete callback;
                  DestroyRoom();
                });
            room_engine_->changeUserRole(user_id.c_str(), tuikit::TUIRole::kRoomOwner, callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::StartCameraDeviceTest(bool start, const liteav::TXView& view) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    if (start) {
        LINFO("StartCameraDeviceTest");
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("room engine openLocalCamera success.");
            this->OnFirstVideoFrame(local_user_info_.user_id.c_str(), TUIStreamType::kStreamTypeCamera);
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine openLocalCamera failed: %d %s", code, message.c_str());
                delete callback;
            });
        room_engine_->setLocalVideoView(view);
        room_engine_->openLocalCamera(false, tuikit::TUIVideoQuality::kVideoQuality_1080P, callback);

        local_user_info_.has_subscribed_video_stream = true;
    } else {
        room_engine_->closeLocalCamera();
        local_user_info_.has_video_stream = false;
        local_user_info_.has_subscribed_video_stream = false;
    }
    room_user_map_[local_user_info_.user_id] = local_user_info_;

    return 0;
}

int TUIRoomCoreImpl::StartCameraPreview(const liteav::TXView& view) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("StartCameraPreview");
    room_engine_->setLocalVideoView(view);
    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    callback->SetCallback([=]() {
        LINFO("room engine openLocalCamera success.");
          if (trtc_cloud_) {
            liteav::TRTCRenderParams render_params;
            render_params.fillMode = liteav::TRTCVideoFillMode_Fit;
            trtc_cloud_->setLocalRenderParams(render_params);
          }
        this->OnFirstVideoFrame(local_user_info_.user_id.c_str(), TUIStreamType::kStreamTypeCamera);
          if (callback) {
            delete callback;
          }
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine openLocalCamera failed: %d %s", code, message.c_str());
            this->onError(TXLiteAVError::ERR_CAMERA_START_FAIL, "", nullptr);
          if (callback) {
            delete callback;
          }
        });

    room_engine_->openLocalCamera(false, tuikit::TUIVideoQuality::kVideoQuality_1080P, callback);
    return 0;
}
int TUIRoomCoreImpl::StopCameraPreview() {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("StopCameraPreview");
    room_engine_->closeLocalCamera();
    local_user_info_.has_video_stream = false;
    local_user_info_.has_subscribed_video_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;

    return 0;
}
int TUIRoomCoreImpl::UpdateCameraPreview(const liteav::TXView& view) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    room_engine_->setLocalVideoView(view);
    return 0;
}

int TUIRoomCoreImpl::StartLocalAudio(tuikit::TUIAudioQuality quality) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("StartLocalAudio");

    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    callback->SetCallback([=]() {
        LINFO("room engine openLocalMicrophone success.");
          //local_user_info_.has_audio_stream = true;
          //local_user_info_.has_subscribed_audio_stream = true;
          //room_user_map_[local_user_info_.user_id] = local_user_info_;
          if (callback) {
            delete callback;
          }
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine openLocalMicrophone failed: %d %s", code, message.c_str());
          if (callback) {
            delete callback;
          }
        });
    room_engine_->openLocalMicrophone(quality, callback);

    audio_quality_ = quality;
    if (open_ai_noise_reduction_) {
        OpenAINoiseReduction();
    }
    return 0;
}
int TUIRoomCoreImpl::StopLocalAudio() {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("StopLocalAudio");

    room_engine_->closeLocalMicrophone();

    local_user_info_.has_audio_stream = false;
    local_user_info_.has_subscribed_audio_stream = false;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    return 0;
}

int TUIRoomCoreImpl::StartSystemAudioLoopback() {
    LINFO("StartSystemAudioLoopback");
    if (trtc_cloud_) {
        trtc_cloud_->startSystemAudioLoopback();
    }

    return -1;
}

int TUIRoomCoreImpl::StopSystemAudioLoopback() {
    LINFO("StopSystemAudioLoopback");
    if (trtc_cloud_) {
        trtc_cloud_->stopSystemAudioLoopback();
    }

    return -1;
}

int TUIRoomCoreImpl::StartRemoteView(const std::string& user_id, const liteav::TXView& view, TUIStreamType type) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return -1;
    }
    LINFO("StartRemoteView , user_id : %s, user_name : %s, stream_type : %d", user_id.c_str(), iter->second.user_name.c_str(), type);
    tuikit::TUIVideoStreamType stream_type;
    switch (type) {
    case TUIStreamType::kStreamTypeCamera:
        stream_type = tuikit::TUIVideoStreamType::kCameraStream;
        iter->second.has_subscribed_video_stream = true;
        break;
    case TUIStreamType::kStreamTypeScreen:
        stream_type = tuikit::TUIVideoStreamType::kScreenStream;
        iter->second.has_subscribed_screen_stream = true;
        break;
    default:
        break;
    }

    TUIRoomEnginePlayCallback* callback = new TUIRoomEnginePlayCallback;
    callback->SetCallback([=](const std::string& user_id) {
        LINFO("room engine startPlayRemoteVideoStream playing.");
        this->OnFirstVideoFrame(user_id.c_str(), type);
        if (trtc_cloud_) {
          TRTCRenderParams render_params;
          render_params.fillMode = liteav::TRTCVideoFillMode_Fit;
          if (type == TUIStreamType::kStreamTypeCamera)
            trtc_cloud_->setRemoteRenderParams(
                user_id.c_str(),
                liteav::TRTCVideoStreamType::TRTCVideoStreamTypeBig,
                render_params);
          else {
            trtc_cloud_->setRemoteRenderParams(
                user_id.c_str(),
                liteav::TRTCVideoStreamType::TRTCVideoStreamTypeSub,
                render_params);
          }
        }
        delete callback;
    }, [=](const std::string& user_id) {
        LINFO("room engine startPlayRemoteVideoStream loading.");

    }, [=](const std::string& user_id, tuikit::TUIError code, const std::string& message) {
        LINFO("room engine startPlayRemoteVideoStream failed: %d %s", code, message.c_str());
        delete callback;
    });
    room_engine_->setRemoteVideoView(user_id.c_str(), stream_type, view);
    room_engine_->startPlayRemoteVideo(user_id.c_str(), stream_type, callback);

    return 0;
}
int TUIRoomCoreImpl::StopRemoteView(const std::string& user_id, TUIStreamType type) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return -1;
    }
    LINFO("StopRemoteView , user_id : %s, user_name : %s, stream_type : %d", user_id.c_str(), iter->second.user_name.c_str(), type);
    if (type == TUIStreamType::kStreamTypeCamera) {
        room_engine_->stopPlayRemoteVideo(user_id.c_str(), tuikit::TUIVideoStreamType::kCameraStream);
        iter->second.has_subscribed_video_stream = false;
    } else if (type == TUIStreamType::kStreamTypeScreen) {
        room_engine_->stopPlayRemoteVideo(user_id.c_str(), tuikit::TUIVideoStreamType::kScreenStream);
        iter->second.has_subscribed_screen_stream = false;
    }
    return 0;
}

int TUIRoomCoreImpl::UpdateRemoteView(const std::string& user_id, TUIStreamType type, const liteav::TXView& view) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    auto iter = room_user_map_.find(user_id);
    if (iter == room_user_map_.end()) {
        return -1;
    }
    tuikit::TUIVideoStreamType stream_type;
    switch (type) {
    case TUIStreamType::kStreamTypeCamera:
        stream_type = tuikit::TUIVideoStreamType::kCameraStream;
        iter->second.has_subscribed_video_stream = true;
        break;
    case TUIStreamType::kStreamTypeScreen:
        stream_type = tuikit::TUIVideoStreamType::kScreenStream;
        iter->second.has_subscribed_screen_stream = true;
        break;
    default:
        break;
    }
    room_engine_->setRemoteVideoView(user_id.c_str(), stream_type, view);
    return 0;
}

int TUIRoomCoreImpl::SendChatMessage(const std::string& message) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("SendChatMessage , message : %s", message.c_str());
    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    callback->SetCallback([=]() {
        LINFO("room engine SendChatMessage success.");
        delete callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine SendChatMessage failed: %d %s", code, message.c_str());
            delete callback;
        });
    room_engine_->sendTextMessage(message.c_str(), callback);

    return 0;
}

int TUIRoomCoreImpl::SendCustomMessage(const std::string& message) {
    if (room_engine_ == nullptr) {
        return -1;
    }
    LINFO("SendCustomMessage , message : %s", message.c_str());
    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    callback->SetCallback([=]() {
        LINFO("room engine SendCustomMessage success.");
        delete callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine SendCustomMessage failed: %d %s", code, message.c_str());
            delete callback;
        });
    room_engine_->sendCustomMessage(message.c_str(), callback);

    return 0;
}

int TUIRoomCoreImpl::MuteUserMicrophone(const std::string& user_id, bool mute, Callback callback) {
    LINFO("MuteUserMicrophone , user_id : %s, mute : %d", user_id.c_str(), mute);
    if (room_engine_ != nullptr) {
        if (mute) {
          TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
          callback->SetCallback([=]() {}, [=](const tuikit::TUIError code,
                                              const std::string& message) {});
          room_engine_->closeRemoteDeviceByAdmin(user_id.c_str(), tuikit::TUIMediaDevice::kMicrophone, callback);
        } else {
          TUIRoomEngineRequestCallback* request_callback =
              new TUIRoomEngineRequestCallback;
          request_callback->SetCallback(
              [=](RequestCallbackType type, tuikit::TUIError code,
                  const std::string& request_id, const std::string& user_id,
                  const std::string& message) {
                LINFO("room engine MuteUserMicrophone callback.");
                if (callback != nullptr) {
                  switch (type) {
                    case RequestCallbackType::kRequestAccepted:
                      callback(RequestCallbackType::kRequestAccepted,
                               "Request Accepted");
                      break;
                    case RequestCallbackType::kRequestRejected:
                      callback(RequestCallbackType::kRequestRejected,
                               "Request Rejected");
                      break;
                    case RequestCallbackType::kRequestTimeout:
                      callback(RequestCallbackType::kRequestTimeout,
                               "Request Timeout");
                      break;
                    case RequestCallbackType::kRequestError:
                      callback(RequestCallbackType::kRequestError,
                               "Request Error:" + message);
                      break;
                    default:
                      break;
                  }
                }
                delete request_callback;
              });
            room_engine_->openRemoteDeviceByAdmin(user_id.c_str(),tuikit::TUIMediaDevice::kMicrophone, TIMEOUT, request_callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::MuteAllUsersMicrophone(bool mute) {
    LINFO("MuteAllUsersMicrophone");
    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("room engine MuteAllUsersMicrophone success.");
            room_info_.is_all_microphone_muted = mute;
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine MuteAllUsersMicrophone failed: %d %s", code, message.c_str());
                delete callback;
            });
        room_engine_->disableDeviceForAllUserByAdmin(tuikit::TUIMediaDevice::kMicrophone, mute, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::MuteUserCamera(const std::string& user_id, bool mute, Callback callback) {
    LINFO("MuteUserCamera , user_id : %s, mute : %d", user_id.c_str(), mute);
    if (room_engine_ != nullptr) {
        if (mute) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
          callback->SetCallback([=]() {}, [=](const tuikit::TUIError code,
                                              const std::string& message) {});
          room_engine_->closeRemoteDeviceByAdmin(user_id.c_str(), tuikit::TUIMediaDevice::kCamera, callback);
        } else {
          TUIRoomEngineRequestCallback* request_callback =
              new TUIRoomEngineRequestCallback;
          request_callback->SetCallback(
              [=](RequestCallbackType type, tuikit::TUIError code,
                  const std::string& request_id, const std::string& user_id,
                  const std::string& message) {
                LINFO("room engine MuteUserMicrophone callback.");
                if (callback != nullptr) {
                  switch (type) {
                    case RequestCallbackType::kRequestAccepted:
                      callback(RequestCallbackType::kRequestAccepted,
                               "Request Accepted");
                      break;
                    case RequestCallbackType::kRequestRejected:
                      callback(RequestCallbackType::kRequestRejected,
                               "Request Rejected");
                      break;
                    case RequestCallbackType::kRequestTimeout:
                      callback(RequestCallbackType::kRequestTimeout,
                               "Request Timeout");
                      break;
                    case RequestCallbackType::kRequestError:
                      callback(RequestCallbackType::kRequestError,
                               "Request Error:" + message);
                      break;
                    default:
                      break;
                  }
                }
                delete request_callback;
              });
            room_engine_->openRemoteDeviceByAdmin(user_id.c_str(), tuikit::TUIMediaDevice::kCamera, TIMEOUT, request_callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::MuteAllUsersCamera(bool mute) {
    LINFO("MuteAllUsersCamera");
    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            LINFO("room engine MuteAllUsersCamera success.");
              room_info_.is_all_camera_muted = mute;
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                LINFO("room engine MuteAllUsersCamera failed: %d %s", code, message.c_str());
                delete callback;
            });
        room_engine_->disableDeviceForAllUserByAdmin(tuikit::TUIMediaDevice::kCamera, mute, callback);
    }
    return 0;
}

int TUIRoomCoreImpl::MuteChatRoom(bool mute) {
    if (local_user_info_.role == tuikit::TUIRole::kRoomOwner) {
        LINFO("MuteChatRoom, mute : %d", mute);
        if (room_engine_ != nullptr) {
            TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
            callback->SetCallback([=]() {
                LINFO("room engine updateRoomInfo success.");
                room_info_.is_chat_room_muted = mute;
                delete callback;
                }, [=](const tuikit::TUIError code, const std::string& message) {
                    LINFO("room engine updateRoomInfo failed: %d %s", code, message.c_str());
                    delete callback;
                });
            room_engine_->disableSendingMessageForAllUser(mute, callback);
        }
    }
    return 0;
}

int TUIRoomCoreImpl::KickOffUser(const std::string& user_id, Callback callback) {
    LINFO("KickOffUser user_id : %s", user_id.c_str());
    if (room_engine_ == nullptr) {
        return -1;
    }
    TUIRoomEngineCallback* tui_callback = new TUIRoomEngineCallback;
    tui_callback->SetCallback([=]() {
        LINFO("room engine kickoutRemoteUser success.");
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnRemoteUserLeave(user_id);
        }
        delete tui_callback;
        }, [=](const tuikit::TUIError code, const std::string& message) {
            LINFO("room engine kickoutRemoteUser failed: %d %s", code, message.c_str());
            if (callback) {
                callback(RequestCallbackType::kRequestError, message.c_str());
            }
            delete tui_callback;
        });
    room_engine_->kickRemoteUserOutOfRoom(user_id.c_str(), tui_callback);

    return 0;
}

int TUIRoomCoreImpl::CancelSpeechInvitation(const std::string& user_id, Callback callback) {
    LINFO("CancelSpeechInvitation user_id : %s", user_id.c_str());

    return 0;
}

int TUIRoomCoreImpl::ReplySpeechInvitation(const std::string& request_id,
                                           bool agree, Callback callback) {
    LINFO("User ReplySpeechInvitation agree : %d", agree);
    auto iter = std::find(received_request_ids_.begin(), received_request_ids_.end(), request_id);
    if (iter != received_request_ids_.end()) {
        if (room_engine_ != nullptr) {
            TUIRoomEngineCallback* request_callback = new TUIRoomEngineCallback;
            request_callback->SetCallback([=]() {
                    delete request_callback;
                },
                [=](const tuikit::TUIError code, const std::string& message) {
                    delete request_callback;
                });
            room_engine_->responseRemoteRequest(request_id.c_str(), agree, request_callback);
        }
        if (agree && callback) {
            callback(RequestCallbackType::kRequestAccepted, "");
        }
        received_request_ids_.erase(iter);
    } else if (callback) {
        callback(RequestCallbackType::kRequestTimeout, "The request has been timeout.");
    }
    return 0;
}

int TUIRoomCoreImpl::SendSpeechApplication(Callback callback) {
    LINFO("User SendSpeechApplication");

    return 0;
}

int TUIRoomCoreImpl::CancelSpeechApplication(Callback callback) {
    LINFO("User CancelSpeechApplication");

    return 0;
}

int TUIRoomCoreImpl::ReplySpeechApplication(const std::string& user_id, bool agree, Callback callback) {
    LINFO("Master ReplySpeechApplication user_id :%s,agree : %d", user_id.c_str(), agree);

    return 0;
}

int TUIRoomCoreImpl::ForbidSpeechApplication(bool forbid) {

    return 0;
}

int TUIRoomCoreImpl::SendOffSpeaker(const std::string& user_id, Callback callback) {
    LINFO("SendOffSpeaker user_id : %s", user_id.c_str());

    return 0;
}

int TUIRoomCoreImpl::SendOffAllSpeakers(Callback callback) {
    LINFO("SendOffAllSpeakers");

    return 0;
}

int TUIRoomCoreImpl::ExitSpeechState() {
    if (room_engine_) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback(
            [=]() {
              local_user_info_.has_screen_stream = false;
              local_user_info_.has_subscribed_screen_stream = false;
              local_user_info_.has_audio_stream = false;
              local_user_info_.has_subscribed_audio_stream = false;
              local_user_info_.has_video_stream = false;
              local_user_info_.has_subscribed_video_stream = false;
              room_user_map_[local_user_info_.user_id] = local_user_info_;
              delete callback;
            },
            [=](const tuikit::TUIError code, const std::string& message) {
              delete callback;
            });
        room_engine_->leaveSeat(callback);
    }

    return 0;
}

int TUIRoomCoreImpl::EnterSpeechState(SuccessCallback success_callback,
                                      ErrorCallback error_callback) {
  TakeSeat(success_callback, error_callback);
  return 0;
}

liteav::ITXDeviceManager* TUIRoomCoreImpl::GetDeviceManager() {
    if (device_manager_ == nullptr) {
        device_manager_ = getTRTCShareInstance()->getDeviceManager();
    }
    return device_manager_;
}
IScreenShareManager* TUIRoomCoreImpl::GetScreenShareManager() {
    if (screen_share_manager_ == nullptr) {
        screen_share_manager_ = new (std::nothrow)ScreenShareManager(room_engine_, room_core_callback_);
    }
    return screen_share_manager_;
}

int TUIRoomCoreImpl::StartCloudRecord() {
    // TODO
    return 0;
}
int TUIRoomCoreImpl::StopCloudRecord() {
    // TODO
    return 0;
}

int TUIRoomCoreImpl::SetBeautyStyle(liteav::TRTCBeautyStyle style, uint32_t beauty_level,
    uint32_t whiteness_level, uint32_t ruddiness_level) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }
    trtc_cloud_ = getTRTCShareInstance();
    trtc_cloud_->setBeautyStyle(style, beauty_level, whiteness_level, ruddiness_level);
    return 0;
}

int TUIRoomCoreImpl::SetVideoQosPreference(TUIVideoQosPreference preference) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }

    liteav::TRTCNetworkQosParam param;
    switch (preference) {
    case TUIVideoQosPreference::kSmooth:
        param.preference = liteav::TRTCVideoQosPreferenceSmooth;
        break;
    case TUIVideoQosPreference::kClear:
        param.preference = liteav::TRTCVideoQosPreferenceClear;
        break;
    }
    trtc_cloud_->setNetworkQosParam(param);
    return 0;
}

int TUIRoomCoreImpl::SetVideoMirror(bool mirror) {
    liteav::TRTCRenderParams render_params;
    render_params.mirrorType = mirror ? liteav::TRTCVideoMirrorType_Enable : liteav::TRTCVideoMirrorType_Disable;
    render_params.rotation = TRTCVideoRotation0;
    render_params.fillMode = TRTCVideoFillMode_Fill;

    trtc_cloud_->setLocalRenderParams(render_params);
    trtc_cloud_->setVideoEncoderMirror(mirror);
    camera_mirror_ = mirror;
    return 0;
}

int TUIRoomCoreImpl::OpenAINoiseReduction() {
    open_ai_noise_reduction_ = true;
    if (enter_room_success_) {
        std::stringstream ans_level;
        if (audio_quality_ == tuikit::TUIAudioQuality::kAudioQualityMusic) {
            ans_level << "{\"api\":\"enableAudioANS\",\"params\":{\"enable\":1,\"level\":60}}";
        } else {
            ans_level << "{\"api\":\"enableAudioANS\",\"params\":{\"enable\":1,\"level\":120}}";
        }
        if (trtc_cloud_ != nullptr) {
            trtc_cloud_->callExperimentalAPI(ans_level.str().c_str());
        }
        LINFO("OpenAINoiseReduction");
    }
    return 0;
}

int TUIRoomCoreImpl::CloseAINoiseReduction() {
    open_ai_noise_reduction_ = false;
    if (enter_room_success_) {
        std::stringstream ans_level;
        int level = 120;
        if (audio_quality_ == tuikit::TUIAudioQuality::kAudioQualitySpeech) {
            level = 100;
        } else if (audio_quality_ == tuikit::TUIAudioQuality::kAudioQualityDefault) {
            level = 60;
        } else {
            level = 60;
        }
        ans_level << "{\"api\":\"enableAudioANS\",\"params\":{\"enable\":1,\"level\":" << level << "}}";
        if (trtc_cloud_ != nullptr) {
            trtc_cloud_->callExperimentalAPI(ans_level.str().c_str());
        }
        LINFO("CloseAINoiseReduction");
    }
    return 0;
}

int TUIRoomCoreImpl::ShowDebugView(int show_type) {
    if (trtc_cloud_ == nullptr) {
        return -1;
    }

    trtc_cloud_->showDebugView(show_type);
    return 0;
}

//////////////////////////////////////////////////////////////////////////
//                        TRTC callback functions
//////////////////////////////////////////////////////////////////////////
void TUIRoomCoreImpl::onError(TXLiteAVError error_code, const char* error_message, void* extra_info) {
    int trtc_error_code;

    switch (error_code) {
    case ERR_CAMERA_START_FAIL:
    case ERR_CAMERA_NOT_AUTHORIZED:
    case ERR_CAMERA_SET_PARAM_FAIL:
    case ERR_CAMERA_OCCUPY: {
        trtc_error_code = static_cast<int>(TUIRoomError::kErrorStartCameraFailed);
        local_user_info_.has_video_stream = false;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        break;
    }
    case ERR_MIC_START_FAIL:
    case ERR_MIC_NOT_AUTHORIZED:
    case ERR_MIC_SET_PARAM_FAIL:
    case ERR_MIC_OCCUPY: {
        trtc_error_code = static_cast<int>(TUIRoomError::kErrorStartMicrophoneFailed);
        local_user_info_.has_audio_stream = false;
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        break;
    }
    default:
        break;
    }
    LINFO("trtc error, error : %d, error_message: %s", error_code, error_message);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnError(trtc_error_code, error_message);
    }
}
void TUIRoomCoreImpl::onWarning(TXLiteAVWarning warning_code, const char* warning_message, void* extra_info) {
    // 关闭了那个麦克风后 SDK 会回调  WARNING_AUDIO_DEVICE_CAPTURE_STOP_FAILED WARNING_MICROPHONE_NOT_AUTHORIZED 这两个事件
    // After the microphone is disabled, the SDK will call back the 
    // `WARNING_AUDIO_DEVICE_CAPTURE_STOP_FAILED` and `WARNING_MICROPHONE_NOT_AUTHORIZED` events
    LINFO("onWarning, warning : %d, warning_message: %s", warning_code, warning_message);
    if (warning_code == WARNING_MICROPHONE_NOT_AUTHORIZED) {
        static bool is_first = true;
        if (!is_first)
            return;
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorMicrophoneNotAuthorized), warning_message);
        }
        is_first = false;
    } else if (warning_code == WARNING_SCREEN_CAPTURE_NOT_AUTHORIZED) {
        // 用户未授权当前应用使用屏幕录制
        // The user does not authorize the current application to use screen recording
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnError(static_cast<int>(TUIRoomError::kErrorScreenCaptrueNotAuthoized), warning_message);
        }
    }
}

// new private function:
void TUIRoomCoreImpl::OnFirstVideoFrame(const char* user_id, const TUIStreamType stream_type) {
    LINFO("onFirstVideoFrame [user_id :%s] [stream_type:%d]", user_id, stream_type);

    std::string str_user_id = TOSTRING(user_id);
    if (str_user_id == local_user_info_.user_id && enter_room_success_) {
        if (stream_type == TUIStreamType::kStreamTypeCamera) {
            local_user_info_.has_video_stream = true;
            local_user_info_.has_subscribed_video_stream = true;
        } else if (stream_type == TUIStreamType::kStreamTypeScreen) {
            local_user_info_.has_screen_stream = true;
            local_user_info_.has_subscribed_screen_stream = true;
        }
        room_user_map_[local_user_info_.user_id] = local_user_info_;
        str_user_id = local_user_info_.user_id;
    } else {
        if (room_user_map_.find(str_user_id) != room_user_map_.end()) {
            if (stream_type == TUIStreamType::kStreamTypeCamera) {
                room_user_map_[str_user_id].has_video_stream = true;
                room_user_map_[str_user_id].has_subscribed_video_stream = true;
            } else if (stream_type == TUIStreamType::kStreamTypeScreen) {
                room_user_map_[str_user_id].has_screen_stream = true;
                room_user_map_[str_user_id].has_subscribed_screen_stream = true;
            }
        }
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnFirstVideoFrame(str_user_id, stream_type);
    }
}

// TUIRoomEngine callback
void TUIRoomCoreImpl::onError(tuikit::TUIError error_code, const char* message){}
void TUIRoomCoreImpl::onKickedOutOfRoom(const char* room_id, tuikit::TUIKickedOutOfRoomReason reason, const char* message) {
  LINFO("onKickedOutOfRoom [room_id:%s] [message:%s]", room_id, message);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnExitRoom(TUIExitRoomType::kKickOff, "room engine kicked out of room.");
    }
}
void TUIRoomCoreImpl::onKickedOffLine(const char* message) {
  LINFO("onKickedOffLine [message:%s]", message);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnExitRoom(TUIExitRoomType::kKickOffLine, "room engine kicked off line.");
    }
}
void TUIRoomCoreImpl::onUserSigExpired() {
  LINFO("onUserSigExpired");
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnExitRoom(TUIExitRoomType::kUserSigExpired, "room engine user signature expired.");
    }
}
void TUIRoomCoreImpl::onRoomNameChanged(const char* room_id, const char* room_name) {
  LINFO("onRoomNameChanged, room_id:%s, room_name:%s", room_id, room_name);
  room_info_.room_name = TOSTRING(room_name);
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnRoomNameChanged(TOSTRING(room_id), TOSTRING(room_name));
  }
}

void TUIRoomCoreImpl::onAllUserMicrophoneDisableChanged(const char* room_id,
                                                        bool is_disable) {
  LINFO("onAllUserMicrophoneDisableChanged, room_id:%s, is_disable:%d", room_id, is_disable);
  room_info_.is_all_microphone_muted = is_disable;
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnAllUserMicrophoneDisableChanged(TOSTRING(room_id),
                                                           is_disable);
  }
}

void TUIRoomCoreImpl::onAllUserCameraDisableChanged(const char* room_id,
                                                    bool is_disable) {
  LINFO("onAllUserCameraDisableChanged, room_id:%s, is_disable:%d", room_id, is_disable);
  room_info_.is_all_camera_muted = is_disable;
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnAllUserCameraDisableChanged(TOSTRING(room_id),
                                                       is_disable);
  }
}

void TUIRoomCoreImpl::onSendMessageForAllUserDisableChanged(const char* room_id, bool is_disable) {
  LINFO("onSendMessageForAllUserDisableChanged, room_id:%s, is_disable:%d", room_id, is_disable);
  room_info_.is_chat_room_muted = is_disable;
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnSendMessageForAllUserDisableChanged(
        TOSTRING(room_id), is_disable);
  }
}

void TUIRoomCoreImpl::onRoomSpeechModeChanged(const char* room_id, tuikit::TUISpeechMode speech_mode) {
  LINFO("onRoomSpeechModeChanged, room_id:%s, speech_mode:%d", room_id, static_cast<int>(speech_mode));
  room_info_.mode = speech_mode;
}

void TUIRoomCoreImpl::onRoomDismissed(const char* room_id) {
  LINFO("onRoomDismissed [room_id:%s]", room_id);
    //if (room_engine_) {
    //    TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
    //    callback->SetCallback([=]() {
    //            delete callback;
    //        },
    //        [=](const tuikit::TUIError code, const std::string& message) {
    //            delete callback;
    //        });
    //    room_engine_->exitRoom(true, callback);
    //}

    // TODO：RoomEngine 的 ExitRoom 会返回失败，这里强制界面退出
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnExitRoom(TUIExitRoomType::kRoomDestoryed, "room dismissed.");
    }
}

void TUIRoomCoreImpl::onRemoteUserEnterRoom(const char* room_id, const tuikit::TUIUserInfo& user_info) {
  std::stringstream log_stream;
  log_stream << "onRemoteUserEnterRoom, [room_id:" << TOSTRING(room_id)
             << "] [UserInfo, user_id:" << TOSTRING(user_info.userId)
             << "] [user_name:" << TOSTRING(user_info.userName)
             << "] [user_url:" << TOSTRING(user_info.avatarUrl)
             << "] [user_role:" << static_cast<int>(user_info.userRole)
             << "] [has_audio_stream:" << user_info.hasAudioStream
             << "] [has_video_stream:" << user_info.hasVideoStream
             << "] [has_screen_stream:" << user_info.hasScreenStream << "]";
  LINFO(log_stream.str().c_str());
  
  std::string user_id = TOSTRING(user_info.userId);
  if (room_user_map_.find(user_id) == room_user_map_.end()) {
    TUIUserInfo tui_user_info;
    tui_user_info.user_id = user_id;
    tui_user_info.user_name = TOSTRING(user_info.userName);
    tui_user_info.avatar_url = TOSTRING(user_info.avatarUrl);
    tui_user_info.role = user_info.userRole;
    tui_user_info.has_video_stream = false;
    tui_user_info.has_subscribed_video_stream = false;
    tui_user_info.has_audio_stream = false;
    tui_user_info.has_subscribed_audio_stream = false;
    tui_user_info.has_screen_stream = false;
    tui_user_info.has_subscribed_screen_stream = false;

    room_user_map_[user_id] = tui_user_info;
  }
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnRemoteUserEnter(TOSTRING(user_info.userId));
  }
}
void TUIRoomCoreImpl::onRemoteUserLeaveRoom(
    const char* room_id, const tuikit::TUIUserInfo& user_info) {
  std::stringstream log_stream;
  log_stream << "onRemoteUserLeaveRoom, [room_id:" << TOSTRING(room_id)
             << "] [UserInfo, user_id:" << TOSTRING(user_info.userId)
             << "] [user_name:" << TOSTRING(user_info.userName)
             << "] [user_url:" << TOSTRING(user_info.avatarUrl)
             << "] [user_role:" << static_cast<int>(user_info.userRole)
             << "] [has_audio_stream:" << user_info.hasAudioStream
             << "] [has_video_stream:" << user_info.hasVideoStream
             << "] [has_screen_stream:" << user_info.hasScreenStream << "]";
  LINFO(log_stream.str().c_str());
  std::string user_id = TOSTRING(user_info.userId);
  auto iter = room_user_map_.find(user_id);
  if (iter != room_user_map_.end()) {
    room_user_map_.erase(iter);
  }
  if (room_core_callback_ != nullptr) {
    room_core_callback_->OnRemoteUserLeave(TOSTRING(user_info.userId));
  }
}
void TUIRoomCoreImpl::onUserRoleChanged(const char* user_id, tuikit::TUIRole role) {
  LINFO("onUserRoleChanged, user_id:%s, role:%d", user_id, static_cast<int>(role));
  auto str_user_id = TOSTRING(user_id);
  auto iter = room_user_map_.find(str_user_id);
  if (iter != room_user_map_.end()) {
    iter->second.role = role;
  }
  if (local_user_info_.user_id == str_user_id) {
    iter->second.role = role;
  }

  // 房主更改数据同步
  if (role == tuikit::TUIRole::kRoomOwner) {
    auto old_owner = room_info_.owner_id;
    room_info_.owner_id = str_user_id;

    auto iter = room_user_map_.find(old_owner);
    if (iter != room_user_map_.end()) {
      iter->second.role = tuikit::TUIRole::kGeneralUser;
    }

    if (room_core_callback_ != nullptr) {
      room_core_callback_->OnRoomMasterChanged(str_user_id);
    }
  }
}

void TUIRoomCoreImpl::onUserVideoStateChanged(
    const char* user_id,
    tuikit::TUIVideoStreamType stream_type, bool has_video,
    tuikit::TUIChangeReason reason) {
  std::stringstream log_stream;
  log_stream << "onUserVideoStateChanged, [user_id:" << TOSTRING(user_id)
             << "] [stream_type:" << static_cast<int>(stream_type)
             << "] [has_video:" << has_video << "] [reason:"
             << static_cast<int>(reason) << "]";
  LINFO(log_stream.str().c_str());
  std::string str_user_id = TOSTRING(user_id);
  if (str_user_id == local_user_info_.user_id || str_user_id.empty()) {
    LocalUserVideoStateChanged(stream_type, has_video, reason);
  } else {
    RemoteUserVideoStateChanged(str_user_id, stream_type, has_video);
  }
}

void TUIRoomCoreImpl::onUserAudioStateChanged(
    const char* user_id, bool has_audio,
    tuikit::TUIChangeReason reason) {
  std::stringstream log_stream;
  log_stream << "onUserAudioStateChanged, [user_id:" << TOSTRING(user_id)
             << "] [has_audio:" << has_audio
             << "] [reason:" << static_cast<int>(reason) << "]";
  LINFO(log_stream.str().c_str());
  std::string str_user_id = TOSTRING(user_id);
  if (str_user_id == local_user_info_.user_id || str_user_id.empty()) {
    LocalUserAudioStateChanged(has_audio, reason);
  } else {
    RemoteUserAduioStateChanged(user_id, has_audio);
  }
}
void TUIRoomCoreImpl::onUserVoiceVolumeChanged(tuikit::TUIMap<const char*, int>* volumeMap) {
    const tuikit::TUIList<const char*>* keys = (*volumeMap).allKeys();
    for (int i = 0; i < keys->getSize(); i++) {
        const char* user_id = *(keys->getElement(i));
        int volume = *((*volumeMap).getValue(user_id));
        if (user_id == nullptr) {
            user_id = local_user_info_.user_id.c_str();
        }
        if (room_core_callback_ != nullptr) {
            room_core_callback_->OnUserVoiceVolume(user_id, volume);
        }
    }
}

void TUIRoomCoreImpl::onSendMessageForUserDisableChanged(const char* room_id, const char* user_id, bool is_disable) {
  LINFO("onSendMessageForUserDisableChanged,room_id:%s, user_id :%s, is_disable :%d",
      room_id, user_id, is_disable);
}

void TUIRoomCoreImpl::onRoomMaxSeatCountChanged(const char* room_id, int max_seat_count){
  LINFO("onRoomMaxSeatCountChanged,room_id:%s, max_seat_count :%d", room_id,
        max_seat_count);
}

void TUIRoomCoreImpl::onUserScreenCaptureStopped(int reason) {
  LINFO("onUserScreenCaptureStopped, reason:%d", reason);
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnScreenCaptureStopped(reason);
    }
}
void TUIRoomCoreImpl::onUserNetworkQualityChanged(tuikit::TUIList<tuikit::TUINetwork>* network_list) {
    uint32_t i = network_list->getSize();
    std::vector<tuikit::TUINetwork> network_item_list;
    for (int i = 0; i < network_list->getSize(); i++) {
        const tuikit::TUINetwork* item = network_list->getElement(i);
        network_item_list.push_back(*item);
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnNetworkQuality(network_item_list);
        //room_core_callback_->OnStatistics(statistics);
    }
}

void TUIRoomCoreImpl::onSeatListChanged(
    tuikit::TUIList<tuikit::TUISeatInfo>* seat_List,
    tuikit::TUIList<tuikit::TUISeatInfo>* users_seated,
    tuikit::TUIList<tuikit::TUISeatInfo>* users_left) {
  LINFO("onSeatListChanged");
}

void TUIRoomCoreImpl::onKickedOffSeat(const char* userId) {
  LINFO("onKickedOffSeat, userId:%d", userId);
}

void TUIRoomCoreImpl::onRequestReceived(const tuikit::TUIRequest* request) {
  /*
  * request.user_id: xxx(信令发送者)
  * request.content:
  {
      "businessID" : "",
      "data" : {
          "cmd" : "enableUserCamera",
          "enable" : true,
          "receiverId" : "jovenxue（信令接收者）",
          "roomId" : "123321"
      },
      "extraInfo" : "",
      "platform" : "windows",
      "version" : 1
  }
  */
  if (request == nullptr) {
    LINFO("onRequestReceived request is nullptr");
    return;
  }
  std::stringstream log_stream;
  log_stream << "onRequestReceived, [request_id:" << request->requestId
             << "] [request_action:" << static_cast<int>(request->requestAction)
             << "] [timestamp:" << request->timestamp
             << "] [user_id:" << TOSTRING(request->userId)
             << "] [content:" << TOSTRING(request->content) << "]";
  LINFO(log_stream.str().c_str());

  auto request_id = TOSTRING(request->requestId);

  if (room_core_callback_ != nullptr) {
    if (request->requestAction ==
        tuikit::TUIRequestAction::kRequestToOpenRemoteCamera) {
      received_request_ids_.push_back(request_id);
      room_core_callback_->OnRequestOpenCameraByAdmin(request_id);
    } else if (request->requestAction ==
               tuikit::TUIRequestAction::kRequestToOpenRemoteMicrophone) {
      received_request_ids_.push_back(request_id);
      room_core_callback_->OnRequestOpenMicrophoneByAdmin(request_id);
    }
  }
}
void TUIRoomCoreImpl::onRequestCancelled(const char* request_id,
                                         const char* user_id) {
  LINFO("onRequestCancelled, request_id:%s", request_id);
  auto iter = std::find(received_request_ids_.begin(),
                        received_request_ids_.end(), TOSTRING(request_id));
    if (iter != received_request_ids_.end()) {
        received_request_ids_.erase(iter);
    }
}
void TUIRoomCoreImpl::onReceiveTextMessage(const char* room_id, const tuikit::TUIMessage& message) {
    if (TOSTRING(room_id) != room_info_.room_id) {
        LINFO("room engine onReceiveTextMessage, room_id %s ,messgae : %s", room_id, message.message);
        return;
    }
    LINFO("room engine onReceiveTextMessage, user_id %s ,messgae : %s", message.userId, message.message);
    auto iter = room_user_map_.find(TOSTRING(message.userId));
    if (iter == room_user_map_.end()) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveChatMessage(TOSTRING(message.userId), message.message);
    }
}
void TUIRoomCoreImpl::onReceiveCustomMessage(const char* room_id, const tuikit::TUIMessage& message) {
    if (TOSTRING(room_id) != room_info_.room_id) {
        LINFO("room engine OnReceiveCustomMessage, room_id %s ,messgae : %s", room_id, message.message);
        return;
    }
    LINFO("room engine onReceiveCustomMessage, user_id %s ,messgae : %s", message.userId, message);
    auto iter = room_user_map_.find(TOSTRING(message.userId));
    if (iter == room_user_map_.end()) {
        return;
    }
    if (room_core_callback_ != nullptr) {
        room_core_callback_->OnReceiveCustomMessage(TOSTRING(message.userId), message.message);
    }
}

void TUIRoomCoreImpl::onDeviceChanged(const char* deviceId,
                                      liteav::TXMediaDeviceType type,
                                      liteav::TXMediaDeviceState state) {}

void TUIRoomCoreImpl::onRoomSeatModeChanged(const char* room_id, tuikit::TUISeatMode seat_mode){}

void TUIRoomCoreImpl::LocalUserVideoStateChanged(tuikit::TUIVideoStreamType stream_type, bool has_video, tuikit::TUIChangeReason reason) {
  if (stream_type == tuikit::TUIVideoStreamType::kCameraStream || stream_type == tuikit::TUIVideoStreamType::kCameraStreamLow) {
    local_user_info_.has_video_stream = has_video;
    local_user_info_.has_subscribed_video_stream = has_video;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    if (room_core_callback_) {
      room_core_callback_->OnCameraStateChanged(has_video, reason);
      if (has_video) {
        room_core_callback_->OnFirstVideoFrame(local_user_info_.user_id, TUIStreamType::kStreamTypeCamera);
      }
    }
  } else if (stream_type == tuikit::TUIVideoStreamType::kScreenStream) {
    local_user_info_.has_screen_stream = has_video;
    local_user_info_.has_subscribed_screen_stream = has_video;
    room_user_map_[local_user_info_.user_id] = local_user_info_;
    if (room_core_callback_ && has_video) {
      room_core_callback_->OnScreenCaptureStarted();
      if (has_video) {
        room_core_callback_->OnFirstVideoFrame(local_user_info_.user_id, TUIStreamType::kStreamTypeScreen);
      }
    }
  }
}

void TUIRoomCoreImpl::LocalUserAudioStateChanged(bool has_audio, tuikit::TUIChangeReason reason) {
  local_user_info_.has_audio_stream = has_audio;
  local_user_info_.has_subscribed_audio_stream = has_audio;
  room_user_map_[local_user_info_.user_id] = local_user_info_;
  if (room_core_callback_) {
    room_core_callback_->OnMicrophoneStateChanged(has_audio, reason);
  }
}

void TUIRoomCoreImpl::RemoteUserVideoStateChanged(const std::string& user_id, tuikit::TUIVideoStreamType stream_type, bool has_video) {
  auto iter = room_user_map_.find(user_id);
  if (iter == room_user_map_.end()) {
    TUIUserInfo info;
    info.user_id = user_id;
    room_user_map_[user_id] = info;
    iter = room_user_map_.find(user_id);
  }

  liteav::TRTCRenderParams param;
  param.rotation = TRTCVideoRotation0;
  param.fillMode = TRTCVideoFillMode_Fill;
  param.mirrorType = TRTCVideoMirrorType_Disable;

  if (stream_type == tuikit::TUIVideoStreamType::kCameraStream ||
      stream_type == tuikit::TUIVideoStreamType::kCameraStreamLow) {
    if (trtc_cloud_) {
      liteav::TRTCVideoStreamType trtc_stream_type =
          stream_type == tuikit::TUIVideoStreamType::kCameraStream
              ? TRTCVideoStreamTypeBig
              : TRTCVideoStreamTypeSmall;
      trtc_cloud_->setRemoteRenderParams(user_id.c_str(), trtc_stream_type,
                                         param);
    }

    iter->second.has_video_stream = has_video;
    if (room_core_callback_) {
      room_core_callback_->OnRemoteUserCameraAvailable(user_id, has_video);
    }
  } else if (stream_type == tuikit::TUIVideoStreamType::kScreenStream) {
    if (trtc_cloud_) {
      trtc_cloud_->setRemoteRenderParams(user_id.c_str(), TRTCVideoStreamTypeSub, param);
    }
    iter->second.has_screen_stream = has_video;
    if (room_core_callback_) {
      room_core_callback_->OnRemoteUserScreenAvailable(user_id, has_video);
    }
  }
}

void TUIRoomCoreImpl::RemoteUserAduioStateChanged(const std::string& user_id, bool has_audio){
  auto iter = room_user_map_.find(user_id);
  if (iter == room_user_map_.end()) {
    TUIUserInfo info;
    info.user_id = user_id;
    room_user_map_[user_id] = info;
    iter = room_user_map_.find(user_id);
  }

  iter->second.has_audio_stream = has_audio;
  iter->second.has_subscribed_audio_stream = has_audio;
  if (room_core_callback_) {
    room_core_callback_->OnRemoteUserAudioAvailable(user_id, has_audio);
  }
}