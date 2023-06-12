#ifndef __ITXLITEAVNETWORKPROXY_H__
#define __ITXLITEAVNETWORKPROXY_H__

#include "TXLiteAVBase.h"
class ITXNetworkProxy;

extern "C" {
    /**
    * 用于动态加载dll时，导出TXNetworkProxy C++对象。
    *
    * @return TXNetworkProxy对象指针，注意：delete ITXNetworkProxy*会编译错误，需要调用destroyTXNetworkProxy释放。
    */
    LITEAV_API ITXNetworkProxy* createTXNetworkProxy();

    /**
    * 析构ITXNetworkProxy对象
    *
    * @param pTXNetworkProxy 传入需要释放的对象指针地址
    */
    LITEAV_API void destroyTXNetworkProxy(ITXNetworkProxy** pTXNetworkProxy);
}

struct TRTCSocks5ProxyConfig {
  bool support_https = true;
  bool support_tcp = true;
  bool support_udp = true;
};

class ITXNetworkProxy {
 protected:
  virtual ~ITXNetworkProxy(){};

 public:
  /////////////////////////////////////////////////////////////////////////////////
  //
  //              SDK 代理功能接口
  //
  /////////////////////////////////////////////////////////////////////////////////
  /*
   * TRTCCloud 代理设置
   *
   * socks5 代理模式，设置 socks5 tcp/udp 代理服务器 ip 和 port。
   * 设置此接口后，在内网环境可以正常使用进房、发布本地音视频、订阅远端音视频、退房等功能
   * 细节请参考TRTC
   * 代理方案<https://trtc-1252463788.cos.ap-guangzhou.myqcloud.com/proxy/proxy_server_deploy_dante.zip>
   *
   * @param host 代理服务器的 ip 地址或者域名地址
   * @param port 代理服务器的端口
   * @param username 代理服务器的用户名
   * @param password 代理服务器的密码
   * @param config.supportHttps 是否支持https, config.upportTcp 是否支持tcp, config.supportUdp
   * 是否支持udp
   *
   * @return 设置成功返回0，域名解释失败或者ip非法返回-1。
   * @note 本接口有以下限制：
   *       - 设置完，请 destroy TRTCCloud 重新获取 TRTC 对象
   *       - 如果你只是用 TRTCCloud，则只需要设置Sock5代理接口。
   */
  virtual int setSocks5Proxy(const char* host,
                             unsigned short port,
                             const char* username,
                             const char* password,
                             const TRTCSocks5ProxyConfig* config = nullptr) = 0;
};

#endif //__ITXLITEAVNETWORKPROXY_H__
