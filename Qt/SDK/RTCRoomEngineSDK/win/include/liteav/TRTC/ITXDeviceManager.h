/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module: audio/video device management module
 * Description: manages audio/video devices such as camera, mic, and speaker.
 */
#ifndef __ITXDEVICEMANAGER_H__
#define __ITXDEVICEMANAGER_H__

#include <stdint.h>
#ifdef __APPLE__
#include <TargetConditionals.h>
#endif

namespace liteav {
class ITRTCVideoRenderCallback;

/////////////////////////////////////////////////////////////////////////////////
//
//                    Type definitions of audio/video devices
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * System volume type (for mobile devices only)
 * @deprecated This API is not recommended after v9.5.
 * Smartphones usually have two types of system volume: call volume and media volume.
 * - Call volume is designed for call scenarios. It comes with acoustic echo cancellation (AEC) and supports audio capturing by Bluetooth earphones, but its sound quality is average.
 *            If you cannot turn the volume down to 0 (i.e., mute the phone) using the volume buttons, then your phone is using call volume.
 * - Media volume is designed for media scenarios such as music playback. AEC does not work when media volume is used, and Bluetooth earphones cannot be used for audio capturing. However, media volume delivers better music listening experience.
 *            If you are able to mute your phone using the volume buttons, then your phone is using media volume.
 * The SDK offers three system volume control modes: auto, call volume, and media volume.
 * System volume type
 */
enum TXSystemVolumeType {

    /// Auto
    TXSystemVolumeTypeAuto = 0,

    /// Media volume
    TXSystemVolumeTypeMedia = 1,

    /// Call volume
    TXSystemVolumeTypeVOIP = 2,

};

/**
 * Audio route (the route via which audio is played)
 *
 * Audio route is the route (speaker or receiver) via which audio is played. It applies only to mobile devices such as mobile phones.
 * A mobile phone has two speakers: one at the top (receiver) and the other the bottom.
 * - If the audio route is set to the receiver, the volume is relatively low, and audio can be heard only when the phone is put near the ear. This mode has a high level of privacy and is suitable for answering calls.
 * - If the audio route is set to the speaker, the volume is relatively high, and there is no need to put the phone near the ear. This mode enables the "hands-free" feature.
 */
enum TXAudioRoute {

    /// Speakerphone: the speaker at the bottom is used for playback (hands-free). With relatively high volume, it is used to play music out loud.
    TXAudioRouteSpeakerphone = 0,

    /// Earpiece: the receiver at the top is used for playback. With relatively low volume, it is suitable for call scenarios that require privacy.
    TXAudioRouteEarpiece = 1,

};

/**
 * Device type (for desktop OS)
 *
 * This enumerated type defines three types of audio/video devices, namely camera, mic and speaker, so that you can use the same device management API to manage three types of devices.
 */
enum TXMediaDeviceType {

    /// undefined device type
    TXMediaDeviceTypeUnknown = -1,

    /// microphone
    TXMediaDeviceTypeMic = 0,

    /// speaker or earpiece
    TXMediaDeviceTypeSpeaker = 1,

    /// camera
    TXMediaDeviceTypeCamera = 2,

};

/**
 * Device operation
 *
 * This enumerated value is used to notify the status change of the local device {@link onDeviceChanged}.
 */
enum TXMediaDeviceState {

    /// The device has been plugged in
    TXMediaDeviceStateAdd = 0,

    /// The device has been removed
    TXMediaDeviceStateRemove = 1,

    /// The device has been enabled
    TXMediaDeviceStateActive = 2,

    /// system default device changed
    TXMediaDefaultDeviceChanged = 3,

};

/**
 * Camera acquisition preferences
 *
 * This enum is used to set camera acquisition parameters.
 */
enum TXCameraCaptureMode {

    /// Auto adjustment of camera capture parameters.
    /// SDK selects the appropriate camera output parameters according to the actual acquisition device performance and network situation, and maintains a balance between device performance and video preview quality.
    TXCameraResolutionStrategyAuto = 0,

    /// Give priority to equipment performance.
    /// SDK selects the closest camera output parameters according to the user's encoder resolution and frame rate, so as to ensure the performance of the device.
    TXCameraResolutionStrategyPerformance = 1,

    /// Give priority to the quality of video preview.
    /// SDK selects higher camera output parameters to improve the quality of preview video. In this case, it will consume more CPU and memory to do video preprocessing.
    TXCameraResolutionStrategyHighQuality = 2,

