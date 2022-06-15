/*
 * Module:   TRTCGetUserIDAndUserSig
 */

#include "GenerateTestUserSig.h"

#include <stdio.h>
#include "zlib.h"

#include <time.h>
#include <stdio.h>
#include <memory>
#include <assert.h>
#include <Windows.h>
#include <bcrypt.h>
#pragma comment(lib, "bcrypt.lib")


class GenerateTestUserSigImpl
{
public:
    GenerateTestUserSigImpl(uint32_t SDKAppID, const std::string& secretKey, uint32_t currTime, uint32_t expireTime);
    ~GenerateTestUserSigImpl();

    std::string genTestUserSig(const std::string& userId);
private:
    std::string genHMACSHA256(const std::string& userId);
    void base64Enc(char* dest, const void* src, uint32_t length);
    char bit6ToAscii(uint8_t a);
private:
    const uint32_t          m_SDKAppID;
    const uint32_t          m_currTime;
    const uint32_t          m_expireTime;
    const std::string       m_secretKey;
};

GenerateTestUserSigImpl::GenerateTestUserSigImpl(uint32_t SDKAppID, const std::string& secretKey, uint32_t currTime, uint32_t expireTime)
    : m_SDKAppID(SDKAppID)
    , m_currTime(currTime)
    , m_expireTime(expireTime)
    , m_secretKey(secretKey)
{
    assert(m_SDKAppID > 0);
    assert(m_currTime > 0);
    assert(m_expireTime > 0);
    assert(!m_secretKey.empty());
}

GenerateTestUserSigImpl::~GenerateTestUserSigImpl()
{

}

std::string GenerateTestUserSigImpl::genTestUserSig(const std::string& userId)
{
    assert(!userId.empty());

    std::string sig = genHMACSHA256(userId);

    // userId长度 + 其他字段的长度（不超过256）
    // UserId length + length of other fields (up to 256)
    size_t dataBufferLen = userId.size() + 256; 
    std::unique_ptr<char[]> dataBuffer(new char[dataBufferLen]);

    // 为避免引入 json 库，直接拼接 json 形式的字符串。
    // To avoid importing json libraries, concatenate json strings directly 

    int count = ::sprintf_s(dataBuffer.get(), dataBufferLen,
        "{"
        "\"TLS.ver\":\"2.0\","
        "\"TLS.identifier\":\"%s\","
        "\"TLS.sdkappid\":%lu,"
        "\"TLS.expire\":%lu,"
        "\"TLS.time\":%lu,"
        "\"TLS.sig\":\"%s\""
        "}", userId.c_str(), m_SDKAppID, m_expireTime, m_currTime, sig.c_str());
    if (count == -1)
    {
        return "";
    }

    // json data compression

    uLong upperBound = compressBound(count);
    std::unique_ptr<Bytef[]> zipDest(new Bytef[count]);
    uLongf zipDestLen = count;
    int ret = compress2(zipDest.get(), &zipDestLen, (const Bytef*)dataBuffer.get(), count, Z_BEST_SPEED);
    if (ret != Z_OK)
    {
        return "";
    }

    // base64 encode

    size_t base64Len = (zipDestLen / 3 + 1) * 4 + 1;
    std::unique_ptr<char[]> base64Buffer(new char[base64Len]);
    base64Enc(base64Buffer.get(), zipDest.get(), zipDestLen);

    std::string result(base64Buffer.get());
    for (auto it = result.begin(); it != result.end(); ++it)
    {
        switch (*it)
        {
        case '+':
            *it = '*';
            break;
        case '/':
            *it = '-';
            break;
        case '=':
            *it = '_';
            break;
        default:
            break;
        }
    }

    return result;
}

static void closeAlgHandle(BCRYPT_ALG_HANDLE* p)
{
    if (*p)
    {
        BCryptCloseAlgorithmProvider(*p, 0);
        *p = NULL;
    }
}

