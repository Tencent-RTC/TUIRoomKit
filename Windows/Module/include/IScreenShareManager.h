// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_ISCREENSHAREMANAGER_H_
#define MODULE_INCLUDE_ISCREENSHAREMANAGER_H_

#ifdef _WIN32
#include <windows.h>
#else
#include "TRTCTypeDef.h"
#endif
#include <string>
#include <vector>

class IScreenShareManager {
 public:
    enum ScreenCaptureSourceType {
        kUnknown = -1,
        kWindow,        // 该分享目标是某一个窗口
        kScreen = 1,    // 该分享目标是整个桌面
    };
    struct ImageBuffer {
        const char* buffer;    // 图内容
        uint32_t    length;    // 图缓存大小
        uint32_t    width;     // 图宽
        uint32_t    height;    // 图高

        ImageBuffer()
            : buffer(nullptr)
            , length(0)
            , width(0)
            , height(0) {
        }
    };

    struct ScreenCaptureSourceInfo {
        ScreenCaptureSourceType type;
        void*                   source_id;
        std::string             source_name;
        ImageBuffer             thumb_bgra;  //  缩略图内容
        ImageBuffer             icon_bgra;   //  图标内容
        bool                    is_minimized; //  是否最小化

        ScreenCaptureSourceInfo()
            : type(kUnknown)
            , source_id(nullptr) 
            , is_minimized(false) {
        }
    };

 public:
    virtual ~IScreenShareManager() {}

    /**
     * @desc 启动屏幕分享
     *
     * @param view 承载预览画面的控件，可以设置为nullptr，表示不显示屏幕分享的预览效果
     */
    virtual void StartScreenCapture(void* view) = 0;

    /**
     * @desc 停止屏幕分享
     */
    virtual void StopScreenCapture() = 0;

    /**
     * @desc 暂停屏幕分享
     */
    virtual void PauseScreenCapture() = 0;

    /**
     * @desc 恢复屏幕分享
     */
    virtual void ResumeScreenCapture() = 0;

    /**
     * @desc 枚举可分享的屏幕窗口，建议在StartScreenCapture()之前调用
     *
     * @param thumb_size 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
     * @param icon_size  指定要获取的窗口图标大小
     * @return 窗口列表，包括屏幕
     */
    virtual std::vector<ScreenCaptureSourceInfo>& GetScreenCaptureSources(const SIZE& thumb_size,
        const SIZE& icon_size) = 0;

    /**
     * @desc 释放窗口列表资源
     */
    virtual void ReleaseScreenCaptureSources() = 0;

    /**
     * @desc 设置屏幕分享参数，该方法在屏幕分享过程中也可以调用
     *
     * @param source                 指定分享源
     * @param capture_rect            指定捕获的区域
     */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect) = 0;

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
    virtual void AddExcludedShareWindow(void* window) = 0;

    /**
     * @desc 将指定窗口从屏幕分享的排除列表中移除
     *
     * @param window 不希望分享出去的窗口
     */
    virtual void RemoveExcludedShareWindow(void* window) = 0;

    /**
     * @desc 将所有窗口从屏幕分享的排除列表中移除
     */
    virtual void RemoveAllExcludedShareWindow() = 0;

    /**
     * @desc 将指定窗口加入屏幕分享的包含列表中，加入包含列表中的窗口如果在采集窗口区域内会被分享出去
     *
     * @param window 希望被分享出去的窗口
     */
    virtual void AddIncludedShareWindow(void* window) = 0;

    /**
     * @desc 将指定窗口从屏幕分享的包含列表中移除
     *
     * @param window 希望被分享出去的窗口
     */
    virtual void RemoveIncludedShareWindow(void* window) = 0;

    /**
     * @desc 将所有窗口从屏幕分享的包含列表中移除
     */
    virtual void RemoveAllIncludedShareWindow() = 0;
};

#endif  //  MODULE_INCLUDE_ISCREENSHAREMANAGER_H_
