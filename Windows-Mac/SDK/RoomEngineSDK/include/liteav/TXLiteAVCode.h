#ifndef __TXLITEAVCODE_H__
#define __TXLITEAVCODE_H__

/**
 * 错误码
 */
enum TXLiteAVError {

    /////////////////////////////////////////////////////////////////////////////////
    //       基础错误码
    /////////////////////////////////////////////////////////////////////////////////

    ///无错误
    ERR_NULL = 0,

    ///暂未归类的通用错误
    ERR_FAILED = -1,

    ///调用 API 时，传入的参数不合法
    ERR_INVALID_PARAMETER = -2,

    /// API 调用被拒绝
    ERR_REFUSED = -3,

    ///当前 API 不支持调用
    ERR_NOT_SUPPORTED = -4,

    /// license 不合法，调用失败
    ERR_INVALID_LICENSE = -5,

    ///请求服务器超时
    ERR_REQUEST_SERVER_TIMEOUT = -6,

    ///服务器无法处理您的请求
    ERR_SERVER_PROCESS_FAILED = -7,

    ///断开连接
    ERR_DISCONNECTED = -8,

    /////////////////////////////////////////////////////////////////////////////////
    //       视频相关错误码
    /////////////////////////////////////////////////////////////////////////////////

    ///打开摄像头失败，例如在 Windows 或 Mac 设备，摄像头的配置程序（驱动程序）异常，禁用后重新启用设备，或者重启机器，或者更新配置程序
    ERR_CAMERA_START_FAIL = -1301,

    ///摄像头设备未授权，通常在移动设备出现，可能是权限被用户拒绝了
    ERR_CAMERA_NOT_AUTHORIZED = -1314,

    ///摄像头参数设置出错（参数不支持或其它）
    ERR_CAMERA_SET_PARAM_FAIL = -1315,

    ///摄像头正在被占用中，可尝试打开其他摄像头
    ERR_CAMERA_OCCUPY = -1316,

    ///开始录屏失败，如果在移动设备出现，可能是权限被用户拒绝了，如果在 Windows 或 Mac 系统的设备出现，请检查录屏接口的参数是否符合要求
    ERR_SCREEN_CAPTURE_START_FAIL = -1308,

    ///录屏失败，在 Android 平台，需要5.0以上的系统，在 iOS 平台，需要11.0以上的系统
    ERR_SCREEN_CAPTURE_UNSURPORT = -1309,

    ///录屏被系统中止
    ERR_SCREEN_CAPTURE_STOPPED = -7001,

    ///没有权限上行辅路
    ERR_SCREEN_SHARE_NOT_AUTHORIZED = -102015,

    ///其他用户正在上行辅路
    ERR_SCREEN_SHRAE_OCCUPIED_BY_OTHER = -102016,

    ///视频帧编码失败，例如 iOS 设备切换到其他应用时，硬编码器可能被系统释放，再切换回来时，硬编码器重启前，可能会抛出
    ERR_VIDEO_ENCODE_FAIL = -1303,

    ///不支持的视频分辨率
    ERR_UNSUPPORTED_RESOLUTION = -1305,

    ///自定视频采集：设置的 pixel format 不支持
    ERR_PIXEL_FORMAT_UNSUPPORTED = -1327,

    ///自定视频采集：设置的 buffer type 不支持
    ERR_BUFFER_TYPE_UNSUPPORTED = -1328,

    ///找不到可用的 HEVC 解码器
    ERR_NO_AVAILABLE_HEVC_DECODERS = -2304,

    /////////////////////////////////////////////////////////////////////////////////
    //       音频相关错误码
    /////////////////////////////////////////////////////////////////////////////////

    ///打开麦克风失败，例如在 Windows 或 Mac 设备，麦克风的配置程序（驱动程序）异常，禁用后重新启用设备，或者重启机器，或者更新配置程序
    ERR_MIC_START_FAIL = -1302,

    ///麦克风设备未授权，通常在移动设备出现，可能是权限被用户拒绝了
    ERR_MIC_NOT_AUTHORIZED = -1317,

    ///麦克风设置参数失败
    ERR_MIC_SET_PARAM_FAIL = -1318,

    ///麦克风正在被占用中，例如移动设备正在通话时，打开麦克风会失败
    ERR_MIC_OCCUPY = -1319,

    ///停止麦克风失败
    ERR_MIC_STOP_FAIL = -1320,

