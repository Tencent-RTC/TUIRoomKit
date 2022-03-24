#ifndef __USER_SIG_CONFIG_H__
#define __USER_SIG_CONFIG_H__

#include <string>
#include <vector>
#include <stdint.h>

class UserSigConfig {
private:
    UserSigConfig(){}
    ~UserSigConfig(){}
public:
    static UserSigConfig& instance(){
        static UserSigConfig uniqueInstance;
        return uniqueInstance;
    }
    int GetSDKAPPID() {
        return SDKAPPID_;
    }
    std::string GetSecretKey() {
        return SecretKey_;
    }

    /**
    * 腾讯云 SDKAppId，需要替换为您自己账号下的 SDKAppId。
    *
    * 进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav ) 创建应用，即可看到 SDKAppId，
    * 它是腾讯云用于区分客户的唯一标识。
    */
    const int SDKAPPID_ = 0;

    /**
    * 计算签名用的加密密钥，获取步骤如下：
    *
    * step1. 进入腾讯云实时音视频[控制台](https://console.cloud.tencent.com/rav )，如果还没有应用就创建一个，
    * step2. 单击您的应用，并进一步找到“快速上手”部分。
    * step3. 点击“查看密钥”按钮，就可以看到计算 UserSig 使用的加密的密钥了，请将其拷贝并复制到如下的变量中
    *
    * 注意：该方案仅适用于调试Demo，正式上线前请将 UserSig 计算代码和密钥迁移到您的后台服务器上，以避免加密密钥泄露导致的流量盗用。
    * 文档：https://cloud.tencent.com/document/product/647/17275#Server
    */
    const std::string SecretKey_ = "";
};

#endif