    /// Allows the user to set the width and height of the video captured by the local camera.
    TXCameraCaptureManual = 3,

};

/**
 * Camera acquisition parameters
 *
 * This setting determines the quality of the local preview image.
 */
struct TXCameraCaptureParam {
    /// Field description: camera acquisition preferences,please see {@link TXCameraCaptureMode}
    TXCameraCaptureMode mode;

    /// Field description: width of acquired image
    int width;

    /// Field description:  height of acquired image
    int height;

    TXCameraCaptureParam() : mode(TXCameraResolutionStrategyAuto), width(640), height(360) {
    }
};

/**
 * Audio/Video device information (for desktop OS)
 *
 * This structure describes key information (such as device ID and device name) of an audio/video device, so that users can choose on the UI the device to use.
 */
class ITXDeviceInfo {
   protected:
    virtual ~ITXDeviceInfo() {
    }

   public:
    virtual void release() = 0;

    /// device id (UTF-8)
    virtual const char* getDevicePID() = 0;

    /// device name (UTF-8)
    virtual const char* getDeviceName() = 0;
};

/**
 * Device information list (for desktop OS)
 *
 * This structure functions as std::vector<ITXDeviceInfo> does. It solves the binary compatibility issue between different versions of STL containers.
 */
class ITXDeviceCollection {
   protected:
    virtual ~ITXDeviceCollection() {
    }

   public:
    /// Size of this list. return Size of this list.
    virtual uint32_t getCount() = 0;

    /// device name (UTF-8), index value in [0,getCount),return device name (UTF-8)
    virtual const char* getDeviceName(uint32_t index) = 0;

    /// device PID (UTF-8) param index value in [0,getCount),return device PID (UTF-8)
    virtual const char* getDevicePID(uint32_t index) = 0;

    /// device properties (json format)
    ///@note
    ///  - examples: {"SupportedResolution":[{"width":640,"height":480},{"width":320,"height":240}]}
    /// param index value in [0,getCount),return device properties formatted by json
    virtual const char* getDeviceProperties(uint32_t index) = 0;

    /// release function, don't use delete!!!
    virtual void release() = 0;
};

#if (__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE) || _WIN32 || (!__ANDROID__ && __linux__)
class ITXDeviceObserver {
   public:
    virtual ~ITXDeviceObserver() {
    }

    /**
     * The status of a local device changed (for desktop OS only)
     *
     * The SDK returns this callback when a local device (camera, mic, or speaker) is connected or disconnected.
     * @param deviceId Device ID
     * @param type Device type
     * @param state Device status. `0`: connected; `1`: disconnected; `2`: started
     */
    virtual void onDeviceChanged(const char* deviceId, TXMediaDeviceType type, TXMediaDeviceState state) {
    }
};
#endif

class ITXDeviceManager {
   protected:
    ITXDeviceManager() {
    }
    virtual ~ITXDeviceManager() {
    }

   public:
/////////////////////////////////////////////////////////////////////////////////
//
//                    Device APIs
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * 1.1 Querying whether the front camera is being used
 */
#if __ANDROID__ || (__APPLE__ && TARGET_OS_IOS)
    virtual bool isFrontCamera() = 0;

    /**
     * 1.2 Switching to the front/rear camera (for mobile OS)
     */
    virtual int switchCamera(bool frontCamera) = 0;

    /**
     * 1.3 Getting the maximum zoom ratio of the camera (for mobile OS)
     */
    virtual float getCameraZoomMaxRatio() = 0;

    /**
     * 1.4 Setting the camera zoom ratio (for mobile OS)
     *
     * @param zoomRatio Value range: 1-5. 1 indicates the widest angle of view (original), and 5 the narrowest angle of view (zoomed in).The maximum value is recommended to be 5. If the value exceeds 5, the video will become blurred.
     */
    virtual int setCameraZoomRatio(float zoomRatio) = 0;

    /**
     * 1.5 Querying whether automatic face detection is supported (for mobile OS)
     */
    virtual bool isAutoFocusEnabled() = 0;

    /**
     * 1.6 Enabling auto focus (for mobile OS)
     *
     * After auto focus is enabled, the camera will automatically detect and always focus on faces.
     */
    virtual int enableCameraAutoFocus(bool enabled) = 0;