static void closeHashHandle(BCRYPT_HASH_HANDLE* p)
{
    if (*p)
    {
        BCryptDestroyHash(*p);
        *p = NULL;
    }
}

std::string GenerateTestUserSigImpl::genHMACSHA256(const std::string& userId)
{
    // 拼接用于生成 HMACSHA256 的字符串。
    // Concatenate the string used to generate HMACSHA256

    size_t dataBufferLen = userId.size() + 256;
    std::unique_ptr<char[]> dataBuffer(new char[dataBufferLen]);

    int count = ::sprintf_s(dataBuffer.get(), dataBufferLen,
        "TLS.identifier:%s\n"
        "TLS.sdkappid:%lu\n"
        "TLS.time:%lu\n"
        "TLS.expire:%lu\n", userId.c_str(), m_SDKAppID, m_currTime, m_expireTime);
    if (count == -1)
    {
        return "";
    }

    std::string data(dataBuffer.get(), count);

    // 打开加密算法的句柄。
    // Opens a handle to the encryption algorithm
    BCRYPT_ALG_HANDLE alg = NULL;
    NTSTATUS status = BCryptOpenAlgorithmProvider(
        &alg,
        BCRYPT_SHA256_ALGORITHM,
        NULL,
        BCRYPT_ALG_HANDLE_HMAC_FLAG);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error] BCryptOpenAlgorithmProvider failed: 0x%x\n", status);
        return "";
    }

    // 资源托管，自动释放
    // Resource hosting, automatic release
    std::unique_ptr<BCRYPT_ALG_HANDLE, decltype(closeAlgHandle)*> algAutoDel(&alg, closeAlgHandle);

    // 计算存放 hashBuffer 对象的 dataBuffer 大小。
    // Calculates the dataBuffer size to hold the hashBuffer object
    DWORD cbHashObject = 0;
    DWORD cbData = 0;
    status = BCryptGetProperty(
        alg,
        BCRYPT_OBJECT_LENGTH,
        (PBYTE)&cbHashObject,
        sizeof(DWORD),
        &cbData,
        0);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error] BCryptGetProperty failed: 0x%x\n", status);
        return "";
    }

    // 分配 hashBuffer 对象的内存
    // Allocate memory for the hashBuffer object
    std::unique_ptr<BYTE[]> hashObject(new BYTE[cbHashObject]);
    if (!hashObject.get())
    {
        printf("[Error] memory allocation failed\n");
        return "";
    }

    // 计算 hashBuffer 的长度。
    // Calculates the length of the hashBuffer.
    DWORD cbHash = 0;
    status = BCryptGetProperty(
        alg,
        BCRYPT_HASH_LENGTH,
        (PBYTE)&cbHash,
        sizeof(DWORD),
        &cbData,
        0);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error] BCryptGetProperty: 0x%x\n", status);
        return "";
    }

    // 分配 hashBuffer dataBuffer 的内存
    // Allocate memory for hashBuffer dataBuffer
    std::unique_ptr<BYTE[]> hashBuffer(new BYTE[cbHash]);
    if (!hashBuffer.get())
    {
        printf("[Error] memory allocation failed\n");
        return "";
    }

    // 创建 hashBuffer 对象。
    // Create a hashBuffer object
    BCRYPT_HASH_HANDLE hash = NULL;
    status = BCryptCreateHash(
        alg,
        &hash,
        hashObject.get(),
        cbHashObject,
        (PBYTE)m_secretKey.c_str(),
        m_secretKey.size(),
        0);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error]BCryptCreateHash: 0x%x\n", status);
        return "";
    }

    // 资源托管，自动释放
    // Resource hosting, automatic release
    std::unique_ptr<BCRYPT_HASH_HANDLE, decltype(closeHashHandle)*> hashAutoDel(&hash, closeHashHandle);

    // 生成 hashBuffer 值。
    // Generate hashBuffer value
    status = BCryptHashData(
        hash,
        (PBYTE)data.c_str(),
        data.size(),
        0);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error]BCryptHashData: 0x%x\n", status);
        return "";
    }

    // 关闭 hashBuffer 对象
    // Close the hashBuffer object
    status = BCryptFinishHash(
        hash,
        hashBuffer.get(),
        cbHash,
        0);
    if (!BCRYPT_SUCCESS(status))
    {
        printf("[Error]BCryptFinishHash: 0x%x\n", status);
        return "";
    }

    // base64 encode
    size_t base64Len = (cbHash / 3 + 1) * 4 + 1;
    std::unique_ptr<char[]> base64Buffer(new char[base64Len + 1]);
    base64Enc(base64Buffer.get(), hashBuffer.get(), cbHash);

    return std::string(base64Buffer.get());
}

