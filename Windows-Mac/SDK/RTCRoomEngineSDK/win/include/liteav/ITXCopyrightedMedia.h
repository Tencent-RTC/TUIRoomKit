/**
 * Copyright (c) 2023 Tencent. All rights reserved.
 * Module: 音速达版权音乐
 * Function: 用于下载音速达版权音乐数据
 */
#ifndef __ITXCOPYRIGHTEDMEDIA_H__
#define __ITXCOPYRIGHTEDMEDIA_H__

#if defined(_WIN32)
#define COPYRIGHT_API __declspec(dllexport)
#elif __APPLE__
#include <TargetConditionals.h>
#define COPYRIGHT_API __attribute__((visibility("default")))
#elif __ANDROID__
#define COPYRIGHT_API __attribute__((visibility("default")))
#else
#define COPYRIGHT_API
#endif

namespace liteav {

class ITXCopyrightedSongScore;

/**
 * 版权音乐下载相关的错误码
 */
enum class TXCopyrightedError {

    /// 成功
    TXCopyrightedErrorNoError = 0,

    /// 初始化失败
    TXCopyrightedErrorInitFail = -1,

    /// 用户取消数据获取
    TXCopyrightedErrorCancel = -2,

    /// token 过期
    TXCopyrightedErrorTokenFail = -3,

    /// 网络错误
    TXCopyrightedErrorNetFail = -4,

    /// 内部错误
    TXCopyrightedErrorInner = -5,

    /// 解析错误
    TXCopyrightedErrorParseFail = -6,

    /// 解密错误
    TXCopyrightedErrorDecryptFail = -7,

    /// License校验不通过
    TXCopyrightedErrorLicenseFail = -8,

    /// 音乐正在下载
    TXCopyrightedErrorIsDownloading = -9,

    /// 伴奏文件不存在
    TXCopyrightedErrorAccompanimentNotExist = -10,

    /// 原唱文件不存在
    TXCopyrightedErrorOriginNotExist = -11,

    /// 歌词文件不存在
    TXCopyrightedErrorLyricNotExist = -12,

    /// 写文件出错
    TXCopyrightedErrorWriteFileFail = -13,

};

class ITXMediaPreloadCallback {
   public:
    /**
     *  版权音乐开始下载
     */
    virtual void onPreloadStart(const char* musicId, const char* bitrateDefinition) = 0;

    /**
     *  版权音乐下载进度回调
     */
    virtual void onPreloadProgress(const char* musicId, const char* bitrateDefinition, float progress) = 0;

    /**
     *  版权音乐下载完成回调
     */
    virtual void onPreloadComplete(const char* musicId, const char* bitrateDefinition, int errorCode, const char* msg) = 0;

    /**
     * 增加引用计数
     */
    virtual void Addref() = 0;

    /**
     * 减少引用计数
     */
    virtual int Release() = 0;

   protected:
    virtual ~ITXMediaPreloadCallback() = default;
};

class ITXCopyrightedMedia {
   public:
    virtual ~ITXCopyrightedMedia() = default;

    /**
     * 设置 license
     *
     * @param key
     * @param license_url
     */
    virtual void setCopyrightedLicense(const char* key, const char* license_url) = 0;

    /**
     * 生成音乐
     *
     * URI，App客户端，播放时候调用，传给trtc进行播放。与preloadMusic一一对应
     * @param musicId 歌曲Id
     * @param bgmType 0：原唱，1：伴奏  2:  歌词
     * @param bitrateDefinition 码率，传nil为改音频默认码率
     * @param out 用户传入的 buffer，用来存放 genMusicURI 返回的字符串
     * @param out_size 用户 buffer 的大小
     * @return 成功：true 失败：false
     * 由于 ios 的接口样式为 virtual const char* genMusicURI(const
     *     *char*musicId,int bgmType, const char* bitrateDefinition) = 0; 但是 C++
     * 这样是不安全的，因此此接口无法对齐 ios
     */
    virtual bool genMusicURI(const char* musicId, int bgmType, const char* bitrateDefinition, char* out, int out_size) = 0;

    /**
     * 预加载音乐数据。
     *
     * @param musicId 歌曲Id，通过 AME 后台获取
     * @param playToken 播放Token，通过 AME 后台获取
     * @param bitrateDefinition 码率，传nil为音频默认码率，一般格式为：audio/mi:
     * 32,audio/lo: 64,audio/hi: 128
     * @param callback 回调结束后响应对象
     */
    virtual void preloadMusic(const char* musicId, const char* bitrateDefinition, const char* playToken, ITXMediaPreloadCallback* callback) = 0;

    /**
     * 取消预加载音乐数据。
     *
     * @param musicId 歌曲Id，通过 AME 后台获取
     * @param bitrateDefinition 码率，传nil为改音频默认码率
     */
    virtual void cancelPreloadMusic(const char* musicId, const char* bitrateDefinition) = 0;

    /**
     * 检测是否已预加载音乐数据。
     *
     * @param musicId 歌曲Id
     * @param bitrateDefinition 码率，传nil为改音频默认码率
     */
    virtual bool isMusicPreload(const char* musicId, const char* bitrateDefinition) = 0;

    /**
     * 清理音乐缓存
     */
    virtual void clearMusicCache() = 0;

    /**
     * 设置最大歌曲缓存数目，默认100
     *
     * @param maxCount 歌曲最大数目
     */
    virtual void setMusicCacheMaxCount(int maxCount) = 0;

