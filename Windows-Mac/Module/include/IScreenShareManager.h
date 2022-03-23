// Copyright (c) 2021 Tencent. All rights reserved.
#ifndef MODULE_INCLUDE_ISCREENSHAREMANAGER_H_
#define MODULE_INCLUDE_ISCREENSHAREMANAGER_H_

#ifdef _WIN32
#include <windows.h>
#else
#include "TRTCTypeDef.h"
using namespace liteav;
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

    // 屏幕分享控制参数
    struct ScreenCaptureProperty {
        ///【字段含义】是否采集目标内容的同时采集鼠标，默认为 true。
        bool enableCaptureMouse;

        ///【字段含义】是否高亮正在共享的窗口（在被分享目标周围绘制一个边框），默认为 true。
        bool enableHighLight;

        ///【字段含义】是否开启高性能模式（只会在分享屏幕时会生效），默认为 true。
        ///【特殊说明】开启后屏幕采集性能最佳，但会丧失抗遮挡能力，如果您同时开启 enableHighLight + enableHighPerformance，远端用户可以看到高亮的边框。
        bool enableHighPerformance;

        ///【字段含义】指定高亮边框的颜色，RGB 格式，传入 0 时代表采用默认颜色，默认颜色为 #8CBF26。
        int highLightColor;

        ///【字段含义】指定高亮边框的宽度，传入0时采用默认描边宽度，默认宽度为 5px，您可以设置的最大值为 50。
        int highLightWidth;

        ///【字段含义】窗口采集时是否采集子窗口（需要子窗口与被采集窗口具有 Owner 或 Popup 属性），默认为 false。
        bool enableCaptureChildWindow;
        ScreenCaptureProperty() : enableCaptureMouse(true)
            , enableHighLight(true)
            , enableHighPerformance(true)
            , highLightColor(0)
            , highLightWidth(0)
            , enableCaptureChildWindow(false) {
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
     * @param capture_rect           指定捕获的区域
     * @param property               指定分享的属性
     */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property) = 0;

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
