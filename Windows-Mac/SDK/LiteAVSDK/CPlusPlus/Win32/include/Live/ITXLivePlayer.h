#ifndef __ITXLIVEPLAYER_H__
#define __ITXLIVEPLAYER_H__
/*
* Module:  ITXLivePlayer @ TXLiteAVSDK
*
* Function: 直播拉流功能的主要接口类
*
* 创建/使用/销毁ITXLivePlayer对象的示例代码：
*
* <pre>
*     ITXLivePlayer *livePlayer = createTXLivePlayer();
*     if(livePlayer)
*     {
*         int nDevice = livePlayer->speakerDeviceCount();
*     }
*     destroyTXLivePlayer(&livePlayer);
*     livePlayer = NULL;
* </pre>
*/
#include "TXLiveTypeDef.h"
#include "TXLiteAVBase.h"
#include <Windows.h>
#include <memory>

#define SPEAKER_DEVICE_NAME_MAX_SIZE    (512)
class ITXLivePlayerCallback;
class ITXLivePlayer;

extern "C" {
    /**
    * \brief 用于动态加载dll时，导出TXLivePlayer C++对象。
    *
    * \return TXLivePlayer对象指针，注意：delete ITXLivePlayer*会编译错误，需要调用destroyTXLivePlayer释放。
    */
    LITEAV_API ITXLivePlayer* createTXLivePlayer();

    /**
    * \brief 析构ITXLivePlayer对象
    */
    LITEAV_API void destroyTXLivePlayer(ITXLivePlayer** pTXlivePlayer);
}


class ITXLivePlayer
{
protected:
    virtual ~ITXLivePlayer() {};

public:
	/**
	* \brief：设置回调 TXLivePlayer 的回调代理，监听播放事件
	* \param：callback  - ITXLivePlayerCallback 类型的代理指针
	* \param：pUserData - 透传用户数据到 ITXLivePusherCallback 的回调函数,一般情况下传 NULL 就可以了
	* \return 无
	*/
    virtual void setCallback(ITXLivePlayerCallback *callback, void *pUserData) = 0;

    /**
    * \brief  查询扬声器设备列表
	* 
	*  示例代码：
	*  <pre>
    *      ITRTCDeviceCollection * pDevice = m_pCloud->getSpeakerDevicesList();
    *      for (int i = 0; i < pDevice->getCount(); i++) {
    *          std::wstring name = UTF82Wide(pDevice->getDeviceName(i));
    *      }
    *      pDevice->release();
    *      pDevice = null;
	*  </pre>
	*
    * \note 如果delete ITRTCDeviceCollection*指针会编译错误，SDK维护ITRTCDeviceCollection对象的生命周期。
    * \return 扬声器管理器对象指针 ITRTCDeviceCollection*
    */
    virtual ILiteAVDeviceCollection* getSpeakerDevicesList() = 0;

    /**
    * \brief：选择指定的扬声器作为音频播放的设备，不调用该接口时，默认选择索引为0的扬声器
    * \param：index - 扬声器设备的索引，要求index值小于 speakerDeviceCount 接口的返回值
    */
    virtual void selectSpeakerDevice(unsigned int index) = 0;

    /**
    * \brief：查询SDK播放的音量，注意查询得到不是系统扬声器的音量大小
    * \return：音量值，范围是[0, 65535]
    */
    virtual unsigned int speakerVolume() = 0;

    /**
    * \brief：设置SDK播放的音量，注意设置的不是系统扬声器的音量大小
    * \param：volume - 设置的音量大小，范围是[0, 65535]
    */
    virtual void setSpeakerVolume(unsigned int volume) = 0;

    /**
    * \brief：查询已选择扬声器的能量值，指示音量的大小
    * \return：能量值，范围是[0, 100]
    */
    virtual uint32_t speakerVolumeIndication() = 0;

    /**
    * \brief: 设置 SDK 采集音量。
    * @param volume 音量大小，取值[0, 65535]，默认值为65535
    */
    virtual void setAudioPlayoutVolume(int volume) = 0;

    /**
    * \brief: 获取 SDK 采集音量
    */
    virtual int getAudioPlayoutVolume() = 0;

	/**
	* \brief：设置视频图像渲染
	* \param：rendHwnd - 承载预览画面的 HWND，目前 SDK 内部会向 rendHwnd (整个窗口)上绘制图像的
	* \return:无
	*/
    virtual void setRenderFrame(HWND rendHwnd) = 0;

	/**
	* \brief：重设图像渲染窗口
	* \param：rendHwnd - 承载预览画面的 HWND，目前 SDK 内部会向 rendHwnd (整个窗口)上绘制图像的
	* \return:无
	*/
    virtual void updateRenderFrame(HWND rendHwnd) = 0;

	/**
	* \brief：关闭图像渲染
	*/
    virtual void closeRenderFrame() = 0;

	/**
	* \brief：开始播放，请在 startPlay 之前 setRenderFrame
    * \param：url   - 视频播放 URL
    * \param：type  - 播放类型，参考 TXLiveTypeDef.h 中定义的 TXEPlayType 枚举值
	* \return：无 
	*/
    virtual void startPlay(const char * url, TXEPlayType type) = 0;

	/**
	* \brief：停止播放
	*/
    virtual void stopPlay() = 0;

