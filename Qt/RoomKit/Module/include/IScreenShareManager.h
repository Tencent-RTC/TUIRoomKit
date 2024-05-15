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
#include <functional>

class IScreenShareManager {
 public:
    enum ScreenCaptureSourceType {
        kUnknown = -1,
        kWindow,        // 该分享目标是某一个窗口 (The screen sharing target is a window)
        kScreen = 1,    // 该分享目标是整个桌面 (The screen sharing target is the entire desktop)
    };
    struct ImageBuffer {
        const char* buffer;    // 图内容 (Image content)
        uint32_t    length;    // 图缓存大小 (Image cache size)
        uint32_t    width;     // 图宽 (Image width)
        uint32_t    height;    // 图高 (Image height)

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
        ImageBuffer             thumb_bgra;   // 缩略图内容 (Thumbnail content)
        ImageBuffer             icon_bgra;    // 图标内容 (Icon content)
        bool                    is_minimized; // 是否最小化 (Whether to minimize the image)

        ScreenCaptureSourceInfo()
            : type(kUnknown)
            , source_id(nullptr) 
            , is_minimized(false) {
        }
    };

    using GetScreenSharingSourceCallback = std::function<void(const std::vector<ScreenCaptureSourceInfo>& sources)>;

    // 屏幕分享控制参数
    // Screen sharing control parameters
    struct ScreenCaptureProperty {
        ///【字段含义】是否采集目标内容的同时采集鼠标，默认为 true。
        /// **Field description:** Whether to capture the cursor while capturing the target content. Default value: true.
        bool enableCaptureMouse;

        ///【字段含义】是否高亮正在共享的窗口（在被分享目标周围绘制一个边框），默认为 true。
        /// **Field description:** Whether to highlight the window being shared (i.e., drawing a frame around the shared target). Default value: true.
        bool enableHighLight;

        ///【字段含义】是否开启高性能模式（只会在分享屏幕时会生效），默认为 true。
        ///【特殊说明】开启后屏幕采集性能最佳，但会丧失抗遮挡能力，如果您同时开启 enableHighLight + enableHighPerformance，远端用户可以看到高亮的边框。
        /// **Field description:** Whether to enable the high performance mode (which will take effect only during screen sharing). Default value: true.
        /// **Note:** The screen capturing performance is the best after this mode is enabled, but the anti-occlusion capability will be lost. 
        /// If you enable `enableHighLight` and `enableHighPerformance` at the same time, remote users will see the highlighted frame.
        bool enableHighPerformance;

        ///【字段含义】指定高亮边框的颜色，RGB 格式，传入 0 时代表采用默认颜色，默认颜色为 #8CBF26。
        /// **Field description:** Specifies the color of the highlighted frame in RGB format. `0` indicates to use the default color of #8CBF26.
        int highLightColor;

        ///【字段含义】指定高亮边框的宽度，传入0时采用默认描边宽度，默认宽度为 5px，您可以设置的最大值为 50。
        /// **Field description:** Specifies the width of the highlighted frame. `0` indicates to
        ///  use the default width of 5 px. The maximum value you can set is `50`.
        int highLightWidth;

        ///【字段含义】窗口采集时是否采集子窗口（需要子窗口与被采集窗口具有 Owner 或 Popup 属性），默认为 false。
        /// **Field description:** Whether to capture the subwindow during window capturing (the subwindow and the captured window
        /// need to have an `Owner` or `Popup` attribute). Default value: false.
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

    /**
     * @desc Starts screen sharing
     *
     * @param view Control for preview image display. This can be set to `nullptr`, indicating not to display the preview of the shared screen.
     */
    virtual void StartScreenCapture(void* target_id, void* view) = 0;

    /**
     * @desc 停止屏幕分享
     */

    /**
     * @desc Stops screen sharing
     */
    virtual void StopScreenCapture() = 0;

    /**
     * @desc 暂停屏幕分享
     */

    /**
     * @desc Pauses screen sharing
     */
    virtual void PauseScreenCapture() = 0;

    /**
     * @desc 恢复屏幕分享
     */

    /**
     * @desc Resumes screen sharing
     */
    virtual void ResumeScreenCapture() = 0;