    /**
     * 1.7 Adjusting the focus (for mobile OS)
     *
     * This API can be used to achieve the following:
     * 1. A user can tap on the camera preview.
     * 2. A rectangle will appear where the user taps, indicating the spot the camera will focus on.
     * 3. The user passes the coordinates of the spot to the SDK using this API, and the SDK will instruct the camera to focus as required.
     * @param position The spot to focus on. Pass in the coordinates of the spot you want to focus on.
     * @return 0: operation successful; negative number: operation failed.
     * @note Before using this API, you must first disable auto focus using {@link enableCameraAutoFocus}.
     */
    virtual int setCameraFocusPosition(float x, float y) = 0;

    /**
     * 1.8 Enabling/Disabling flash, i.e., the torch mode (for mobile OS)
     */
    virtual int enableCameraTorch(bool enabled) = 0;

    /**
     * 1.9 Setting the audio route (for mobile OS)
     *
     * A mobile phone has two audio playback devices: the receiver at the top and the speaker at the bottom.
     * If the audio route is set to the receiver, the volume is relatively low, and audio can be heard only when the phone is put near the ear. This mode has a high level of privacy and is suitable for answering calls.
     * If the audio route is set to the speaker, the volume is relatively high, and there is no need to put the phone near the ear. This mode enables the "hands-free" feature.
     */
    virtual int setAudioRoute(TXAudioRoute route) = 0;
#endif

/**
 * 2.1 Getting the device list (for desktop OS)
 *
 * @param type  Device type. Set it to the type of device you want to get. For details, please see the definition of `TXMediaDeviceType`.
 * @note
 *   - To ensure that the SDK can manage the lifecycle of the `ITXDeviceCollection` object, after using this API, please call the `release` method to release the resources.
 *   - Do not use `delete` to release the Collection object returned as deleting the ITXDeviceCollection* pointer will cause crash.
 *   - The valid values of `type` are `TXMediaDeviceTypeMic`, `TXMediaDeviceTypeSpeaker`, and `TXMediaDeviceTypeCamera`.
 *   - This API can be used only on macOS and Windows.
 */
#if (__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE) || _WIN32 || (!__ANDROID__ && __linux__)
    virtual ITXDeviceCollection* getDevicesList(TXMediaDeviceType type) = 0;

    /**
     * 2.2 Setting the device to use (for desktop OS)
     *
     * @param type Device type. For details, please see the definition of `TXMediaDeviceType`.
     * @param deviceId Device ID. You can get the ID of a device using the {@link getDevicesList} API.
     * @return 0: operation successful; negative number: operation failed.
     */
    virtual int setCurrentDevice(TXMediaDeviceType type, const char* deviceId) = 0;

    /**
     * 2.3 Getting the device currently in use (for desktop OS)
     */
    virtual ITXDeviceInfo* getCurrentDevice(TXMediaDeviceType type) = 0;

    /**
     * 2.4 Setting the volume of the current device (for desktop OS)
     *
     * This API is used to set the capturing volume of the mic or playback volume of the speaker, but not the volume of the camera.
     * @param volume Volume. Value range: 0-100; default: 100
     */
    virtual int setCurrentDeviceVolume(TXMediaDeviceType type, uint32_t volume) = 0;

    /**
     * 2.5 Getting the volume of the current device (for desktop OS)
     *
     * This API is used to get the capturing volume of the mic or playback volume of the speaker, but not the volume of the camera.
     */
    virtual uint32_t getCurrentDeviceVolume(TXMediaDeviceType type) = 0;

    /**
     * 2.6 Muting the current device (for desktop OS)
     *
     * This API is used to mute the mic or speaker, but not the camera.
     */
    virtual int setCurrentDeviceMute(TXMediaDeviceType type, bool mute) = 0;

    /**
     * 2.7 Querying whether the current device is muted (for desktop OS)
     *
     * This API is used to query whether the mic or speaker is muted. Camera muting is not supported.
     */
    virtual bool getCurrentDeviceMute(TXMediaDeviceType type) = 0;

