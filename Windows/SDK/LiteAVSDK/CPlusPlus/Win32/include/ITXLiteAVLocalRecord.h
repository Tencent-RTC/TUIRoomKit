#ifndef _ILITEAV_LOCAL_RECORD_H_
#define _ILITEAV_LOCAL_RECORD_H_

/*
 * Module:   ILiteAVLocalRecord @ TXLiteAVSDK
 *
 * Function: 腾讯云本地录制功能的主要接口类.
 *
 * Note: 本地录制模块是启动一个单独进程来实现录制功能，依赖以下模块：
 *         - 录制进程 TXCloudRecord.exe.
 *         - 提供录制功能的 SDK（liteav.dll、TRAE.dll、LiteAvAudioHook.dll、LiteAvAudioHookService.dll）.
 *       以上模块必须放在同一个目录下.
 *
 * 创建/使用/销毁 ITXLiteAVLocalRecord 对象的示例代码：
 * <pre>
 *     ITXLiteAVLocalRecord *pObject = getLocalRecordShareInstance();
 *     if(pObject)
 *     {
 *         pObject->startLocalRecord(...);
 *     }
 *     //--------------------------------------------------
 *     destroyLocalRecordShareInstance();
 *     pObject = NULL;
 * </pre>
 */

#include "TXLiteAVBase.h"

/// @defgroup ITXLiteAVLocalRecord_cplusplus ITXLiteAVLocalRecord
/// 腾讯云本地录制功能的主要接口类
/// @{
class ITXLiteAVLocalRecord;

extern "C" {
    /// @name 创建与销毁 ITXLiteAVLocalRecord 单例
    /// @{
    /**
    * 用于动态加载 dll 时，导出 ITXLiteAVLocalRecord C++ 单例对象指针。
    *
    * @return ITXLiteAVLocalRecord 对象指针，注意：delete ITXLiteAVLocalRecord 会编译错误，需要调用 destroyTXLiteLocalRecord 释放。
    */
    LITEAV_API ITXLiteAVLocalRecord* getLocalRecordShareInstance();

    /**
    * 析构 ITXLiteAVLocalRecord 单例对象
    */
    LITEAV_API void destroyLocalRecordShareInstance();
    /// @}
}


/**
 * 本地录制错误码
 */
enum TXLiteAVLocalRecordError
{
    ERR_RECORD_SUCCESS              = 0,    ///< 启动录制成功回调。
    ERR_RECORD_PARAM_INVALID        = -1,   ///< 启动录制失败，非法参数。
    ERR_START_RECORD_EXE_FAULURE    = -2,   ///< 启动录制失败，录制进程拉起失败。
    ERR_CREATE_RECORD_FILE_FAILURE  = -3,   ///< 启动录制失败，录制文件创建失败。
    ERR_RECORD_CANCEL_BY_EXCEPTION  = -4,   ///< 录制过程中被动关闭，录制进程异常。
};


/**
 * 本地录制事件回调接口
 */
class TXLiteAVLocalRecordCallback
{
public:

    /**
     * 本地录制错误
     *
     * @param err 录制错误，参考 TXLiteAVLocalRecordError 定义。
     * @param msg  错误信息。
     */
    virtual void OnRecordError (TXLiteAVLocalRecordError err, const char* msg) = 0;

    /**
     * 本地录制结果回调
     *
     * @param path       成功录制文件全路径。
     */
    virtual void OnRecordComplete (const char* path) = 0;

    /**
     * 录制进度回调
     *
     * @param duration  当前录制文件的时长，单位( MS )。
     * @param fileSize  当前录制文件的大小，单位( Byte )。
     * @param width     当前录制文件的宽，单位( px )。
     * @param height    当前录制文件的高，单位( px )。
     */
    virtual void OnRecordProgress(int duration,int fileSize, int width, int height) = 0;
};

class ITXLiteAVLocalRecord
{
protected:

    virtual ~ITXLiteAVLocalRecord() {};

public:
    /**
     * 注册本地录制事件回调接口
     *
     * @param callback 回调指针。
     */
    virtual void setCallback(TXLiteAVLocalRecordCallback * callback) = 0;

    /**
     * 启动本地录制
     *
     * 视频源支持如下四种录制内容情况：
     *  - 录制整个屏幕：source 中 type 为 Screen 的 source，captureRect 设为 { 0, 0, 0, 0 }
     *  - 录制指定区域：source 中 type 为 Screen 的 source，captureRect 设为非 NULL，例如 { 100, 100, 300, 300 }
     *  - 录制整个窗口：source 中 type 为 Window 的 source，captureRect 设为 { 0, 0, 0, 0 }
     *  - 录制窗口区域：source 中 type 为 Window 的 source，captureRect 设为非 NULL，例如 { 100, 100, 300, 300 }
     *  - 如果 captureRect 取值超出录制屏幕或窗口边界，会被默认设为 { 0, 0, 0, 0 }
     *
     * 视频源可以通过两种方式获取：
     *  - 从 SDK API 获取，ITXLivePusher 提供的 getScreenCaptureSources API 获取可录制的窗口、屏幕列表。
     *  - 从 系统 API 获取，获取需要录制的窗口、屏幕，并构造 LiteAVScreenCaptureSourceInfo 录制信息结构并填写 type、sourceId两个字段。
     *
     * <pre>
     *  //从 SDK API 获取录制内容示例代码
     *  ITXLivePusher *livePusher = createTXLivePusher();
     *  ILiteAVScreenCaptureSourceList* wndInfoList = livePusher->getScreenCaptureSources(SIZE{ 120, 70 }, SIZE{ 20,20 });
     *  LiteAVScreenCaptureSourceInfo selectSource;
     *  for (size_t i = 0; i < wndInfoList->getCount(); ++i)
     *  {
     *      selectSource = wndInfoList->getSourceInfo(i);
     *  }
     *  ITXLiteAVLocalRecord * pRecorder = getLocalRecordShareInstance();
     *  pRecorder->startLocalRecord(selectSource....);
     * </pre>
     *
     * 音频源是录制麦克风声音+系统播放的声音。
     *
     * @param source 指定录制内容，参考 LiteAVScreenCaptureSourceInfo 定义。
     * @param captureRect 指定录制目标区域。
     * @param szRecordPath 录制文件的全路径，只支持 .mp4 格式( eg：E:\tencent\test.mp4 )。
     */
    virtual void startLocalRecord(const LiteAVScreenCaptureSourceInfo &source, const RECT& captureRect, const char* szRecordPath) = 0;

    /**
     * 停止本地录制
     */
    virtual void stopLocalRecord() = 0;

    /**
     * 暂停本地录制
     */
    virtual void pauseLocalRecord() = 0;

    /**
     * 唤醒本地录制
     */
    virtual void resumeLocalRecord() = 0;
};

/// @}

#endif //_ILITEAV_LOCAL_RECORD_H_
