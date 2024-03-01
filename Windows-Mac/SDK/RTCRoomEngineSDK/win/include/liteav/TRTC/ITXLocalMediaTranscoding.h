// Copyright (c) 2022 Tencent. All rights reserved.

#ifndef TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_
#define TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_

// TODO(xiaozhihe) : 后期需要通过 md 的方式生成 api 接口
#include "ITRTCCloud.h"
#include "TRTCTypeDef.h"
#include "TXLiteAVBase.h"

namespace liteav {
class ITXLocalMediaTranscoding;
}

/**
 * 利用 C 函数获取 ITXLocalMediaTranscoding 实例
 *
 * 你可以按照下列方式创建和销毁 ITXLocalMediaTranscoding Instance
 * <pre>
 * ITXLocalMediaTranscoding *instance = createTXLocalMediaTranscoding();
 * if(instance) {
 *     instance->startTranscoding(xxxx);
 * }
 * destroyTXLocalMediaTranscoding(instance);
 * instance = nullptr;
 * </pre>
 */
extern "C" {
LITEAV_API liteav::ITXLocalMediaTranscoding* createTXLocalMediaTranscoding();

LITEAV_API void destroyTXLocalMediaTranscoding(liteav::ITXLocalMediaTranscoding* instance);
}

namespace liteav {

/**
 * 媒体源类型
 */
enum LocalMediaTranscodingSourceType {

  /// 摄像头媒体类型。
  MediaSourceCamera = 0,

  /// 屏幕媒体类型。
  MediaSourceScreen = 1,

  /// 图片媒体类型，目前只支持 BMP、JPG、PNG、GIF 四种格式。
  MediaSourceImage = 2,

  /// 预留字段，当前版本不支持远端用户视频源混流转码。
  MediaSourceRemoteVideo = 3,

};

/**
 * 媒体源
 */
struct LocalMediaTranscodingSource {
  /// 【字段含义】媒体类型。
  LocalMediaTranscodingSourceType sourceType = LocalMediaTranscodingSourceType::MediaSourceCamera;

  /// 【字段含义】摄像头 ID
  ///  当 sourceType 为 MediaSourceCamera 时此字段有效，您可以使用该字段指定摄像头的设备
  ///  ID，摄像头的设备 ID 可以通过 TXDeviceManager 中的接口获取
  const char* cameraDeviceId = nullptr;

  /// 【字段含义】屏幕或窗口 ID
  ///  当 sourceType 为 MediaSourceScreen
  ///  时此字段有效，您可以使用该字段指定整个屏幕或者某个窗口的窗口 ID，您可以通过 TRTCCloud 中的
  ///  getScreenCaptureSources 接口获取可以被分享的窗口 ID。
  TXView screenSourceId = nullptr;

  /// 【字段含义】图像的地址
  ///  当 sourceType 为 MediaSourceImage
  ///  时此字段有效，您可以使用该字段指定图片的文件路径，目前版本只支持 BMP、JPG、PNG、GIF
  ///  四种图像格式。
  const char* imagePath = nullptr;

  /// 【字段含义】远端视频流的用户 ID
  ///  当 sourceType 为 MediaSourceRemoteVideo 时此字段有效，不过当前版本的 SDK 还不支持这个能力。
  const char* userId = nullptr;

  /// 【字段含义】指定该路画面的坐标区域（单位：像素）。
  RECT rect = RECT{0};

  /// 【字段含义】指定该路画面的层级（取值范围：0 - 15，不可重复）。
  int zOrder = 0;

  /// @param renderParams 指定该路数据源是否旋转、镜像和填充模式，详情请参见  {@link
  /// TRTCRenderParams} 。
  const TRTCRenderParams* renderParams = nullptr;
};

/**
 * 本地媒体流混流转码配置参数
 */
struct LocalMediaTranscodingParams {
  /// 【字段含义】指定转码流中的每一路输入媒体源配置的信息。
  /// 【推荐取值】该字段是一个 LocalMediaTranscodingSource
  /// 类型的数组，数组中的每一个元素都用来代表每一路输入媒体源的信息。
  /// 【特别说明】媒体源信息不支持留空，否则 ITXLocalTranscodingCallback::onTranscodingStarted
  /// 会报错。
  LocalMediaTranscodingSource* inputSourceList = nullptr;