	/**
	* \brief：暂停播放
	*/
    virtual void pause() = 0;

	/**
	* \brief：恢复播放
	*/
    virtual void resume() = 0;

	/**
	* \brief：是否正在播放
	*/
    virtual bool isPlaying() = 0;

	/**
	* \brief：静音接口
	* \param：mute - 是否静音
	* \return:无
	*/
    virtual void setMute(bool mute) = 0;

    /**
    * \brief：设置图像的渲染（填充）模式
    * \param：mode - 参考 TXLiveTypeDef.h 中定义的 TXERenderMode 枚举值
    * \return:无
    */
    virtual void setRenderMode(TXERenderMode mode) = 0;

    /**
    * \brief：设置图像的顺时针旋转角度
    * \param：rotation - 参考 TXLiveTypeDef.h 中定义的 TXEVideoRotationType 枚举值
    * \return:无
    */
    virtual void setRotation(TXEVideoRotationType rotation) = 0;

	/**
	* \brief：设置渲染的镜像效果
	* \param：mirror - true表示画面左右反转，false表示保持原样
	* \return：无
	*/
    virtual void setRenderYMirror(bool mirror) = 0;

    /**
    * \brief：设置视频编码格式，默认格式是TXE_OUTPUT_VIDEO_WITHOUT_OUTPUT
    * \param：format - 视频编码格式，参考 TXLiveTypeDef.h 中定义的 TXEOutputVideoFormat 枚举值
    * \return：无
    * \note：自定义渲染必须设置输出格式。
    */
    virtual void setOutputVideoFormat(TXEOutputVideoFormat format) = 0;

    /**
    * \brief：是否开启消息通道， 默认值为 false
    * \param：enableMessage - true：开启，false：关闭
    */
    /// 
    virtual void setEnableMessage(bool enableMessage) = 0;

	/**
	* \brief：截图当前拉流的图像到本地，
	* \param：filePath - 存储路径，UTF-8编码。
	* \param: length - 路径大小
	* \return：0成功，非0失败
	* \errorRet:  -1:失败，-2路径非法，-3文件存在，-4未拉流
	*/
    virtual int captureVideoSnapShot(const wchar_t * filePath, unsigned int length) = 0;

    /**
    * \brief：设置播放选项
	* 
	* 缓冲区时长是较为常用的设置项，播放缓冲区的作用是为了抵抗网络波动导致的音视频卡顿。
	* 缓冲区时长越大，视频播放的卡顿率越低，观众跟主播之间的时延也就越高。
	* 缓冲区时长越小，视频播放的卡顿率越高，观众跟主播之间的时延也就越低。
	*
	* \note 缓冲区时长不等于观众跟主播之间的时延，一般而言，时延要比缓冲区时长大1-2秒，这取决于 CDN 的质量。
	*       如果主播采用的是 OBS 等直播软件，那么时延还会更高一些，因为 OBS 本身会有1秒以上的推流时延。
	*
    * \param：jsonParam - 属性信息，UTF-8编码。
	*
    * <pre>
    *    1. AutoAdjustCacheTime | bool  | 设置是否自动调整缓存时间, 默认值:true。
    *        - true：启用自动调整，SDK 将根据网络状况在一个范围内调整缓冲区时长，网络越好，缓冲越短，时延越小，调整范围为：[MinAutoAdjustCacheTime - MaxAutoAdjustCacheTime]。
    *        - false：关闭自动调整，SDK 将固定使用默认的播放缓冲区时长，也就是 “CacheTime” 所设置的值。
    *    
    *    2. CacheTime | float | 默认的播放缓存时长，单位秒，取值需要大于0.2，默认值：5。
    *    
    *    3. MaxAutoAdjustCacheTime | float | 播放器最大缓冲时间，单位秒，取值需要大于0.2，默认值：5，含义：播放器的最大播放延迟大约为 5+1=6 秒（CDN会引入约1秒延迟）。
    *
    *    4. MinAutoAdjustCacheTime | float | 播放器最小缓冲时间，单位秒，取值需要大于0.2，默认值：1，含义：播放器的最小播放延迟大约为 1+1=2 秒（CDN会引入约1秒延迟）。
    *
    *    5. VideoBlockThreshold | int | 播放器视频卡顿报警阈值，单位毫秒，默认值为800毫秒，含义：视频卡顿超过 800 毫秒，ITXLivePlayerCallback 会通知 PLAY_WARNING_VIDEO_PLAY_LAG。
    *
    *    6. ConnectRetryCount | int | 拉流网络断开重连次数，默认值为3。
    *
    *    7. ConnectRetryInterval | int | 拉流网络断开重连时间间隔，单位秒，默认值为3。
    *
	* 示例:
	*    setLivePlayAttribute("{\"AutoAdjustCacheTime\":true, \"MinAutoAdjustCacheTime\": 2.0, \"MaxAutoAdjustCacheTime\": 5.0}");
	* 含义：
	*    设置播放缓冲区根据网络自动调整，调整范围为2-5秒，观众与主播之间的延迟约为3-6秒（如果主播使用 OBS 推流则为4-7秒），网络越差，延迟越大。
    * </pre>
    */
    virtual void setLivePlayAttribute(const char *jsonParam) = 0;
};
#endif //__ITXLIVEPLAYER_H__