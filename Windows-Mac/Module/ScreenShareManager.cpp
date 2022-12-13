// Copyright (c) 2021 Tencent. All rights reserved.
#include "ScreenShareManager.h"

ScreenShareManager::ScreenShareManager(tuikit::TUIRoomEngine* room_engine, TUIRoomCoreCallback* callback) {
    room_engine_ = room_engine;
    room_core_callback_ = callback;
    trtc_cloud_ = static_cast<liteav::ITRTCCloud*>(room_engine->getTRTCCloud());
}

ScreenShareManager::~ScreenShareManager() {
}

void ScreenShareManager::StartScreenCapture(void* target_id, void* view) {

    if (room_engine_ != nullptr) {
        TUIRoomEngineCallback* callback = new TUIRoomEngineCallback;
        callback->SetCallback([=]() {
            if (room_core_callback_ != nullptr) {
                room_core_callback_->OnScreenCaptureStarted();
            }
            delete callback;
            }, [=](const tuikit::TUIError code, const std::string& message) {
                if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnScreenCaptureStopped(1);
                }
                delete callback;
            });
        room_engine_->startScreenSharing(target_id, callback);
    }
}
void ScreenShareManager::StopScreenCapture() {

    if (room_engine_ != nullptr) {
        room_engine_->stopScreenSharing();
    }
}
void ScreenShareManager::PauseScreenCapture() {
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->pauseScreenCapture();
    }
}
void ScreenShareManager::ResumeScreenCapture() {
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->resumeScreenCapture();
    }
}
std::vector<IScreenShareManager::ScreenCaptureSourceInfo>& ScreenShareManager::GetScreenCaptureSources\
                                                            (const SIZE& thumb_size, const SIZE& icon_size) {

    if (room_engine_ != nullptr) {
        screen_window_info_list_.clear();
        TUIRoomEngineGetShareTargetListCallback* callback = new TUIRoomEngineGetShareTargetListCallback;
        callback->SetCallback([=](tuikit::TUIList<tuikit::TUIShareTarget>* target) {
            int count = target->getSize();
            for (int i = 0; i < count; i++) {
                const tuikit::TUIShareTarget* item = target->getElement(i);
                IScreenShareManager::ScreenCaptureSourceInfo window_info;
                window_info.source_id = item->id;
                window_info.source_name = item->sourceName;
                switch (item->sourceType) {
                case tuikit::TUICaptureSourceType::kScreen:
                    window_info.type = IScreenShareManager::kScreen;
                    break;
                case tuikit::TUICaptureSourceType::kWindow:
                    window_info.type = IScreenShareManager::kWindow;
                    break;
                default:
                    window_info.type = IScreenShareManager::kUnknown;
                    break;
                }
                window_info.thumb_bgra.buffer = item->thumbnailImage.buffer;
                window_info.thumb_bgra.length = item->thumbnailImage.length;
                window_info.thumb_bgra.width = item->thumbnailImage.width;
                window_info.thumb_bgra.height = item->thumbnailImage.height;

                window_info.icon_bgra.buffer = item->iconImage.buffer;
                window_info.icon_bgra.length = item->iconImage.length;
                window_info.icon_bgra.width = item->iconImage.width;
                window_info.icon_bgra.height = item->iconImage.height;

                window_info.is_minimized = item->isMinimized;
                screen_window_info_list_.push_back(window_info);
            }
            }, [=](const tuikit::TUIError code, const std::string& message) {
                if (room_core_callback_ != nullptr) {
                    room_core_callback_->OnError(-1, "tuikit engine room error: get share target failed.");
                }
            });
        room_engine_->getScreenSharingTargetList(callback);
    }

    return screen_window_info_list_;
}
void ScreenShareManager::ReleaseScreenCaptureSources() {
    if (source_window_list_ != nullptr) {
        source_window_list_->release();
        source_window_list_ = nullptr;
    }
}
void ScreenShareManager::SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property) {

    if (room_engine_ != nullptr) {
        room_engine_->selectScreenSharingTarget(source.source_id);
    }
}
void ScreenShareManager::SetSubStreamMixVolume(uint32_t volume) {
    if (trtc_cloud_ != nullptr)
        trtc_cloud_->setSubStreamMixVolume(volume);
}
void ScreenShareManager::AddExcludedShareWindow(void* window) {
    if (window != NULL && trtc_cloud_ != nullptr)
        trtc_cloud_->addExcludedShareWindow((liteav::TXView)window);
}
void ScreenShareManager::RemoveExcludedShareWindow(void* window) {
    if (window != NULL && trtc_cloud_ != nullptr)
        trtc_cloud_->removeExcludedShareWindow((liteav::TXView)window);
}
void ScreenShareManager::RemoveAllExcludedShareWindow() {
    if (trtc_cloud_ != nullptr)
        trtc_cloud_->removeAllExcludedShareWindow();
}
void ScreenShareManager::AddIncludedShareWindow(void* window) {
    if (window != NULL && trtc_cloud_ != nullptr)
        trtc_cloud_->addIncludedShareWindow((liteav::TXView)window);
}
void ScreenShareManager::RemoveIncludedShareWindow(void* window) {
    if (window != NULL && trtc_cloud_ != nullptr)
        trtc_cloud_->removeIncludedShareWindow((liteav::TXView)window);
}
void ScreenShareManager::RemoveAllIncludedShareWindow() {
    if (trtc_cloud_ != nullptr)
        trtc_cloud_->removeAllIncludedShareWindow();
}
