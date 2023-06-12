// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_SCREENSHAREMANAGER_H_
#define MODULE_SCREENSHAREMANAGER_H_

#include "include/IScreenShareManager.h"
#include "ITUIRoomEngine.h"
#include "ITRTCCloud.h"

#include "TUIRoomCoreCallback.h"
#include "TUIRoomDef.h"

class ScreenShareManager :
    public IScreenShareManager {
 public:
     ScreenShareManager(tuikit::TUIRoomEngine* room_engine, TUIRoomCoreCallback* callback);
    virtual ~ScreenShareManager();

    /**
     * @desc 启动屏幕分享
     *
     * @param rendView 承载预览画面的控件，可以设置为nullptr，表示不显示屏幕分享的预览效果
     */

    /**
     * @desc Start screen sharing
     *
     * @param rendView The control sustaining the preview image, which can be set to nullptr, indicating not to display the preview of the shared screen
     */
    virtual void StartScreenCapture(void* target_id, void* view);

    /**
     * @desc 停止屏幕分享
     */

    /**
     * @desc Stop screen sharing
     */
    virtual void StopScreenCapture();

    /**
     * @desc 暂停屏幕分享
     */

    /**
     * @desc Pause screen sharing
     */
    virtual void PauseScreenCapture();

    /**
     * @desc 恢复屏幕分享
     */

    /**
     * @desc Resume screen sharing
     */
    virtual void ResumeScreenCapture();

    /**
     * @desc 枚举可分享的屏幕窗口，建议在StartScreenCapture()之前调用
     *
     * @param thumbSize 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
     * @param iconSize  指定要获取的窗口图标大小
     * @return 窗口列表，包括屏幕
     */

    /**
     * @desc Enumerate shareable windows. We recommend you call this API before calling `StartScreenCapture()`
     *
     * @param thumbSize Specify the thumbnail size of the window to be obtained. The thumbnail can be drawn on the window selection UI
     * @param iconSize The icon size.
     * @return List of windows (including the screen)
     */
#ifdef _WIN32
    virtual std::vector<ScreenCaptureSourceInfo>& GetScreenCaptureSources(const SIZE& thumb_size,
        const SIZE& icon_size);
#else
    virtual std::vector<ScreenCaptureSourceInfo>& GetScreenCaptureSources(const liteav::SIZE& thumb_size,
        const liteav::SIZE& icon_size);
#endif
    /**
     * @desc 释放窗口列表资源
     */

    /**
     * @desc Release window list resources
     */
    virtual void ReleaseScreenCaptureSources();

    /**
     * @desc 设置屏幕分享参数，该方法在屏幕分享过程中也可以调用
     *
     * @param source                 指定分享源
     * @param captureRect            指定捕获的区域
     */

    /**
     * @desc Set screen sharing parameters. This method can be called during screen sharing.
     *
     * @param source                 The source to share
     * @param captureRect            The area to capture
     */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property);

    /**
     * @desc 设置屏幕分享的混音音量大小
     *
     * @param volume 设置的混音音量大小，范围0-100
     */

    /**
     * @desc Set audio mixing volume level of screen sharing
     *
     * @param volume Set audio mixing volume level. Value range: 0–100
     */
    virtual void SetSubStreamMixVolume(uint32_t volume);

    /**
     * @desc 将指定窗口加入屏幕分享的排除列表中，加入排除列表中的窗口不会被分享出去
     *
     * @param window 不希望分享出去的窗口
     */

    /**
     * @desc Add a specified window to the exclusion list of screen sharing. Windows in the list will not be shared
     *
     * @param window Window not to be shared
     */
    virtual void AddExcludedShareWindow(void* window);

    /**
     * @desc 将指定窗口从屏幕分享的排除列表中移除
     *
     * @param window 不希望分享出去的窗口
     */

    /**
     * @desc Remove a specified window from the exclusion list of screen sharing
     *
     * @param window Window not to be shared
     */
    virtual void RemoveExcludedShareWindow(void* window);

    /**
     * @desc 将所有窗口从屏幕分享的排除列表中移除
     */

    /**
     * @desc Remove all windows from the exclusion list of screen sharing
     */
    virtual void RemoveAllExcludedShareWindow();

    /**
     * @desc 将指定窗口加入屏幕分享的包含列表中，加入包含列表中的窗口如果在采集窗口区域内会被分享出去
     *
     * @param window 希望被分享出去的窗口
     */

    /**
     * @desc Add a specified window to the inclusion list of screen sharing. Windows in the list will be shared if within the captured window area
     *
     * @param window Window to be shared
     */
    virtual void AddIncludedShareWindow(void* window);

    /**
     * @desc 将指定窗口从屏幕分享的包含列表中移除
     *
     * @param window 希望被分享出去的窗口
     */

    /**
     * @desc Remove a specified window from the inclusion list of screen sharing
     *
     * @param window Window to be shared
     */
    virtual void RemoveIncludedShareWindow(void* window);

    /**
     * @desc 将所有窗口从屏幕分享的包含列表中移除
     */

    /**
     * @desc Remove all windows from the inclusion list of screen sharing
     */
    virtual void RemoveAllIncludedShareWindow();

 private:
    liteav::ITRTCCloud* trtc_cloud_ = nullptr;
    tuikit::TUIRoomEngine* room_engine_ = nullptr;
    TUIRoomCoreCallback*   room_core_callback_;
    liteav::ITRTCScreenCaptureSourceList* source_window_list_ = nullptr;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> screen_window_info_list_;
};
#endif  //  MODULE_SCREENSHAREMANAGER_H_
