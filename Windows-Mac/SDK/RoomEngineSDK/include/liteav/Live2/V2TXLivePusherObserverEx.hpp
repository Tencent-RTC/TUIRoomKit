#ifndef MODULE_CPP_V2TXLIVEPUSHEROBSERVER_EX_HPP_
#define MODULE_CPP_V2TXLIVEPUSHEROBSERVER_EX_HPP_

#include <string>
#include "V2TXLivePusherObserver.hpp"

namespace liteav {
// 使用方法:
// V2TXLivePusher::setProperty("setObserverEx", static_cast<V2TXLivePusherObserverEx*>(this));
// 如果这里直接给 this 不 static_cast<V2TXLivePusherObserverEx*> sdk 回调会崩溃，
// 因为这里 void * 获取的首地址不是V2TXLivePusherObserverEx 的
class V2TXLivePusherObserverEx : public V2TXLivePusherObserver {
 public:
  virtual void OnEvent(int code, const char* map) {}
  virtual void OnNetStatus(const char* map) {}
  virtual void OnNetworkQuality(int quality) {}
  virtual void OnEnterRoom(int result, const std::string& msg) {}
  virtual void OnExitRoom(int reason, const std::string& msg) {}
  virtual void OnUserOnline(const std::string& user_id) {}
  virtual void OnUserOffline(const std::string& user_id) {}
  virtual void OnUserVideoAvailable(const std::string& user_id, int stream_type, bool available) {}
  virtual void OnUserAudioAvailable(const std::string& user_id, bool available) {}
};
}  // namespace liteav

#endif  // MODULE_CPP_V2TXLIVEPUSHEROBSERVER_EX_HPP_
