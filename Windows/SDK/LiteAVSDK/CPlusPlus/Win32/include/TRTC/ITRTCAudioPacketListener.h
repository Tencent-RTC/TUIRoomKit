// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef SDK_TRTC_INCLUDE_ITRTCAUDIOPACKETLISTENER_H_
#define SDK_TRTC_INCLUDE_ITRTCAUDIOPACKETLISTENER_H_

#include <stdio.h>

#include "TXLiteAVBuffer.h"
#include "TXLiteAVSymbolExport.h"

#ifdef __cplusplus

namespace liteav {
struct LITEAV_EXPORT TRTCAudioPacket {
  const char* userId;
  liteav::TXLiteAVBuffer* extraData;
};

class LITEAV_EXPORT ITRTCAudioPacketListener {
 public:
  virtual ~ITRTCAudioPacketListener() {}

  // 网络层接收到音频数据包
  virtual bool onRecvAudioPacket(TRTCAudioPacket& data) { return false; }

  // 网络层即将发送的音频数据包
  virtual bool onSendAudioPacket(TRTCAudioPacket& data) { return false; }
};

}  // namespace liteav

#endif  // __cplusplus

#endif  // SDK_TRTC_INCLUDE_ITRTCAUDIOPACKETLISTENER_H_