    ///打开扬声器失败，例如在 Windows 或 Mac 设备，扬声器的配置程序（驱动程序）异常，禁用后重新启用设备，或者重启机器，或者更新配置程序
    ERR_SPEAKER_START_FAIL = -1321,

    ///扬声器设置参数失败
    ERR_SPEAKER_SET_PARAM_FAIL = -1322,

    ///停止扬声器失败
    ERR_SPEAKER_STOP_FAIL = -1323,

    ///开启系统声音录制失败，例如音频驱动插件不可用
    ERR_AUDIO_PLUGIN_START_FAIL = -1330,

    ///安装音频驱动插件未授权
    ERR_AUDIO_PLUGIN_INSTALL_NOT_AUTHORIZED = -1331,

    ///安装音频驱动插件失败
    ERR_AUDIO_PLUGIN_INSTALL_FAILED = -1332,

    ///安装虚拟声卡插件成功，但首次安装后功能暂时不可用，此为 Mac 系统限制，请在收到此错误码后提示用户重启当前 APP
    ERR_AUDIO_PLUGIN_INSTALLED_BUT_NEED_RESTART = -1333,

    ///音频帧编码失败，例如传入自定义音频数据，SDK 无法处理
    ERR_AUDIO_ENCODE_FAIL = -1304,

    ///不支持的音频采样率
    ERR_UNSUPPORTED_SAMPLERATE = -1306,

    /////////////////////////////////////////////////////////////////////////////////
    //       网络相关错误码
    /////////////////////////////////////////////////////////////////////////////////

    ///进入房间失败，请查看 onError 中的 -3301 对应的 msg 提示确认失败原因
    ERR_TRTC_ENTER_ROOM_FAILED = -3301,

    ///请求 IP 和 sig 超时，请检查网络是否正常，或网络防火墙是否放行 UDP。
    ///可尝试访问下列 IP：162.14.22.165:8000 162.14.6.105:8000 和域名：default-query.trtc.tencent-cloud.com:8000
    ERR_TRTC_REQUEST_IP_TIMEOUT = -3307,

    ///请求进房超时，请检查是否断网或者是否开启vpn，您也可以切换4G进行测试确认
    ERR_TRTC_CONNECT_SERVER_TIMEOUT = -3308,

    ///进房参数为空，请检查： enterRoom:appScene: 接口调用是否传入有效的 param
    ERR_TRTC_ROOM_PARAM_NULL = -3316,

    ///进房参数 sdkAppId 错误，请检查 TRTCParams.sdkAppId 是否为空
    ERR_TRTC_INVALID_SDK_APPID = -3317,

    ///进房参数 roomId 错误，请检查 TRTCParams.roomId 或 TRTCParams.strRoomId 是否为空，注意 roomId 和 strRoomId 不可混用
    ERR_TRTC_INVALID_ROOM_ID = -3318,

    ///进房参数 userId 不正确，请检查 TRTCParams.userId 是否为空
    ERR_TRTC_INVALID_USER_ID = -3319,

    ///进房参数 userSig 不正确，请检查 TRTCParams.userSig 是否为空
    ERR_TRTC_INVALID_USER_SIG = -3320,

    ///进房请求被拒绝，请检查是否连续调用 enterRoom 进入相同 Id 的房间
    ERR_TRTC_ENTER_ROOM_REFUSED = -3340,

    ///您开启了高级权限控制，但参数 TRTCParams.privateMapKey 校验失败，
    ///您可参考 [高级权限控制](https://cloud.tencent.com/document/product/647/32240) 进行检查
    ERR_TRTC_INVALID_PRIVATE_MAPKEY = -100006,

    ///服务不可用。请检查：套餐包剩余分钟数是否大于0，腾讯云账号是否欠费。
    ///您可参考 [套餐包管理](https://cloud.tencent.com/document/product/647/50492) 进行查看与配置
    ERR_TRTC_SERVICE_SUSPENDED = -100013,

    /// UserSig 校验失败，请检查参数 TRTCParams.userSig 是否填写正确，或是否已经过期。
    ///您可参考 [UserSig 生成与校验](https://cloud.tencent.com/document/product/647/50686) 进行校验
    ERR_TRTC_USER_SIG_CHECK_FAILED = -100018,

    ///旁路转推请求超时
    ERR_TRTC_PUSH_THIRD_PARTY_CLOUD_TIMEOUT = -3321,

    ///云端混流请求超时
    ERR_TRTC_MIX_TRANSCODING_TIMEOUT = -3322,

    ///旁路转推回包异常
    ERR_TRTC_PUSH_THIRD_PARTY_CLOUD_FAILED = -3323,