  /// 【字段含义】数组 inputStreamList 的大小
  unsigned int inputSourceListSize = 0;

  /// 【字段含义】转码流的视频编码参数。
  TRTCVideoEncParam videoEncoderParams;

  /// 【字段含义】指定混合画面的底色。
  /// 【推荐取值】默认值：0x000000 代表黑色。格式为十六进制数字，比如：“0x61B9F1” 代表 RGB 分别为
  /// （97、158、241）。
  int canvasColor = 0x000000;
};

/**
 * 本地媒体流混流转码错误码
 */
enum LocalMediaTranscodingError {

  /// 调用成功。
  Success = 0,

  /// 通用错误码
  Error = -1,

  /// 参数非法。
  InvalidParams = -2,

  /// 某个数据源混流异常，LocalMediaTranscodingSource 某条数据源超过 30s 没数据抛此异常。
  NotFoundSource = -3,

  /// 图片源加载失败返回此错误码
  ImageSourceLoadFailed = -4,

};

class ITXVideoFrameProcessCallback {
 public:
  virtual ~ITXVideoFrameProcessCallback() {}

  /**
   * 自定义图像处理回调（对接第三方美颜组件）
   *
   *
   * 如果您选购了第三方美颜组件，就需要在 ITXLocalMediaTranscoding 中设置第三方美颜回调，之后
   * ITXLocalMediaTranscoding 就会将原本要进行预处理的视频帧通过此回调接口抛送给您。 之后您就可以将
   * ITXLocalMediaTranscoding
   * 抛出的视频帧交给第三方美颜组件进行图像处理，由于抛出的数据是可读且可写的，因此第三方美颜的处理结果也可以同步给
   * ITXLocalMediaTranscoding 进行后续的编码和发送。 情况一：美颜组件自身会产生新的纹理。
   * 如果您使用的美颜组件会在处理图像的过程中产生一帧全新的纹理（用于承载处理后的图像），那请您在回调函数中将
   * processedVideoFrame.textureId 设置为新纹理的 ID：
   * <pre>
   * int onProcessCameraVideo(char* cameraDeviceId,TRTCVideoFrame*
   * originalVideoFrame,TRTCVideoFrame* processedVideoFrame) {
   *  processedVideoFrame->textureId =
   *  mFURenderer.onDrawFrameSingleImput(originalVideoFrame->textureId);
   *  return 0;
   * }
   * </pre>
   *
   * 情况二：美颜组件需要您提供目标纹理。
   * 如果您使用的第三方美颜模块并不生成新的纹理，而是需要您设置给该模块一个输入纹理和一个输出纹理，则可以考虑如下方案：
   * <pre>
   * int onProcessCameraVideo(char* cameraDeviceId,TRTCVideoFrame*
   * originalVideoFrame,TRTCVideoFrame* processedVideoFrame) {
   *  thirdparty_process(originalVideoFrame->textureId,originalVideoFrame->width,originalVideoFrame->height,
   *  processedVideoFrame->textureId);
   *  return 0;
   * }
   * </pre>
   *
   * @param originalVideoFrame 用于承载 TRTC 采集到的摄像头画面。
   * @param processedVideoFrame 用于接收第三方美颜处理过的视频画面。
   * @return - 0：   成功。
   *         - 其他： 错误。
   * @note 目前仅支持 OpenGL 纹理方案（ PC 仅支持 TRTCVideoBufferType_Buffer 格式）。
   */
  virtual int onProcessVideoFrame(const char* cameraDeviceId,
                                  const TRTCVideoFrame* originalVideoFrame,
                                  TRTCVideoFrame* processedVideoFrame) = 0;
};

class ITXVideoFrameRenderCallback {
 public:
  virtual ~ITXVideoFrameRenderCallback() {}

