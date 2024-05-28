/**
 * Copyright (c) 2021 Tencent. All rights reserved.
 * Module:   V2TXLiveCode @ TXLiteAVSDK
 * Function: Definitions of error codes and warning codes of Tencent Cloud LVB
 */
#ifndef MODULE_CPP_V2TXLIVECODE_H_
#define MODULE_CPP_V2TXLIVECODE_H_

namespace liteav {

/////////////////////////////////////////////////////////////////////////////////
//
//                   V2 Error codes and warning codes
//
/////////////////////////////////////////////////////////////////////////////////

/**
 * V2 Error codes and warning codes
 */
enum V2TXLiveCode {

    /// No error.
    V2TXLIVE_OK = 0,

    /// Unclassified error.
    V2TXLIVE_ERROR_FAILED = -1,

    /// An invalid parameter was input during the API call.
    V2TXLIVE_ERROR_INVALID_PARAMETER = -2,

    /// The API call was rejected.
    V2TXLIVE_ERROR_REFUSED = -3,

    /// The API is currently not suppoted.
    V2TXLIVE_ERROR_NOT_SUPPORTED = -4,

    /// Failed to call the API because the license was invalid.
    V2TXLIVE_ERROR_INVALID_LICENSE = -5,

    /// The server request timed out.
    V2TXLIVE_ERROR_REQUEST_TIMEOUT = -6,

    /// The server cannot process the request.
    V2TXLIVE_ERROR_SERVER_PROCESS_FAILED = -7,

    /// Disconnect.
    V2TXLIVE_ERROR_DISCONNECTED = -8,

    /// could not find available hevc decoder.
    V2TXLIVE_ERROR_NO_AVAILABLE_HEVC_DECODERS = -2304,

    /////////////////////////////////////////////////////////////////////////////////
    //
    //      Network warning codes
    //
    /////////////////////////////////////////////////////////////////////////////////

    /// Data upload was jammed because the upstream bandwidth was too low.
    V2TXLIVE_WARNING_NETWORK_BUSY = 1101,

    /// Blocking occurred during video playback.
    V2TXLIVE_WARNING_VIDEO_BLOCK = 2105,

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             Camera-related warning codes
    //
    /////////////////////////////////////////////////////////////////////////////////

    /// Failed to start the camera.
    V2TXLIVE_WARNING_CAMERA_START_FAILED = -1301,

    /// The camera is being occupied.
    V2TXLIVE_WARNING_CAMERA_OCCUPIED = -1316,

    /// The camera is not authorized. This warning usually occurs on mobile devices due to the camera permission is denied by the user.
    V2TXLIVE_WARNING_CAMERA_NO_PERMISSION = -1314,

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             Mic-related warning codes
    //
    /////////////////////////////////////////////////////////////////////////////////

    /// Failed to enable the mic.
    V2TXLIVE_WARNING_MICROPHONE_START_FAILED = -1302,

    /// The mic is being used. If a call is in progress on the mobile device, the mic cannot be enabled.
    V2TXLIVE_WARNING_MICROPHONE_OCCUPIED = -1319,

    /// The mic is not authorized. This warning usually occurs on mobile devices due to the mic permission is denied by the user.
    V2TXLIVE_WARNING_MICROPHONE_NO_PERMISSION = -1317,

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             ScreenCapture-related warning codes
    //
    /////////////////////////////////////////////////////////////////////////////////

    /// Screen capture is not supported in curent system.
    V2TXLIVE_WARNING_SCREEN_CAPTURE_NOT_SUPPORTED = -1309,

    /// Failed to enable the screen capture.
    V2TXLIVE_WARNING_SCREEN_CAPTURE_START_FAILED = -1308,

    /// Screen capture is interrupted by system.
    V2TXLIVE_WARNING_SCREEN_CAPTURE_INTERRUPTED = -7001,

    /////////////////////////////////////////////////////////////////////////////////
    //
    //             Codec-related warning codes
    //
    /////////////////////////////////////////////////////////////////////////////////

    /// The codec changed. The additional field `codec_type` in `onWarning` indicates the codec currently in use.
    /// `1` indicates H.265, and `0` indicates H.264. This field is not supported on Windows.
    V2TXLIVE_WARNING_CURRENT_ENCODE_TYPE_CHANGED = 1104,

    /// The codec changed. The additional field `codec_type` in `onWarning` indicates the codec currently in use.
    /// `1` indicates H.265, and `0` indicates H.264. This field is not supported on Windows.
    V2TXLIVE_WARNING_CURRENT_DECODE_TYPE_CHANGED = 2008,

};
}  // namespace liteav
#endif
