// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef SDK_TRTC_INCLUDE_ITXLITEAVENCODEDDATAPROCESSINGLISTENER_H_
#define SDK_TRTC_INCLUDE_ITXLITEAVENCODEDDATAPROCESSINGLISTENER_H_

#include <stdio.h>

#include "TXLiteAVBuffer.h"
#include "TXLiteAVSymbolExport.h"

#ifdef __cplusplus

namespace liteav {

struct LITEAV_EXPORT TXLiteAVEncodedData {
  // didEncodeVideo 和 didEncodeAudio 回调时，此字段为 null；
  const char* userId;

  // 视频流类型，参考 TRTCVideoStreamType，audio 时，此字段为0
  int streamType;

  // 原始数据
  const liteav::TXLiteAVBuffer* originData;

  // 写回处理后的数据
  liteav::TXLiteAVBuffer* processedData;
};

class LITEAV_EXPORT ITXLiteAVEncodedDataProcessingListener {
 public:
  virtual ~ITXLiteAVEncodedDataProcessingListener() {}

  /**
   * 回调编码完的视频数据。
   *  @note videoData.userId = nullptr
   */
  virtual bool didEncodeVideo(TXLiteAVEncodedData& videoData) { return false; }

  /**
   * 回调解码前的视频数据。
   *  @note videoData.userId 表示对应的 user，当userId 为
   * nullptr 时，表示此时先接收到数据了，对应的 userId 还未完成同步。获取到
   * userId 之后会回调正确的 userId
   */
  virtual bool willDecodeVideo(TXLiteAVEncodedData& videoData) { return false; }

  /**
   * 回调编码完的音频数据。
   *  @note audioData.userId = nullptr
   */
  virtual bool didEncodeAudio(TXLiteAVEncodedData& audioData) { return false; }

  /**
   * 回调解码前的音频数据。
   *  @note audioData.userId 表示对应的 user，当 userId 为
   * nullptr 时，表示此时先接收到数据了，对应的 userId 还未完成同步。获取到
   * userId 之后会回调正确的 userId
   */
  virtual bool willDecodeAudio(TXLiteAVEncodedData& audioData) { return false; }
};

}  // namespace liteav

#endif  // __cplusplus

#endif  // SDK_TRTC_INCLUDE_ITXLITEAVENCODEDDATAPROCESSINGLISTENER_H_