    ///云端混流回包异常
    ERR_TRTC_MIX_TRANSCODING_FAILED = -3324,

    ///开始向腾讯云的直播 CDN 推流信令超时
    ERR_TRTC_START_PUBLISHING_TIMEOUT = -3333,

    ///开始向腾讯云的直播 CDN 推流信令异常
    ERR_TRTC_START_PUBLISHING_FAILED = -3334,

    ///停止向腾讯云的直播 CDN 推流信令超时
    ERR_TRTC_STOP_PUBLISHING_TIMEOUT = -3335,

    ///停止向腾讯云的直播 CDN 推流信令异常
    ERR_TRTC_STOP_PUBLISHING_FAILED = -3336,

    ///请求连麦超时
    ERR_TRTC_CONNECT_OTHER_ROOM_TIMEOUT = -3326,

    ///请求退出连麦超时
    ERR_TRTC_DISCONNECT_OTHER_ROOM_TIMEOUT = -3327,

    ///无效参数
    ERR_TRTC_CONNECT_OTHER_ROOM_INVALID_PARAMETER = -3328,

    ///当前是观众角色，不能请求或断开跨房连麦，需要先 `switchRole` 到主播
    ERR_TRTC_CONNECT_OTHER_ROOM_AS_AUDIENCE = -3330,
};

/**
 * 警告码
 */
enum TXLiteAVWarning {

    /////////////////////////////////////////////////////////////////////////////////
    //       视频相关警告码
    /////////////////////////////////////////////////////////////////////////////////

    ///硬编码启动出现问题，自动切换到软编码
    WARNING_HW_ENCODER_START_FAIL = 1103,

    ///表示编码器发生改变，可以通过 onWarning 函数的扩展信息中的 type 字段来获取当前的编码格式。
    ///其中 1 代表 265 编码，0 代表 264 编码。注意 Windows 端不支持此错误码的扩展信息。
    WARNING_CURRENT_ENCODE_TYPE_CHANGED = 1104,

    ///当前 CPU 使用率太高，无法满足软件编码需求，自动切换到硬件编码
    WARNING_VIDEO_ENCODER_SW_TO_HW = 1107,

    ///摄像头采集帧率不足，部分自带美颜算法的 Android 手机上会出现
    WARNING_INSUFFICIENT_CAPTURE_FPS = 1108,

    ///软编码启动失败
    WARNING_SW_ENCODER_START_FAIL = 1109,

    ///摄像头采集分辨率被降低，以满足当前帧率和性能最优解。
    WARNING_REDUCE_CAPTURE_RESOLUTION = 1110,

    ///没有检测到可用的摄像头设备
    WARNING_CAMERA_DEVICE_EMPTY = 1111,

    ///用户未授权当前应用使用摄像头
    WARNING_CAMERA_NOT_AUTHORIZED = 1112,

    ///用户未授权当前应用使用屏幕录制
    WARNING_SCREEN_CAPTURE_NOT_AUTHORIZED = 1206,

    ///当前视频帧解码失败
    WARNING_VIDEO_FRAME_DECODE_FAIL = 2101,

    ///硬解启动失败，采用软解码
    WARNING_HW_DECODER_START_FAIL = 2106,

    ///当前流硬解第一个 I 帧失败，SDK 自动切软解
    WARNING_VIDEO_DECODER_HW_TO_SW = 2108,

    ///软解码器启动失败
    WARNING_SW_DECODER_START_FAIL = 2109,

    ///视频渲染失败
    WARNING_VIDEO_RENDER_FAIL = 2110,

    /////////////////////////////////////////////////////////////////////////////////
    //       音频相关警告码
    /////////////////////////////////////////////////////////////////////////////////

    ///没有检测到可用的麦克风设备
    WARNING_MICROPHONE_DEVICE_EMPTY = 1201,

    ///没有检测到可用的扬声器设备
    WARNING_SPEAKER_DEVICE_EMPTY = 1202,

    ///用户未授权当前应用使用麦克风
    WARNING_MICROPHONE_NOT_AUTHORIZED = 1203,

    ///音频采集设备不可用（例如被占用或者PC判定无效设备）
    WARNING_MICROPHONE_DEVICE_ABNORMAL = 1204,

    ///音频播放设备不可用（例如被占用或者PC判定无效设备）
    WARNING_SPEAKER_DEVICE_ABNORMAL = 1205,

    ///当前音频帧解码失败
    WARNING_AUDIO_FRAME_DECODE_FAIL = 2102,

