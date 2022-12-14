﻿#ifndef MODULE_CPP_V2TXLIVEPUSHEROBSERVER_EX_HPP_
#define MODULE_CPP_V2TXLIVEPUSHEROBSERVER_EX_HPP_

#include <string>
#include "V2TXLivePusherObserver.hpp"

namespace liteav {
// ʹ�÷���:
// V2TXLivePusher::setProperty("setObserverEx", static_cast<V2TXLivePusherObserverEx*>(this));
// �������ֱ�Ӹ� this �� static_cast<V2TXLivePusherObserverEx*> sdk �ص��������
// ��Ϊ���� void * ��ȡ���׵�ַ����V2TXLivePusherObserverEx ��
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
