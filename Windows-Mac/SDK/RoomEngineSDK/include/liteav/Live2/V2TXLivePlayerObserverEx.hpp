#ifndef MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_
#define MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_

#include "V2TXLivePlayerObserver.hpp"

namespace liteav {
// 使用方法:
// V2TXLivePlayer::setProperty("setObserverEx", static_cast<V2TXLivePlayerObserverEx*>(this));
// 如果这里直接给 this 不 static_cast<V2TXLivePlayerObserverEx*> sdk 回调会崩溃，
// 因为这里 void * 获取的首地址不是V2TXLivePlayerObserverEx 的
class V2TXLivePlayerObserverEx : public V2TXLivePlayerObserver {
 public:
  virtual void onNetworkQuality(int quality) {}
  virtual void onEvent(int event, const char* msg) {}
  virtual void onNetStatus(const char* map) {}
};
}  // namespace liteav

#endif  // MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_