  /**
   * 自定义图像渲染回调（用于自定义显示混合后的画面）
   *
   * @param mixedVideoFrame  经过本地混合后的视频图像
   */
  virtual int onRenderMixedFrame(const TRTCVideoFrame* mixedVideoFrame) = 0;
};

class ILocalMediaTranscodingCallback {
 public:
  virtual ~ILocalMediaTranscodingCallback() {}

  /**
   * 本地混流转码开启的事件回调
   *
   * 当您调用 {@link startTranscoding} 时启动本地混流转码时，是否启动成功会通过此回调同步给您。
   * @param errCode 错误码，详情请参见 {@link LocalMediaTranscodingError} 。
   * @param errMsg 错误信息。
   */
  virtual void onTranscodingStarted(LocalMediaTranscodingError errCode, const char* errMsg) = 0;

  /**
   * 本地混流转码停止的事件回调
   *
   * 当您通过 {@link stopTranscoding} 停止本地混流转码时，SDK 便会抛出此事件回调。
   * @param reason 停止原因，0：用户主动停止；1：被动停止，有可能采集源失效了。
   * @param resonMsg 停止原因描述信息。
   */
  virtual void onTranscodingStopped(int reason, const char* resonMsg) = 0;

  /**
   * 本地摄像头开启的事件回调
   *
   * 当您调用 {@link startCameraSource} 打开摄像头时，是否启动成功会通过此回调同步给您。
   * @param deviceId 摄像头设备 Id 。
   * @param errCode 错误码，详情请参见 {@link LocalMediaTranscodingError} 。
   * @param errMsg 错误信息。
   */
  virtual void onCameraSourceStarted(const char* deviceId,
                                     LocalMediaTranscodingError errCode,
                                     const char* errMsg) = 0;

  /**
   * 本地摄像头停止的事件回调
   *
   * @param deviceId 摄像头设备 Id 。
   * @param resonMsg 停止原因描述信息。
   */
  virtual void onCameraSourceStopped(const char* deviceId, const char* resonMsg) = 0;

  /**
   * 图片混流开启的事件回调
   *
   * 当您调用 {@link startImageSource} 打开摄像头时，是否启动成功会通过此回调同步给您。
   * @param imagePath 图片路径 。
   * @param errCode 错误码，详情请参见 {@link LocalMediaTranscodingError} 。
   * @param errMsg 错误信息。
   */
  virtual void onImageSourceStarted(const char* imagePath,
                                    LocalMediaTranscodingError errCode,
                                    const char* errMsg) = 0;

  /**
   * 图片混流停止的事件回调
   *
   * @param imagePath 图片路径 。
   */
  virtual void onImageSourceStopped(const char* imagePath) = 0;

  /**
   * 屏幕分享开启的事件回调
   *
   * 当您通过 {@link startScreenSource} 等相关接口启动屏幕分享时，SDK 便会抛出此事件回调。
   * @param sourceId 屏幕或者窗口 Id 。
   * @param errCode 错误码，详情请参见 {@link LocalMediaTranscodingError} 。
   * @param errMsg 错误信息。
   */
  virtual void onScreenSourceStarted(TXView sourceId,
                                     LocalMediaTranscodingError errCode,
                                     const char* errMsg) {}

  /**
   * 屏幕分享暂停的事件回调
   *
   * @param sourceId 屏幕或者窗口 Id 。
   * @param reason 原因。
   * - 1：注意此字段的含义在 MAC 和 Windows
   * 平台有稍微差异。屏幕窗口不可见暂停（Mac）。表示设置屏幕分享参数导致的暂停（Windows）。
   * - 2：表示屏幕分享窗口被最小化导致的暂停（仅 Windows）。
   * - 3：表示屏幕分享窗口被隐藏导致的暂停（仅 Windows）。
   */
  virtual void onScreenSourcePaused(TXView sourceId, int reason) {}

  /**
   * 屏幕分享恢复的事件回调
   *
   * @param sourceId 屏幕或者窗口 Id 。
   * @param reason 恢复原因。
   * - 1：注意此字段的含义在 MAC 和 Windows
   * 平台有稍微差异。屏幕窗口恢复可见从而恢复分享（Mac）。屏幕分享参数设置完毕后自动恢复（Windows）。
   * - 2：表示屏幕分享窗口从最小化被恢复（仅 Windows）。
   * - 3：表示屏幕分享窗口从隐藏被恢复（仅 Windows）。
   */
  virtual void onScreenSourceResumed(TXView sourceId, int reason) {}