    /**
     * @desc 枚举可分享的屏幕窗口，建议在StartScreenCapture()之前调用
     *
     * @param thumb_size 指定要获取的窗口缩略图大小，缩略图可用于绘制在窗口选择界面上
     * @param icon_size  指定要获取的窗口图标大小
     * @return 窗口列表，包括屏幕
     */

    /**
     * @desc Enumerates shareable windows. We recommend you call this API before calling `StartScreenCapture()`.
     *
     * @param thumb_size Specifies the thumbnail size of the window to be obtained. The thumbnail can be drawn on the window selection UI.
     * @param icon_size  Specifies the icon size of the window to be obtained
     * @return List of windows (including the screen)
     */
    virtual void GetScreenCaptureSources(
        const SIZE& thumb_size, const SIZE& icon_size,
        GetScreenSharingSourceCallback callback) = 0;

    /**
     * @desc 释放窗口列表资源
     */

    /**
     * @desc Releases the window list resource
     */
    virtual void ReleaseScreenCaptureSources() = 0;

    /**
     * @desc 设置屏幕分享参数，该方法在屏幕分享过程中也可以调用
     *
     * @param source                 指定分享源
     * @param capture_rect           指定捕获的区域
     * @param property               指定分享的属性
     */

    /**
     * @desc Sets screen sharing parameters. This method can be called during screen sharing.
     *
     * @param source                 Specifies the sharing source
     * @param capture_rect           Specifies the area to be captured
     * @param property               Specifies the sharing attributes
     */
    virtual void SelectScreenCaptureTarget(const ScreenCaptureSourceInfo& source, const RECT& capture_rect, const ScreenCaptureProperty& property) = 0;

    /**
     * @desc 设置屏幕分享的混音音量大小
     *
     * @param volume 设置的混音音量大小，范围0-100
     */

    /**
     * @desc Sets the audio mixing volume level of screen sharing
     *
     * @param volume Sets the audio mixing volume level. Value range: 0–100
     */
    virtual void SetSubStreamMixVolume(uint32_t volume) = 0;

    /**
     * @desc 将指定窗口加入屏幕分享的排除列表中，加入排除列表中的窗口不会被分享出去
     *
     * @param window 不希望分享出去的窗口
     */

    /**
     * @desc Adds specified windows to the exclusion list of screen sharing. After being added, the windows will not be shared.
     *
     * @param window Window not to be shared
     */
    virtual void AddExcludedShareWindow(void* window) = 0;

    /**
     * @desc 将指定窗口从屏幕分享的排除列表中移除
     *
     * @param window 不希望分享出去的窗口
     */

    /**
     * @desc Removes the specified windows from the exclusion list of screen sharing
     *
     * @param window Window not to be shared
     */
    virtual void RemoveExcludedShareWindow(void* window) = 0;

    /**
     * @desc 将所有窗口从屏幕分享的排除列表中移除
     */

    /**
     * @desc Removes all windows from the exclusion list of screen sharing
     */
    virtual void RemoveAllExcludedShareWindow() = 0;

    /**
     * @desc 将指定窗口加入屏幕分享的包含列表中，加入包含列表中的窗口如果在采集窗口区域内会被分享出去
     *
     * @param window 希望被分享出去的窗口
     */

    /**
     * @desc Adds specified windows to the inclusion list of screen sharing. After being added,
     * the windows will be shared if they are in the window capture area.
     *
     * @param window Window to be shared
     */
    virtual void AddIncludedShareWindow(void* window) = 0;

    /**
     * @desc 将指定窗口从屏幕分享的包含列表中移除
     *
     * @param window 希望被分享出去的窗口
     */

    /**
     * @desc Removes the specified windows from the inclusion list of screen sharing
     *
     * @param window Window to be shared
     */
    virtual void RemoveIncludedShareWindow(void* window) = 0;

    /**
     * @desc 将所有窗口从屏幕分享的包含列表中移除
     */

    /**
     * @desc Removes all windows from the inclusion list of screen sharing
     */
    virtual void RemoveAllIncludedShareWindow() = 0;
};

#endif  //  MODULE_INCLUDE_ISCREENSHAREMANAGER_H_