    ///音频录制写入文件失败
    WARNING_AUDIO_RECORDING_WRITE_FAIL = 7001,

    ///录制音频时监测到啸叫
    WARNING_MICROPHONE_HOWLING_DETECTED = 7002,

    /////////////////////////////////////////////////////////////////////////////////
    //       网络相关警告码
    /////////////////////////////////////////////////////////////////////////////////i

    ///前是观众角色，不支持发布音视频，需要先切换成主播角色
    WARNING_IGNORE_UPSTREAM_FOR_AUDIENCE = 6001,

};

#define ERR_ROOM_ENTER_FAIL ERR_TRTC_ENTER_ROOM_FAILED
#define ERR_ROOM_REQUEST_IP_TIMEOUT ERR_TRTC_REQUEST_IP_TIMEOUT
#define ERR_ROOM_REQUEST_ENTER_ROOM_TIMEOUT ERR_TRTC_CONNECT_SERVER_TIMEOUT

#define ERR_ENTER_ROOM_PARAM_NULL ERR_TRTC_ROOM_PARAM_NULL
#define ERR_SDK_APPID_INVALID ERR_TRTC_INVALID_SDK_APPID
#define ERR_ROOM_ID_INVALID ERR_TRTC_INVALID_ROOM_ID
#define ERR_USER_ID_INVALID ERR_TRTC_INVALID_USER_ID
#define ERR_USER_SIG_INVALID ERR_TRTC_INVALID_USER_SIG
#define ERR_ROOM_REQUEST_ENTER_ROOM_REFUSED ERR_TRTC_ENTER_ROOM_REFUSED
#define ERR_SERVER_INFO_PRIVILEGE_FLAG_ERROR ERR_TRTC_INVALID_PRIVATE_MAPKEY
#define ERR_SERVER_INFO_SERVICE_SUSPENDED ERR_TRTC_SERVICE_SUSPENDED
#define ERR_SERVER_INFO_ECDH_GET_TINYID ERR_TRTC_USER_SIG_CHECK_FAILED
#define ERR_SERVER_CENTER_NO_PRIVILEDGE_PUSH_SUB_VIDEO ERR_SCREEN_SHARE_NOT_AUTHORIZED
#define ERR_SERVER_CENTER_ANOTHER_USER_PUSH_SUB_VIDEO ERR_SCREEN_SHRAE_OCCUPIED_BY_OTHER
#define ERR_PUBLISH_CDN_STREAM_REQUEST_TIME_OUT ERR_TRTC_PUSH_THIRD_PARTY_CLOUD_TIMEOUT
#define ERR_PUBLISH_CDN_STREAM_SERVER_FAILED ERR_TRTC_PUSH_THIRD_PARTY_CLOUD_FAILED
#define ERR_CLOUD_MIX_TRANSCODING_REQUEST_TIME_OUT ERR_TRTC_MIX_TRANSCODING_TIMEOUT
#define ERR_CLOUD_MIX_TRANSCODING_SERVER_FAILED ERR_TRTC_MIX_TRANSCODING_FAILED

#define ERR_ROOM_REQUEST_START_PUBLISHING_TIMEOUT ERR_TRTC_START_PUBLISHING_TIMEOUT
#define ERR_ROOM_REQUEST_START_PUBLISHING_ERROR ERR_TRTC_START_PUBLISHING_FAILED
#define ERR_ROOM_REQUEST_STOP_PUBLISHING_TIMEOUT ERR_TRTC_STOP_PUBLISHING_TIMEOUT
#define ERR_ROOM_REQUEST_STOP_PUBLISHING_ERROR ERR_TRTC_STOP_PUBLISHING_FAILED

#define ERR_ROOM_REQUEST_CONN_ROOM_TIMEOUT ERR_TRTC_CONNECT_OTHER_ROOM_TIMEOUT
#define ERR_ROOM_REQUEST_DISCONN_ROOM_TIMEOUT ERR_TRTC_DISCONNECT_OTHER_ROOM_TIMEOUT
#define ERR_ROOM_REQUEST_CONN_ROOM_INVALID_PARAM ERR_TRTC_CONNECT_OTHER_ROOM_INVALID_PARAMETER
#define ERR_CONNECT_OTHER_ROOM_AS_AUDIENCE ERR_TRTC_CONNECT_OTHER_ROOM_AS_AUDIENCE

typedef enum TXLiteAVError TXLiteAVError;
typedef enum TXLiteAVWarning TXLiteAVWarning;

#endif
