﻿#ifndef MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_
#define MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_

#include "V2TXLivePlayerObserver.hpp"

namespace liteav {
// ʹ�÷���:
// V2TXLivePlayer::setProperty("setObserverEx", static_cast<V2TXLivePlayerObserverEx*>(this));
// �������ֱ�Ӹ� this �� static_cast<V2TXLivePlayerObserverEx*> sdk �ص��������
// ��Ϊ���� void * ��ȡ���׵�ַ����V2TXLivePlayerObserverEx ��
class V2TXLivePlayerObserverEx : public V2TXLivePlayerObserver {
 public:
  virtual void onNetworkQuality(int quality) {}
  virtual void onEvent(int event, const char* msg) {}
  virtual void onNetStatus(const char* map) {}
};
}  // namespace liteav

#endif  // MODULE_CPP_V2TXLIVEPLAYEROBSERVER_EX_HPP_