    /**
     * 2.8 Set the audio device used by SDK to follow the system default device (for desktop OS)
     *
     * This API is used to set the microphone and speaker types. Camera following the system default device is not supported.
     * @param type Device type. For details, please see the definition of `TXMediaDeviceType`.
     * @param enable Whether to follow the system default audio device.
     *         - true: following. When the default audio device of the system is changed or new audio device is plugged in, the SDK immediately switches the audio device.
     *         - false：not following. When the default audio device of the system is changed or new audio device is plugged in, the SDK doesn't switch the audio device.
     */
    virtual int enableFollowingDefaultAudioDevice(TXMediaDeviceType type, bool enable) = 0;

    /**
     * 2.9 Starting camera testing (for desktop OS)
     *
     * @note You can use the {@link setCurrentDevice} API to switch between cameras during testing.
     */
    virtual int startCameraDeviceTest(void* view) = 0;

    /**
     * 2.10 Ending camera testing (for desktop OS)
     */
    virtual int stopCameraDeviceTest() = 0;

    /**
     * 2.11 Starting mic testing (for desktop OS)
     *
     * This API is used to test whether the mic functions properly. The mic volume detected (value range: 0-100) is returned via a callback.
     * @param interval Interval of volume callbacks
     * @note When this interface is called, the sound recorded by the microphone will be played back to the speakers by default.
     */
    virtual int startMicDeviceTest(uint32_t interval) = 0;

    /**
     * 2.12 Starting mic testing (for desktop OS)
     *
     * This API is used to test whether the mic functions properly. The mic volume detected (value range: 0-100) is returned via a callback.
     * @param interval Interval of volume callbacks
     * @param playback Whether to play back the microphone sound. The user will hear his own sound when testing the microphone if `playback` is true.
     */
    virtual int startMicDeviceTest(uint32_t interval, bool playback) = 0;

    /**
     * 2.13 Ending mic testing (for desktop OS)
     */
    virtual int stopMicDeviceTest() = 0;

    /**
     * 2.14 Starting speaker testing (for desktop OS)
     *
     * This API is used to test whether the audio playback device functions properly by playing a specified audio file. If users can hear audio during testing, the device functions properly.
     * @param filePath Path of the audio file
     */
    virtual int startSpeakerDeviceTest(const char* filePath) = 0;

    /**
     * 2.15 Ending speaker testing (for desktop OS)
     */
    virtual int stopSpeakerDeviceTest() = 0;

    /**
     * 2.16 Starting camera testing (for desktop OS)
     *
     * This API supports custom rendering, meaning that you can use the callback API `ITRTCVideoRenderCallback` to get the images captured by the camera for custom rendering.
     */
    virtual int startCameraDeviceTest(ITRTCVideoRenderCallback* callback) = 0;
#endif

/**
 * 2.18 Setting the volume of the current process in the volume mixer (for Windows)
 */
#ifdef _WIN32
    virtual int setApplicationPlayVolume(int volume) = 0;
#endif

/**
 * 2.19 Getting the volume of the current process in the volume mixer (for Windows)
 */
#ifdef _WIN32
    virtual int getApplicationPlayVolume() = 0;
#endif

/**
 * 2.20 Muting the current process in the volume mixer (for Windows)
 */
#ifdef _WIN32
    virtual int setApplicationMuteState(bool bMute) = 0;
#endif

/**
 * 2.21 Querying whether the current process is muted in the volume mixer (for Windows)
 */
#ifdef _WIN32
    virtual bool getApplicationMuteState() = 0;
#endif

/**
 * 2.22 Set camera acquisition preferences
 */
#ifdef _WIN32
    virtual void setCameraCapturerParam(const TXCameraCaptureParam& params) = 0;
#endif

/**
 * 2.23 set onDeviceChanged callback
 */
#if (__APPLE__ && TARGET_OS_MAC && !TARGET_OS_IPHONE) || _WIN32 || (!__ANDROID__ && __linux__)
    virtual void setDeviceObserver(ITXDeviceObserver* observer) = 0;
#endif

/////////////////////////////////////////////////////////////////////////////////
//
//                    Disused APIs (the corresponding new APIs are recommended)
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * Setting the system volume type (for mobile OS)
 *
 * @deprecated This API is not recommended after v9.5. Please use the `startLocalAudio(quality)` API in `TRTCCloud` instead, which param `quality` is used to decide audio quality.
 */
#if __ANDROID__ || (__APPLE__ && TARGET_OS_IOS)
    virtual int setSystemVolumeType(TXSystemVolumeType type) = 0;
#endif
};
}  // namespace liteav

#ifdef _WIN32
using namespace liteav;
#endif

#endif
