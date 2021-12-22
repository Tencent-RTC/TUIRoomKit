// Copyright (c) 2021 Tencent. All rights reserved.
#include "ScreenShareManager.h"

ScreenShareManager::ScreenShareManager(ITRTCCloud* trtc_cloud)
    :trtc_cloud_(trtc_cloud) {
}

ScreenShareManager::~ScreenShareManager() {
}

void ScreenShareManager::StartScreenCapture(void* view) {
    if (trtc_cloud_ != nullptr) {
        TRTCVideoEncParam encode_param;
        encode_param.videoFps = 15;
        encode_param.videoResolution = TRTCVideoResolution_1920_1080;
        trtc_cloud_->startScreenCapture((TXView)view, TRTCVideoStreamTypeSub, &encode_param);
    }
}
void ScreenShareManager::StopScreenCapture() {
    if (trtc_cloud_ != nullptr) {
        trtc_cloud_->stopScreenCapture();
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
    if (trtc_cloud_ != nullptr) {
        source_window_list_ = trtc_cloud_->getScreenCaptureSources(thumb_size, icon_size);

        screen_window_info_list_.clear();
        uint32_t count = source_window_list_->getCount();
        for (uint32_t i = 0; i < count; i++) {
            liteav::TRTCScreenCaptureSourceInfo info = source_window_list_->getSourceInfo(i);
            IScreenShareManager::ScreenCaptureSourceInfo window_info;
            window_info.source_id = info.sourceId;
            window_info.source_name = info.sourceName;
            switch (info.type) {
            case liteav::TRTCScreenCaptureSourceTypeUnknown:
                window_info.type = IScreenShareManager::kUnknown;
                break;
            case liteav::TRTCScreenCaptureSourceTypeWindow:
                window_info.type = IScreenShareManager::kWindow;
                break;
            case liteav::TRTCScreenCaptureSourceTypeScreen:
                window_info.type = IScreenShareManager::kScreen;
                break;
            default:
                break;
            }
            window_info.thumb_bgra.buffer = info.thumbBGRA.buffer;
            window_info.thumb_bgra.length = info.thumbBGRA.length;
            window_info.thumb_bgra.width  = info.thumbBGRA.width;
            window_info.thumb_bgra.height = info.thumbBGRA.height;

            window_info.icon_bgra.buffer = info.iconBGRA.buffer;
            window_info.icon_bgra.length = info.iconBGRA.length;
            window_info.icon_bgra.width  = info.iconBGRA.width;
            window_info.icon_bgra.height = info.iconBGRA.height;
            window_info.is_minimized     = info.isMinimizeWindow;
            screen_window_info_list_.push_back(window_info);
        }
    }

    return screen_window_info_list_;
}
void ScreenShareManager::ReleaseScreenCaptureSources() {
    if (source_window_list_ != nullptr) {
        source_window_list_->release();
        source_window_list_ = nullptr;
    }
}
void ScreenShareManager::SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect) {
    liteav::TRTCScreenCaptureSourceInfo src;
    src.iconBGRA.buffer = source.icon_bgra.buffer;
    src.iconBGRA.length = source.icon_bgra.length;
    src.iconBGRA.width    = source.icon_bgra.width;
    src.iconBGRA.height = source.icon_bgra.height;

    src.thumbBGRA.buffer = source.thumb_bgra.buffer;
    src.thumbBGRA.length = source.thumb_bgra.length;
    src.thumbBGRA.width     = source.thumb_bgra.width;
    src.thumbBGRA.height = source.thumb_bgra.height;

    src.sourceId = (liteav::TXView)source.source_id;
    switch (source.type) {
    case IScreenShareManager::kUnknown:
        src.type = liteav::TRTCScreenCaptureSourceTypeUnknown;
        break;
    case IScreenShareManager::kWindow:
        src.type = liteav::TRTCScreenCaptureSourceTypeWindow;
        break;
    case IScreenShareManager::kScreen:
        src.type = liteav::TRTCScreenCaptureSourceTypeScreen;
        break;
    default:
        break;
    }

    RECT rect;
    rect.bottom = capture_rect.bottom;
    rect.left = capture_rect.left;
    rect.right = capture_rect.right;
    rect.top = capture_rect.top;

    liteav::TRTCScreenCaptureProperty property;
    property.enableCaptureChildWindow = true;
    property.enableCaptureMouse = true;
    property.enableHighLight = true;
    property.enableHighPerformance = true;
    property.highLightColor = 0;
    property.highLightWidth = 0;

    trtc_cloud_->selectScreenCaptureTarget(src, rect, property);
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
