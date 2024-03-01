/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TRTC 本地录制模块
 * Function: 用于对本地推流内容的录制
 */
#ifndef _ITXLITEAV_LOCAL_RECORD_H_
#define _ITXLITEAV_LOCAL_RECORD_H_

#include "TXLiteAVBase.h"

class ITXLiteAVLocalRecord;

extern "C" {

/**
 * 创建 ITXLiteAVLocalRecord 对象
 */
LITEAV_API ITXLiteAVLocalRecord* createLocalRecordInstance();

/**
 * 销毁 ITXLiteAVLocalRecord 对象
 */
LITEAV_API void destroyLocalRecordInstance(ITXLiteAVLocalRecord* txliteav_localrecord);
}

/**
 * 本地录制错误码
 */
enum TXLiteAVLocalRecordError {

    ///启动录制成功
    ERR_RECORD_SUCCESS = 0,

    ///非法参数
    ERR_RECORD_PARAM_INVALID = -1,

    ///录制已经开始
    ERR_RECORD_HAS_BEGIN = -2,

    ///非法的文件路径
    ERR_RECORD_FILE_PATH_INVALID = -3,

    ///非法文件格式,目前只支持mp4格式
    ERR_RECORD_FILE_FORMAT_INVALID = -4,

    ///非法窗口ID
    ERR_RECORD_WINDOW_ID_INVALID = -5,

    ///非法桌面ID
    ERR_RECORD_DESKTOP_ID_INVALID = -6,

    ///录制文件创建失败
    ERR_CREATE_RECORD_FILE_FAILURE = -7,

    ///桌面或者窗口录制失败，例如录制中窗口被关闭
    ERR_CREATE_RECORD_CAPTURE_FAILED = -8,

    ///没有麦克风
    ERR_RECORD_NO_MICROPHONE_DEVICE = -9,

    ///没有扬声器
    ERR_RECORD_NO_SPEAKER_DEVICE = -10,

    ///没有录制目标
    ERR_RECORD_NO_RECORD_TARGET = -11,

    ///录制麦克风声音失败
    ERROR_RECORD_MICROPHONE_FAILURE = -12,

    ///录制系统声音失败
    ERROR_RECORD_SYSTEMAUDIO_FAILURE = -13

};

/**
 * 录制配置
 */
struct RecordConfig {
    ///保存录制的文件名，必须要是包含扩展名的全路径。录制文件格式通过扩展名给出。支持mp4、wav、aac、pcm格式。为必填字段
    const char* filePath;

    ///最大单个录制文件大小，单位为兆。必填字段。录制文件超过该大小后，录制会被保存为新文件。新文件的命名方式为原来文件名后加上(1)、(2)..，以此类推
    int maxSingleFileSize;

    ///录制文件的fps，为0时候使用采集帧率
    int fps;

    ///录制宽度,为0时候使用源宽度
    int recordWidth;

    ///录制高度，为0时候使用源高度
    int recordHeight;

    RecordConfig() : filePath(nullptr), maxSingleFileSize(0), fps(0), recordWidth(0), recordHeight(0) {
    }
};

class TXLiteAVLocalRecordCallback {
   public:
    virtual ~TXLiteAVLocalRecordCallback() {
    }

    /**
     * 本地录制开始,当录制纯音频时候videoWidth/videoHeight为0
     */
    virtual void OnRecordStarted(int videoWidth, int videoHeight, int fps) = 0;

    /**
     * 本地录制错误回调，发生错误的时候会停止录制，并保证之前录制文件的完整性
     */
    virtual void OnRecordError(TXLiteAVLocalRecordError err, const char* msg) = 0;

    /**
     * 本地录制结果回调。停止录制后和录制文件超出指定大小后有该回调
     */
    virtual void OnRecordComplete(const char* path) = 0;
};

class ITXLiteAVLocalRecord {
   protected:
    virtual ~ITXLiteAVLocalRecord() {
    }

   public:
    /**
     * 设置本地录制回调事件接口
     */
    virtual void setCallback(TXLiteAVLocalRecordCallback* callback) = 0;

    /**
     * 获取可以录制的窗口列表
     */
    virtual liteav::ITRTCScreenCaptureSourceList* getScreenCaptureSources(const SIZE& thumbnailSize, const SIZE& iconSize) = 0;

    /**
     * 开始本地录制
     */
    virtual TXLiteAVLocalRecordError startLocalRecord(const RecordConfig& config, TRTCScreenCaptureSourceType type, TXView sourceId, const RECT& captureRect) = 0;

    /**
     * 停止本地录制
     */
    virtual void stopLocalRecord() = 0;

    /**
     * 开启/关闭麦克风声音的录制
     */
    virtual void enableRecordMicrophone(bool enable) = 0;

    /**
     * 开启/关闭系统混音的录制
     */
    virtual void enableRecordSystemAudio(bool enable) = 0;
};

#endif