void GenerateTestUserSigImpl::base64Enc(char *dest, const void *src, uint32_t length)
{
    uint32_t i = 0;
    uint32_t j = 0;
    uint8_t a[4] = { 0 };
    for (i = 0; i < length / 3; ++i)
    {
        a[0] = (((uint8_t*)src)[i * 3 + 0]) >> 2;
        a[1] = (((((uint8_t*)src)[i * 3 + 0]) << 4) | ((((uint8_t*)src)[i * 3 + 1]) >> 4)) & 0x3F;
        a[2] = (((((uint8_t*)src)[i * 3 + 1]) << 2) | ((((uint8_t*)src)[i * 3 + 2]) >> 6)) & 0x3F;
        a[3] = (((uint8_t*)src)[i * 3 + 2]) & 0x3F;
        for (j = 0; j < 4; ++j)
        {
            *dest++ = bit6ToAscii(a[j]);
        }
    }

    switch (length % 3)
    {
    case 0:
        break;
    case 1:
        a[0] = (((uint8_t*)src)[i * 3 + 0]) >> 2;
        a[1] = ((((uint8_t*)src)[i * 3 + 0]) << 4) & 0x3F;
        *dest++ = bit6ToAscii(a[0]);
        *dest++ = bit6ToAscii(a[1]);
        *dest++ = '=';
        *dest++ = '=';
        break;
    case 2:
        a[0] = (((uint8_t*)src)[i * 3 + 0]) >> 2;
        a[1] = (((((uint8_t*)src)[i * 3 + 0]) << 4) | ((((uint8_t*)src)[i * 3 + 1]) >> 4)) & 0x3F;
        a[2] = ((((uint8_t*)src)[i * 3 + 1]) << 2) & 0x3F;
        *dest++ = bit6ToAscii(a[0]);
        *dest++ = bit6ToAscii(a[1]);
        *dest++ = bit6ToAscii(a[2]);
        *dest++ = '=';
        break;
    default:
        assert(false);
        break;
    }

    // 尾部添加结束符
    // Add terminator to tail
    *dest = '\0';
}

char GenerateTestUserSigImpl::bit6ToAscii(uint8_t a)
{
    a &= (uint8_t)0x3F;

    if (a <= 25)
    {
        return a + 'A';
    }

    if (a <= 51)
    {
        return a - 26 + 'a';
    }

    if (a <= 61)
    {
        return a - 52 + '0';
    }

    if (a == 62)
    {
        return '+';
    }

    return '/'; // a == 63
}


GenerateTestUserSig::GenerateTestUserSig()
{

}

GenerateTestUserSig::~GenerateTestUserSig()
{

}

GenerateTestUserSig& GenerateTestUserSig::instance()
{
    static GenerateTestUserSig uniqueInstance;
    return uniqueInstance;
}

std::string GenerateTestUserSig::genTestUserSig(std::string userId) const
{
    uint32_t currTime = (uint32_t)time(NULL);

    std::string secretkey = SECRETKEY;
    GenerateTestUserSigImpl impl(SDKAPPID, secretkey, currTime, EXPIRETIME);

    return impl.genTestUserSig(userId);
}
