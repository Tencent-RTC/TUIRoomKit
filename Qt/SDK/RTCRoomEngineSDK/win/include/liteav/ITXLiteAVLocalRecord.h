/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   TRTC local recorder
 * Function: For recording local streaming content
 */
#ifndef _ITXLITEAV_LOCAL_RECORD_H_
#define _ITXLITEAV_LOCAL_RECORD_H_

#include "TXLiteAVBase.h"

class ITXLiteAVLocalRecord;

extern "C" {

/**
 * create ITXLiteAVLocalRecord instance
 */
LITEAV_API ITXLiteAVLocalRecord* createLocalRecordInstance();

/**
 * destory ITXLiteAVLocalRecord instance
 */
LITEAV_API void destroyLocalRecordInstance(ITXLiteAVLocalRecord* txliteav_localrecord);
}

/**
 * local record error
 */
enum TXLiteAVLocalRecordError {

    /// start record success
    ERR_RECORD_SUCCESS = 0,

    /// invalid param
    ERR_RECORD_PARAM_INVALID = -1,

    /// record has begin
    ERR_RECORD_HAS_BEGIN = -2,

    /// invalid file path
    ERR_RECORD_FILE_PATH_INVALID = -3,

    /// invalid file path,only support .mp4
    ERR_RECORD_FILE_FORMAT_INVALID = -4,

    /// invalid window id
    ERR_RECORD_WINDOW_ID_INVALID = -5,

    /// invalid desktop id
    ERR_RECORD_DESKTOP_ID_INVALID = -6,

    /// create record file failed
    ERR_CREATE_RECORD_FILE_FAILURE = -7,

    /// record desktop or window fail，eg. windows is closed
    ERR_CREATE_RECORD_CAPTURE_FAILED = -8,

    /// no microphone device
    ERR_RECORD_NO_MICROPHONE_DEVICE = -9,

    /// no speaker device
    ERR_RECORD_NO_SPEAKER_DEVICE = -10,

    /// no record target
    ERR_RECORD_NO_RECORD_TARGET = -11,

    /// record microphone fail
    ERROR_RECORD_MICROPHONE_FAILURE = -12,

    /// record systemaudio fail
    ERROR_RECORD_SYSTEMAUDIO_FAILURE = -13

};

/**
 * record config
 */
struct RecordConfig {
    /// record faile name,must be absoulute path。record file format is given by file externion name. only support mp4. must be filled
    const char* filePath;

    /// max single file size,in Mb,must be filled.when record file size is greater than this value,record content will be save as new file.new file named is old file name append (1)、(2)..，
    int maxSingleFileSize;

    /// record file fps,use capture fps when this value is zero
    int fps;

    /// record width. use capture width when value is zero
    int recordWidth;

    /// record height. use capture width when value is zero
    int recordHeight;

    RecordConfig() : filePath(nullptr), maxSingleFileSize(0), fps(0), recordWidth(0), recordHeight(0) {
    }
};

class TXLiteAVLocalRecordCallback {
   public:
    virtual ~TXLiteAVLocalRecordCallback() {
    }

    /**
     * record started,when record pure audio videoWidth/videoHeight is zero.
     */
    virtual void OnRecordStarted(int videoWidth, int videoHeight, int fps) = 0;

    /**
     * local record error callbak
     */
    virtual void OnRecordError(TXLiteAVLocalRecordError err, const char* msg) = 0;

    /**
     * local record result callback
     */
    virtual void OnRecordComplete(const char* path) = 0;
};

class ITXLiteAVLocalRecord {
   protected:
    virtual ~ITXLiteAVLocalRecord() {
    }

   public:
    /**
     * set local record event callback
     */
    virtual void setCallback(TXLiteAVLocalRecordCallback* callback) = 0;

    /**
     * enum record window list
     */
    virtual liteav::ITRTCScreenCaptureSourceList* getScreenCaptureSources(const SIZE& thumbnailSize, const SIZE& iconSize) = 0;

    /**
     *  start local record
     */
    virtual TXLiteAVLocalRecordError startLocalRecord(const RecordConfig& config, TRTCScreenCaptureSourceType type, TXView sourceId, const RECT& captureRect) = 0;

    /**
     * stop local record
     */
    virtual void stopLocalRecord() = 0;

    /**
     * enable/disable microphone audio record
     */
    virtual void enableRecordMicrophone(bool enable) = 0;

    /**
     * enable/disable system audio record
     */
    virtual void enableRecordSystemAudio(bool enable) = 0;
};

#endif