  /**
   * 屏幕分享停止的事件回调
   *
   * 当您通过 {@link stopScreenSource} 停止屏幕分享时，SDK 便会抛出此事件回调。

   * @param sourceId 屏幕或者窗口 Id 。
   * @param reason
   停止原因，0：用户主动停止；1：屏幕窗口关闭导致停止；2：表示屏幕分享的显示屏状态变更（如接口被拔出、投影模式变更等）。
   */
  virtual void onScreenSourceStopped(TXView sourceId, int reason) {}

  /**
   * 当输入媒体源的画面大小发生变化时，会通过该接口返回该输入源最新的尺寸，您可以根据该尺寸来动态调整画面的比例。
   * @param mediaSource 字段代表该路输入媒体源信息。
   * @param newSize 字段代表该路输入媒体源最新的画面大小。
   * @note 目前媒体源类型仅支持窗口采集。
   */
  virtual void onMediaSourceSizeChanged(const LocalMediaTranscodingSource& mediaSource, const SIZE& newSize) {};
};

class ITXLocalMediaTranscoding {
 public:
  /**
   * 设置 TXLocalMediaTranscoding 事件回调
   *
   * 您可以通过 {@link setTranscodingCallback} 获得来自 SDK
   * 的各类事件通知（比如：错误码，警告码，接口调用状态等）。
   * @param callback 回调实例
   */
  virtual void setTranscodingCallback(ILocalMediaTranscodingCallback* callback) = 0;

  /**
   * 设置 ITXLocalMediaTranscoding 视频自定义预处理数据回调
   *
   * 您可以通过 {@link setVideoFrameProcessCallback} 获得来自 ITXVideoFrameProcessCallback
   * 摄像头自定义预处理数据。
   * @param pixelFormat 指定回调的像素格式，目前仅支持 TRTCVideoPixelFormat_I420 ||
   * TRTCVideoPixelFormat_BGRA32 || TRTCVideoPixelFormat_RGBA32 格式。
   * @param bufferType  指定视频数据结构类型，目前仅支持 TRTCVideoBufferType_Buffer。
   * @param callback 回调实例
   */
  virtual void setVideoFrameProcessCallback(TRTCVideoPixelFormat pixelFormat,
                                            TRTCVideoBufferType bufferType,
                                            ITXVideoFrameProcessCallback* callback) = 0;

  /**
   * 设置 ITXLocalMediaTranscoding 视频自定义渲染数据回调
   *
   * 您可以通过 {@link setVideoFrameRenderCallback} 获得来自 ITXVideoFrameRenderCallback
   * 业务需要的自定义渲染数据。
   * - 您可以通过调用 setVideoFrameRenderCallback(TRTCVideoPixelFormat_Unknown,
   * TRTCVideoBufferType_Unknown, nullptr) 停止回调。
   * - iOS、Mac、Windows 平台目前仅支持回调 {@link TRTCVideoPixelFormat_I420} 或 {@link
   * TRTCVideoPixelFormat_BGRA32} 像素格式的视频帧。
   * - Android 平台目前仅支持传入 {@link TRTCVideoPixelFormat_I420}, {@link
   * TRTCVideoPixelFormat_RGBA32} 或 {@link TRTCVideoPixelFormat_Texture_2D} 像素格式的视频帧。
   * @param pixelFormat 指定回调的像素格式
   * @param bufferType  指定视频数据结构类型，目前只支持 {@link TRTCVideoBufferType_Buffer}
   * 内存格式数据。
   * @param callback 回调实例
   */
  virtual void setVideoFrameRenderCallback(TRTCVideoPixelFormat pixelFormat,
                                           TRTCVideoBufferType bufferType,
                                           ITXVideoFrameRenderCallback* callback) = 0;

