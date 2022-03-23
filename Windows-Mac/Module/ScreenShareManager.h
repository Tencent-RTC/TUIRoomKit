// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_SCREENSHAREMANAGER_H_
#define MODULE_SCREENSHAREMANAGER_H_

#include "include/IScreenShareManager.h"
#include "ITRTCCloud.h"

using namespace liteav;

class ScreenShareManager :
    public IScreenShareManager {
 public:
     explicit ScreenShareManager(liteav::ITRTCCloud* trtc_cloud);
    virtual ~ScreenShareManager();

    /**
    * @desc 启动屏幕分享
    *
    * @param rendView 承载预览画面的控件，可以设置为nullptr，表示不显示屏幕分享的预览效果
    */
    virtual void StartScreenCapture(void* view);

    /**
    * @desc 停止屏幕分享
    */
    virtual void StopScreenCapture();

    /**
    * @desc 暂停屏幕分享
    */
    virtual void PauseScreenCapture();

    /**
    * @desc 恢复屏幕分享
    */
    virtual void ResumeScreenCapture();

    /**
    * @desc 枚举可分享的屏幕窗口，建议在StartScreenCapture()之前调用
    *
    * @param thumbSize 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
    * @param iconSize  指定要获取的窗口图标大小
    * @return 窗口列表，包括屏幕
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
    virtual void ReleaseScreenCaptureSources();

    /**
    * @desc 设置屏幕分享参数，该方法在屏幕分享过程中也可以调用
    *
    * @param source                 指定分享源
    * @param captureRect            指定捕获的区域
    */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property);

    /**
    * @desc 设置屏幕分享的混音音量大小
    *
    * @param volume 设置的混音音量大小，范围0-100
    */
    //  virtual void SetSubStreamMixVolume(uint32_t volume);

    /**
    * @desc 将指定窗口加入屏幕分享的排除列表中，加入排除列表中的窗口不会被分享出去
    *
    * @param window 不希望分享出去的窗口
    */
    virtual void AddExcludedShareWindow(void* window);

    /**
    * @desc 将指定窗口从屏幕分享的排除列表中移除
    *
    * @param window 不希望分享出去的窗口
    */
    virtual void RemoveExcludedShareWindow(void* window);

    /**
    * @desc 将所有窗口从屏幕分享的排除列表中移除
    */
    virtual void RemoveAllExcludedShareWindow();

    /**
    * @desc 将指定窗口加入屏幕分享的包含列表中，加入包含列表中的窗口如果在采集窗口区域内会被分享出去
    *
    * @param window 希望被分享出去的窗口
    */
    virtual void AddIncludedShareWindow(void* window);

    /**
    * @desc 将指定窗口从屏幕分享的包含列表中移除
    *
    * @param window 希望被分享出去的窗口
    */
    virtual void RemoveIncludedShareWindow(void* window);

    /**
    * @desc 将所有窗口从屏幕分享的包含列表中移除
    */
    virtual void RemoveAllIncludedShareWindow();

 private:
    ITRTCCloud* trtc_cloud_;
    ITRTCScreenCaptureSourceList* source_window_list_ = nullptr;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> screen_window_info_list_;
};
#endif  //  MODULE_SCREENSHAREMANAGER_H_