    /**
     * 创建打分对象
     *
     * @param sampleRate    音频采样率
     * @param channel       音频通道数
     * @param playToken     打分歌曲的play token
     * @param noteFilePath  打分所需音高文件路径
     * @param lyricFilePath 打分所需歌词文件路径
     */
    virtual ITXCopyrightedSongScore* createSongScore(int sampleRate, int channel, const char* playToken, const char* noteFilePath, const char* lyricFilePath) = 0;

    /**
     * 销毁打分对象
     */
    virtual void destroySongScore(ITXCopyrightedSongScore** songScore) = 0;
};

/**
 * 歌曲打分相关错误码
 */
enum class TXCopyrightedSongScoreError {

    /// 成功
    TXCopyrightedSongScoreNoError = 0,

    /// K歌打分内部错误
    TXCopyrightedSongScoreErrorInner = -1,

    /// Prepare打分模块失败，具体失败原因在errMsg中描述
    kTXCopyrightedSongScorePrepareFail = -2,

    /// 调用打分相关接口时，如果还没有Prepare或者Prepare失败了，会回调该错误
    kTXCopyrightedSongScoreNotPrepared = -3,

};

/**
 * 音高数据结构
 */
struct ITXCopyrightedSongScoreNoteItem {
    /// 开始时间
    int startTime;

    /// 持续时间
    int duration;

    /// 音高
    int pitch;
};

class ITXCopyrightedSongScoreCallback {
   public:
    /**
     * 输出每句歌词的分数
     *
     * @param currentScore  这一句的分数
     * @param totalScore    目前总分数
     * @param curIndex      歌词索引下表
     */
    virtual void onMIDISCoreUpdate(int currentScore, int totalScore, int curIndex) = 0;

    /**
     * 输出当前实时音高命中。
     *
     * @param isHit         是否命中
     * @param timeStamp     当前时间
     * @param pitch         在note时间范围内的用户音高
     *                     （数值可与note音高对比, -1表示不在note时间范围，大于-1表示用户音高)
     * @param viewValue     用户的实时音高
     */
    virtual void onMIDIGroveAndHint(bool isHit, float timeStamp, float pitch, int viewValue) = 0;

    /**
     * 打分回调结果
     *
     * @param scoreArray    每句歌词的分数集合
     * @param totalScore    总分
     */
    virtual void onMIDIScoreFinish(int* scoreArray, int arrayCount, int totalScore) = 0;

    /**
     * prepare后回调
     *
     * 表明当前打分模块准备就绪，可以执行process等操作
     */
    virtual void onMIDIScorePrepared() = 0;

    /**
     * 打分模块错误回调
     *
     * @param errCode   见{@link TXCopyrightedSongScoreError}
     * @param errMsg    提示信息
     */
    virtual void onMIDIScoreError(TXCopyrightedSongScoreError errCode, const char* errMsg) = 0;

   protected:
    virtual ~ITXCopyrightedSongScoreCallback() = default;
};

class ITXCopyrightedSongScore {
   public:
    virtual ~ITXCopyrightedSongScore() = default;

    /**
     * 设置打分回调接口
     *
     * @param callback 打分接口回调
     */
    virtual void setSongScoreCallback(ITXCopyrightedSongScoreCallback* callback) = 0;

    /**
     * 初始化打分模块。
     *
     * 成功则在{@link onMIDIScorePrepared}中回调，
     * 错误信息在{@link onMIDIScoreError}回调
     */
    virtual void prepare() = 0;

    /**
     * 结束打分
     */
    virtual void finish() = 0;

    /**
     * 处理采集的人声
     *
     * @param pcmData       采集到的人声pcm数据
     * @param length        pcmData的数据大小
     * @param timeStamp     时间戳
     */
    virtual void process(char* pcmData, int length, float timeStamp) = 0;

    /**
     * 升降调
     *
     * @param shiftKey 升降调的值
     * 通常用于升降音调唱歌，比如用户要提高一个半音唱歌，此时shiftKey = 1。
     * 最高12个半音，最低12个半音。（12个半音=1个八度）
     */
    virtual void setKeyShift(int shiftKey) = 0;

    /**
     * 计算总分
     *
     * @return 总分
     */
    virtual int calculateTotalScore() = 0;

    /**
     * 获取所有经过底层调教的Grove数据个数
     *
     * 配合getAllGrove接口使用，先调用该接口获取个数，
     * 然后申请对应大小的Buffer，将申请的Buffer地址传入getAllGrove接口，获取相关数据
     * @return Grove数据个数
     */
    virtual int getGroveCount() = 0;

    /**
     * 获取所有经过底层调教的Grove
     *
     * @param note_item_array 储存Grove的缓存地址，该地址由调用着提供
     * @param array_size 缓存地址的size
     * @return 实际获取到的ScoreNoteItem的个数
     */
    virtual int getAllGrove(ITXCopyrightedSongScoreNoteItem* note_item_array, int array_size) = 0;
};

}  // namespace liteav

#ifdef __cplusplus
extern "C" {
#endif

/**
 * 创建版权音乐实例
 */
COPYRIGHT_API liteav::ITXCopyrightedMedia* CreateCopyRightMedia();

/**
 * 销毁版权音乐实例
 */
COPYRIGHT_API void DestroyCopyRightMedia(liteav::ITXCopyrightedMedia** media);

#ifdef __cplusplus
}
#endif

#endif