  /**
   * 启动本地混流转码
   *
   * @param streamType 指定使用 TRTC 的 TRTCVideoStreamTypeBig 来推流，还是 TRTCVideoStreamTypeSub
   * 来推流。
   * @param params 指定本地混流转码的参数，详情请参见 {@link LocalMediaTranscodingParams} 。
   */
  virtual void startTranscoding(TRTCVideoStreamType streamType,
                                const LocalMediaTranscodingParams& params) = 0;

  /**
   * 更新本地混流转码参数
   *
   * @param params 指定本地混流转码的参数，详情请参见  {@link LocalMediaTranscodingParams} 。
   */
  virtual void updateTranscodingParams(const LocalMediaTranscodingParams& params) = 0;

  /**
   *  停止本地混流转码
   */
  virtual void stopTranscoding() = 0;

  /**
   * 启动摄像头采集
   *
   * @param cameraDeviceId 摄像头设备 Id 。
   */
  virtual void startCameraSource(const char* cameraDeviceId) = 0;

  /**
   * 停止摄像头采集
   *
   * @param cameraDeviceId 摄像头设备 Id 。
   */
  virtual void stopCameraSource(const char* cameraDeviceId) = 0;

  /**
   * 设置摄像头采集参数
   *
   * @param cameraDeviceId 摄像头设备 Id 。
   * @param cameraParam 指定摄像头采集分辨率和帧率，详情请参见  {@link TXCameraCaptureParam} 。
   */
  virtual void setCameraCaptureParam(const char* cameraDeviceId,
                                     const TXCameraCaptureParam* cameraParam) = 0;

  /**
   * 启用摄像头采集画面绿幕抠图
   *
   * @param cameraDeviceId 摄像头设备 Id 。
   * @param enable 是否启用摄像头采集画面绿幕抠图。
   */
  virtual void enableCameraGreenScreen(const char* cameraDeviceId, bool enable) = 0;

  /**
   *  启动屏幕/窗口采集
   *
   * @param screenSource 屏幕/窗口采集的详细参数，详情请参见  {@link TRTCScreenCaptureSourceInfo} 。
   * @param captureRect 指定捕获的区域。
   */
  virtual void startScreenSource(const TRTCScreenCaptureSourceInfo& screenSource,
                                 const RECT& captureRect) = 0;

  /**
   *  更新窗口/屏幕采集属性
   *
   * @param sourceId 屏幕/窗口的 Id 。
   * @param property 屏幕/窗口采集参数，详情见 {@link TRTCScreenCaptureProperty}
   */
  virtual void updateScreenCaptureProperty(TXView sourceId,
                                           const liteav::TRTCScreenCaptureProperty& property) = 0;

  /**
   * 停止屏幕/窗口采集
   *
   * @param screenSourceId 屏幕/窗口的 Id 。
   */
  virtual void stopScreenSource(const TXView screenSourceId) = 0;

  /**
   * 启动图片采集
   *
   * @param imagePath 图片路径 ，目前只支持 BMP、JPG、PNG、GIF 四种格式。
   * @param fps 采集输出帧率，可以不设置由 SDK 做最佳决策。
   */
  virtual void addImageSource(const char* imagePath, int fps = 0) = 0;

  /**
   * 停止图片采集
   *
   * @param imagePath 图片路径。
   */
  virtual void removeImageSource(const char* imagePath) = 0;

  /**
   * 设置渲染窗口
   *
   * @param view 渲染窗口 。
   */
  virtual void setMixedVideoRenderView(TXView view) = 0;

  /**
   * 将当前 ITXLocalMediaTranscoding 附着至 TRTC
   *
   * @param trtcCloud TRTC 实例指针
   * @note SDK 会根据 {@link startTranscoding} 设置的 TRTCVideoStreamType
   * 来决定用哪一路流推流。
   */
  virtual void attachTRTC(ITRTCCloud* trtcCloud) = 0;

  /**
   * 将当前 ITXLocalMediaTranscoding 和 TRTC 分离
   */
  virtual void detachTRTC() = 0;

 protected:
  virtual ~ITXLocalMediaTranscoding() {}
};

}  // namespace liteav

#endif  // TRTC_CPP_ITXLOCALMEDIATRANSCODING_H_