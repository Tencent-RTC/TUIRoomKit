// Copyright (c) 2021 Tencent. All rights reserved.

#ifndef __V2TIM_ERROR_CODE_H__
#define __V2TIM_ERROR_CODE_H__

enum V2TIMErrorCode {
    // ///////////////////////////////////////////////////////////////////////////////
    //
    // （一）IM SDK 的错误码
    //
    // ///////////////////////////////////////////////////////////////////////////////

    // 通用错误码

    ERR_SUCC                                    = 0,       // 无错误。
    ERR_IN_PROGESS                              = 6015,    // 执行中，请做好接口调用控制，例如，第一次初始化操作在回调前，后续的初始化操作会返回该错误码。
    ERR_INVALID_PARAMETERS                      = 6017,    // 参数无效，请检查参数是否符合要求，具体可查看错误信息进一步定义哪个字段。
    ERR_IO_OPERATION_FAILED                     = 6022,    // 操作本地 IO 错误，检查是否有读写权限，磁盘是否已满。
    ERR_INVALID_JSON                            = 6027,    // 错误的 JSON 格式，请检查参数是否符合接口的要求，具体可查看错误信息进一步定义哪个字段。
    ERR_OUT_OF_MEMORY                           = 6028,    // 内存不足，可能存在内存泄漏，iOS 平台使用 Instrument 工具，Android 平台使用 Profiler 工具，分析出什么地方的内存占用高。
    ERR_PARSE_RESPONSE_FAILED                   = 6001,    // PB 解析失败，内部错误。
    ERR_SERIALIZE_REQ_FAILED                    = 6002,    // PB 序列化失败，内部错误。
    ERR_SDK_NOT_INITIALIZED                     = 6013,    // IM SDK 未初始化，初始化成功回调之后重试。
    ERR_LOADMSG_FAILED                          = 6005,    // 加载本地数据库操作失败，可能存储文件有损坏。
    ERR_DATABASE_OPERATE_FAILED                 = 6019,    // 本地数据库操作失败，可能是部分目录无权限或者数据库文件已损坏。
    ERR_SDK_COMM_CROSS_THREAD                   = 7001,    // 跨线程错误，不能在跨越不同线程中执行，内部错误。
    ERR_SDK_COMM_TINYID_EMPTY                   = 7002,    // TinyId 为空，内部错误。
    ERR_SDK_COMM_INVALID_IDENTIFIER             = 7003,    // Identifier 非法，必须不为空，要求可打印 ASCII 字符（0x20-0x7e），长度不超过32字节。
    ERR_SDK_COMM_FILE_NOT_FOUND                 = 7004,    // 文件不存在，请检查文件路径是否正确。
    ERR_SDK_COMM_FILE_TOO_LARGE                 = 7005,    // 文件大小超出了限制，语音、图片，最大限制是28MB，视频、文件，最大限制 100M
    ERR_SDK_COMM_FILE_SIZE_EMPTY                = 7006,    // 空文件，要求文件大小不是0字节，如果上传图片、语音、视频或文件，请检查文件是否正确生成。
    ERR_SDK_COMM_FILE_OPEN_FAILED               = 7007,    // 文件打开失败，请检查文件是否存在，或者已被独占打开，引起 SDK 打开失败。
    ERR_SDK_COMM_API_CALL_FREQUENCY_LIMIT       = 7008,    // API 调用超频
    ERR_SDK_COMM_INTERRUPT                      = 7009,    // 正在执行时被终止，例如正在登录时，调用 unInit 停止使用 SDK 。
    ERR_SDK_COMM_DATABASE_FAILURE               = 7010,    // database 操作失败
    ERR_SDK_COMM_DATABASE_NOTFOUND              = 7011,    // database 查询的数据不存在
    ERR_SDK_INTERNAL_ERROR                      = 7012,    // SDK 内部不应该出现的内部错误
    ERR_SDK_INTERFACE_NOT_SUPPORT               = 7013,    // 套餐包不支持该接口的使用，请升级到旗舰版套餐

    // 帐号错误码

    ERR_SDK_NOT_LOGGED_IN                       = 6014,    // IM SDK 未登录，请先登录，成功回调之后重试，或者已被踢下线，可使用 TIMManager getLoginUser 检查当前是否在线。
    ERR_NO_PREVIOUS_LOGIN                       = 6026,    // 自动登录时，并没有登录过该用户，这时候请调用 login 接口重新登录。
    ERR_USER_SIG_EXPIRED                        = 6206,    // UserSig 过期，请重新获取有效的 UserSig 后再重新登录。
    ERR_LOGIN_KICKED_OFF_BY_OTHER               = 6208,    // 其他终端登录同一个帐号，引起已登录的帐号被踢，需重新登录。
    ERR_SDK_ACCOUNT_LOGIN_IN_PROCESS            = 7501,    // 登录正在执行中，例如，第一次 login 或 autoLogin 操作在回调前，后续的 login 或 autoLogin 操作会返回该错误码。
    ERR_SDK_ACCOUNT_LOGOUT_IN_PROCESS           = 7502,    // 登出正在执行中，例如，第一次 logout 操作在回调前，后续的 logout 操作会返回该错误码。
    ERR_SDK_ACCOUNT_TLS_INIT_FAILED             = 7503,    // TLS SDK 初始化失败，内部错误。
    ERR_SDK_ACCOUNT_TLS_NOT_INITIALIZED         = 7504,    // TLS SDK 未初始化，内部错误。
    ERR_SDK_ACCOUNT_TLS_TRANSPKG_ERROR          = 7505,    // TLS SDK TRANS 包格式错误，内部错误。
    ERR_SDK_ACCOUNT_TLS_DECRYPT_FAILED          = 7506,    // TLS SDK 解密失败，内部错误。
    ERR_SDK_ACCOUNT_TLS_REQUEST_FAILED          = 7507,    // TLS SDK 请求失败，内部错误。
    ERR_SDK_ACCOUNT_TLS_REQUEST_TIMEOUT         = 7508,    // TLS SDK 请求超时，内部错误。

    // 消息错误码

    ERR_INVALID_CONVERSATION                    = 6004,    // 会话无效，getConversation 时检查是否已经登录，如未登录获取会话，会有此错误码返回。
    ERR_FILE_TRANS_AUTH_FAILED                  = 6006,    // 文件传输鉴权失败。
    ERR_FILE_TRANS_NO_SERVER                    = 6007,    // 文件传输获取 Server 列表失败。
    ERR_FILE_TRANS_UPLOAD_FAILED                = 6008,    // 文件传输上传失败，请检查网络是否连接。
    ERR_IMAGE_UPLOAD_FAILED_NOTIMAGE            = 6031,    // 文件传输上传失败，请检查上传的图片是否能够正常打开。
    ERR_FILE_TRANS_DOWNLOAD_FAILED              = 6009,    // 文件传输下载失败，请检查网络，或者文件、语音是否已经过期，目前资源文件存储7天。
    ERR_HTTP_REQ_FAILED                         = 6010,    // HTTP 请求失败，请检查 URL 地址是否合法，可在网页浏览器尝试访问该 URL 地址。
    ERR_INVALID_MSG_ELEM                        = 6016,    // IM SDK 无效消息 elem，具体可查看错误信息进一步定义哪个字段。
    ERR_INVALID_SDK_OBJECT                      = 6021,    // 无效的对象，例如用户自己生成 TIMImage 对象，或内部赋值错误导致对象无效。
    ERR_SDK_MSG_BODY_SIZE_LIMIT                 = 8001,    // 消息长度超出限制，消息长度不要超过8k，消息长度是各个 elem 长度的总和，elem 长度是所有 elem 字段的长度总和。
    ERR_SDK_MSG_KEY_REQ_DIFFER_RSP              = 8002,    // 消息 KEY 错误，内部错误，网络请求包的 KEY 和 回复包的不一致。
    ERR_SDK_IMAGE_CONVERT_ERROR                 = 8003,    // 万象优图 HTTP 请求失败。
    ERR_SDK_IMAGE_CI_BLOCK                      = 8004,    // 万象优图因为鉴黄等原因转缩略图失败。
    ERR_MERGER_MSG_LAYERS_OVER_LIMIT            = 8005,    // 合并消息嵌套层数超过上限（上限 100 层）。
    
    ERR_SDK_SIGNALING_INVALID_INVITE_ID         = 8010,    // 信令请求 ID 无效或已经被处理过。（上层接口使用，底层为了不重复也增加一份）
    ERR_SDK_SIGNALING_NO_PERMISSION             = 8011,    // 信令请求无权限，比如取消非自己发起的邀请。（上层接口使用，底层为了不重复也增加一份）
    ERR_SDK_SIGNALING_ALREADY_EXISTS            = 8012,    // 信令邀请已存在。
    ERR_SDK_INVALID_CANCEL_MESSAGE              = 8020,    // 取消消息时，取消的消息不存在，或者已经发送成功。取消失败
    ERR_SDK_SEND_MESSAGE_FAILED_WITH_CANCEL     = 8021,    // 消息发送失败，因为该消息已被取消
    // 群组错误码

    ERR_SDK_GROUP_INVALID_ID                    = 8501,    // 群组 ID 非法，自定义群组 ID 必须为可打印 ASCII 字符（0x20-0x7e），最长48个字节，且前缀不能为 @TGS#（避免与服务端默认分配的群组 ID 混淆）。
    ERR_SDK_GROUP_INVALID_NAME                  = 8502,    // 群名称非法，群名称最长30字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_GROUP_INVALID_INTRODUCTION          = 8503,    // 群简介非法，群简介最长240字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_GROUP_INVALID_NOTIFICATION          = 8504,    // 群公告非法，群公告最长300字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_GROUP_INVALID_FACE_URL              = 8505,    // 群头像 URL 非法，群头像 URL 最长100字节，可在网页浏览器尝试访问该 URL 地址。
    ERR_SDK_GROUP_INVALID_NAME_CARD             = 8506,    // 群名片非法，群名片最长50字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_GROUP_MEMBER_COUNT_LIMIT            = 8507,    // 超过群组成员数的限制，在创建群和邀请成员时，指定的成员数超出限制，最大群成员数量：私有群是200人，公开群是2000人，聊天室是10000人，音视频聊天室和在线成员广播大群无限制。
    ERR_SDK_GROUP_JOIN_PRIVATE_GROUP_DENY       = 8508,    // 不允许申请加入 Private 群组，任意群成员可邀请入群，且无需被邀请人同意。
    ERR_SDK_GROUP_INVITE_SUPER_DENY             = 8509,    // 不允许邀请角色为群主的成员，请检查角色字段是否填写正确。
    ERR_SDK_GROUP_INVITE_NO_MEMBER              = 8510,    // 不允许邀请0个成员，请检查成员字段是否填写正确。
    ERR_SDK_GROUP_ATTR_FREQUENCY_LIMIT          = 8511,    // 群属性接口操作限制：增删改接口后台限制1秒5次，查接口 SDK 限制5秒20次。
    ERR_SDK_GROUP_GET_ONLINE_MEMBER_COUNT_LIMIT = 8512,    // 获取群在线人数接口操作限制：查接口 SDK 限制60秒1次。
    ERR_SDK_GROUP_GET_GROUPS_INFO_LIMIT         = 8513,    // 获取群资料接口操作限制：查接口 SDK 限制1秒1次。
    ERR_SDK_GROUP_GET_JOINED_GROUP_LIMIT        = 8514,    // 获取加入群列表接口操作限制：查接口 SDK 限制1秒1次。

    // 关系链错误码

    ERR_SDK_FRIENDSHIP_INVALID_PROFILE_KEY      = 9001,    // 资料字段非法，资料支持标配字段及自定义字段，其中自定义字段的关键字，必须是英文字母，且长度不得超过8字节，自定义字段的值最长不能超过500字节。
    ERR_SDK_FRIENDSHIP_INVALID_ADD_REMARK       = 9002,    // 备注字段非法，最大96字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_FRIENDSHIP_INVALID_ADD_WORDING      = 9003,    // 请求添加好友的请求说明字段非法，最大120字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_FRIENDSHIP_INVALID_ADD_SOURCE       = 9004,    // 请求添加好友的添加来源字段非法，来源需要添加“AddSource_Type_”前缀。
    ERR_SDK_FRIENDSHIP_FRIEND_GROUP_EMPTY       = 9005,    // 好友分组字段非法，必须不为空，每个分组的名称最长30字节，字符编码必须是 UTF-8 ，如果包含中文，可能用多个字节表示一个中文字符，请注意检查字符串的字节长度。
    ERR_SDK_FRIENDSHIP_EXCEED_THE_LIMIT         = 9006,    // 超过数量限制

    // 网络错误码

    ERR_SDK_NET_ENCODE_FAILED                   = 9501,    // SSO 加密失败，内部错误。
    ERR_SDK_NET_DECODE_FAILED                   = 9502,    // SSO 解密失败，内部错误。
    ERR_SDK_NET_AUTH_INVALID                    = 9503,    // SSO 未完成鉴权，可能登录未完成，请在登录完成后再操作。
    ERR_SDK_NET_COMPRESS_FAILED                 = 9504,    // 数据包压缩失败，内部错误。
    ERR_SDK_NET_UNCOMPRESS_FAILED               = 9505,    // 数据包解压失败，内部错误。
    ERR_SDK_NET_FREQ_LIMIT                      = 9506,    // 调用频率限制，最大每秒发起 5 次请求。
    ERR_SDK_NET_REQ_COUNT_LIMIT                 = 9507,    // 请求队列満，超过同时请求的数量限制，最大同时发起1000个请求。
    ERR_SDK_NET_DISCONNECT                      = 9508,    // 网络已断开，未建立连接，或者建立 socket 连接时，检测到无网络。
    ERR_SDK_NET_ALLREADY_CONN                   = 9509,    // 网络连接已建立，重复创建连接，内部错误。
    ERR_SDK_NET_CONN_TIMEOUT                    = 9510,    // 建立网络连接超时，请等网络恢复后重试。
    ERR_SDK_NET_CONN_REFUSE                     = 9511,    // 网络连接已被拒绝，请求过于频繁，服务端拒绝服务。
    ERR_SDK_NET_NET_UNREACH                     = 9512,    // 没有到达网络的可用路由，请等网络恢复后重试。
    ERR_SDK_NET_SOCKET_NO_BUFF                  = 9513,    // 系统中没有足够的缓冲区空间资源可用来完成调用，系统过于繁忙，内部错误。
    ERR_SDK_NET_RESET_BY_PEER                   = 9514,    // 对端重置了连接，可能服务端过载，SDK 内部会自动重连，请等网络连接成功 onConnSucc （ iOS ） 或 onConnected （ Android ） 回调后重试。
    ERR_SDK_NET_SOCKET_INVALID                  = 9515,    // socket 套接字无效，内部错误。
    ERR_SDK_NET_HOST_GETADDRINFO_FAILED         = 9516,    // IP 地址解析失败，请检查网络连接是否正常。
    ERR_SDK_NET_CONNECT_RESET                   = 9517,    // 网络连接到中间节点或服务端重置，引起连接失效，内部错误，SDK 内部会自动重连，请等网络连接成功 onConnSucc （ iOS ） 或 onConnected （ Android ） 回调后重试。
    ERR_SDK_NET_WAIT_INQUEUE_TIMEOUT            = 9518,    // 请求包等待进入待发送队列超时，发送时网络连接建立比较慢 或 频繁断网重连时，会出现该错误，请检查网络连接是否正常。
    ERR_SDK_NET_WAIT_SEND_TIMEOUT               = 9519,    // 请求包已进入待发送队列，等待进入系统的网络 buffer 超时，数据包较多 或 发送线程处理不过来，在回调错误时检测有联网，内部错误。
    ERR_SDK_NET_WAIT_ACK_TIMEOUT                = 9520,    // 请求包已进入系统的网络 buffer ，等待服务端回包超时，可能请求包没离开终端设备、中间路由丢弃、服务端意外丢包或回包被系统网络层丢弃，在回调错误时检测有联网，内部错误。
    ERR_SDK_NET_WAIT_SEND_REMAINING_TIMEOUT     = 9521,    // 请求包已进入待发送队列，部分数据已发送，等待发送剩余部分出现超时，可能上行带宽不足，请检查网络是否畅通，在回调错误时检测有联网，内部错误。
    ERR_SDK_NET_PKG_SIZE_LIMIT                  = 9522,    // 请求包长度大于限制，最大支持 1MB 。
    ERR_SDK_NET_WAIT_SEND_TIMEOUT_NO_NETWORK    = 9523,    // 请求包已进入待发送队列，等待进入系统的网络 buffer 超时，数据包较多 或 发送线程处理不过来，在回调错误时检测没有联网，内部错误。
    ERR_SDK_NET_WAIT_ACK_TIMEOUT_NO_NETWORK     = 9524,    // 请求包已进入系统的网络 buffer ，等待服务端回包超时，可能请求包没离开终端设备、中间路由丢弃、服务端意外丢包或回包被系统网络层丢弃，在回调错误时检测没有联网，内部错误。
    ERR_SDK_NET_SEND_REMAINING_TIMEOUT_NO_NETWORK = 9525,  // 请求包已进入待发送队列，部分数据已发送，等待发送剩余部分出现超时，可能上行带宽不足，请检查网络是否畅通，在回调错误时检测没有联网，内部错误。

    // ///////////////////////////////////////////////////////////////////////////////
    //
    // （二）服务端的错误码
    //
    // ///////////////////////////////////////////////////////////////////////////////

    // SSO 接入层的错误码

    ERR_SVR_SSO_CONNECT_LIMIT                   = -302  ,  // SSO 的连接数量超出限制，服务端拒绝服务。
    ERR_SVR_SSO_VCODE                           = -10000,  // 下发验证码标志错误。
    ERR_SVR_SSO_D2_EXPIRED                      = -10001,  // D2 过期。
    ERR_SVR_SSO_A2_UP_INVALID                   = -10003,  // A2 校验失败等场景使用。
    ERR_SVR_SSO_A2_DOWN_INVALID                 = -10004,  // 处理下行包时发现 A2 验证没通过或者被安全打击。
    ERR_SVR_SSO_EMPTY_KEY                       = -10005,  // 不允许空 D2Key 加密。
    ERR_SVR_SSO_UIN_INVALID                     = -10006,  // D2 中的 uin 和 SSO 包头的 uin 不匹配。
    ERR_SVR_SSO_VCODE_TIMEOUT                   = -10007,  // 验证码下发超时。
    ERR_SVR_SSO_NO_IMEI_AND_A2                  = -10008,  // 需要带上 IMEI 和 A2 。
    ERR_SVR_SSO_COOKIE_INVALID                  = -10009,  // Cookie 非法。
    ERR_SVR_SSO_DOWN_TIP                        = -10101,  // 下发提示语，D2 过期。
    ERR_SVR_SSO_DISCONNECT                      = -10102,  // 断链锁屏。
    ERR_SVR_SSO_IDENTIFIER_INVALID              = -10103,  // 失效身份。
    ERR_SVR_SSO_CLIENT_CLOSE                    = -10104,  // 终端自动退出。
    ERR_SVR_SSO_MSFSDK_QUIT                     = -10105,  // MSFSDK 自动退出。
    ERR_SVR_SSO_D2KEY_WRONG                     = -10106,  // SSO D2key 解密失败次数太多，通知终端需要重置，重新刷新 D2 。
    ERR_SVR_SSO_UNSURPPORT                      = -10107,  // 不支持聚合，给终端返回统一的错误码。终端在该 TCP 长连接上停止聚合。
    ERR_SVR_SSO_PREPAID_ARREARS                 = -10108,  // 预付费欠费。
    ERR_SVR_SSO_PACKET_WRONG                    = -10109,  // 请求包格式错误。
    ERR_SVR_SSO_APPID_BLACK_LIST                = -10110,  // SDKAppID 黑名单。
    ERR_SVR_SSO_CMD_BLACK_LIST                  = -10111,  // SDKAppID 设置 service cmd 黑名单。
    ERR_SVR_SSO_APPID_WITHOUT_USING             = -10112,  // SDKAppID 停用。
    ERR_SVR_SSO_FREQ_LIMIT                      = -10113,  // 频率限制(用户)，频率限制是设置针对某一个协议的每秒请求数的限制。
    ERR_SVR_SSO_OVERLOAD                        = -10114,  // 过载丢包(系统)，连接的服务端处理过多请求，处理不过来，拒绝服务。

    // 资源文件错误码

    ERR_SVR_RES_NOT_FOUND                       = 114000,  // 要发送的资源文件不存在。
    ERR_SVR_RES_ACCESS_DENY                     = 114001,  // 要发送的资源文件不允许访问。
    ERR_SVR_RES_SIZE_LIMIT                      = 114002,  // 文件大小超过限制。
    ERR_SVR_RES_SEND_CANCEL                     = 114003,  // 用户取消发送，如发送过程中登出等原因。
    ERR_SVR_RES_READ_FAILED                     = 114004,  // 读取文件内容失败。
    ERR_SVR_RES_TRANSFER_TIMEOUT                = 114005,  // 资源文件（如图片、文件、语音、视频）传输超时，一般是网络问题导致。
    ERR_SVR_RES_INVALID_PARAMETERS              = 114011,  // 参数非法。
    ERR_SVR_RES_INVALID_FILE_MD5                = 115066,  // 文件 MD5 校验失败。
    ERR_SVR_RES_INVALID_PART_MD5                = 115068,  // 分片 MD5 校验失败。

    // 后台公共错误码

    ERR_SVR_COMM_INVALID_HTTP_URL               = 60002,  // HTTP 解析错误 ，请检查 HTTP 请求 URL 格式。
    ERR_SVR_COMM_REQ_JSON_PARSE_FAILED          = 60003,  // HTTP 请求 JSON 解析错误，请检查 JSON 格式。
    ERR_SVR_COMM_INVALID_ACCOUNT                = 60004,  // 请求 URI 或 JSON 包体中 Identifier 或 UserSig 错误。
    ERR_SVR_COMM_INVALID_ACCOUNT_EX             = 60005,  // 请求 URI 或 JSON 包体中 Identifier 或 UserSig 错误。
    ERR_SVR_COMM_INVALID_SDKAPPID               = 60006,  // SDKAppID 失效，请核对 SDKAppID 有效性。
    ERR_SVR_COMM_REST_FREQ_LIMIT                = 60007,  // REST 接口调用频率超过限制，请降低请求频率。
    ERR_SVR_COMM_REQUEST_TIMEOUT                = 60008,  // 服务请求超时或 HTTP 请求格式错误，请检查并重试。
    ERR_SVR_COMM_INVALID_RES                    = 60009,  // 请求资源错误，请检查请求 URL。
    ERR_SVR_COMM_ID_NOT_ADMIN                   = 60010,  // REST API 请求的 Identifier 字段请填写 App 管理员帐号。
    ERR_SVR_COMM_SDKAPPID_FREQ_LIMIT            = 60011,  // SDKAppID 请求频率超限，请降低请求频率。
    ERR_SVR_COMM_SDKAPPID_MISS                  = 60012,  // REST 接口需要带 SDKAppID，请检查请求 URL 中的 SDKAppID。
    ERR_SVR_COMM_RSP_JSON_PARSE_FAILED          = 60013,  // HTTP 响应包 JSON 解析错误。
    ERR_SVR_COMM_EXCHANGE_ACCOUNT_TIMEUT        = 60014,  // 置换帐号超时。
    ERR_SVR_COMM_INVALID_ID_FORMAT              = 60015,  // 请求包体 Identifier 类型错误，请确认 Identifier 为字符串格式。
    ERR_SVR_COMM_SDKAPPID_FORBIDDEN             = 60016,  // SDKAppID 被禁用。
    ERR_SVR_COMM_REQ_FORBIDDEN                  = 60017,  // 请求被禁用。
    ERR_SVR_COMM_REQ_FREQ_LIMIT                 = 60018,  // 请求过于频繁，请稍后重试。
    ERR_SVR_COMM_REQ_FREQ_LIMIT_EX              = 60019,  // 请求过于频繁，请稍后重试。
    ERR_SVR_COMM_INVALID_SERVICE                = 60020,  // 未购买套餐包或购买的套餐包正在配置中暂未生效，请五分钟后再次尝试。
    ERR_SVR_COMM_SENSITIVE_TEXT                 = 80001,  // 文本安全打击，文本中可能包含敏感词汇。
    ERR_SVR_COMM_BODY_SIZE_LIMIT                = 80002,  // 发消息包体过长，目前支持最大8k消息包体长度，请减少包体大小重试。

    // 帐号错误码

    ERR_SVR_ACCOUNT_USERSIG_EXPIRED             = 70001,  // UserSig 已过期，请重新生成 UserSig，建议 UserSig 有效期不小于24小时。
    ERR_SVR_ACCOUNT_USERSIG_EMPTY               = 70002,  // UserSig 长度为0，请检查传入的 UserSig 是否正确。
    ERR_SVR_ACCOUNT_USERSIG_CHECK_FAILED        = 70003,  // UserSig 校验失败，请确认下 UserSig 内容是否被截断，如缓冲区长度不够导致的内容截断。
    ERR_SVR_ACCOUNT_USERSIG_CHECK_FAILED_EX     = 70005,  // UserSig 校验失败，可用工具自行验证生成的 UserSig 是否正确。
    ERR_SVR_ACCOUNT_USERSIG_MISMATCH_PUBLICKEY  = 70009,  // 用公钥验证 UserSig 失败，请确认生成的 UserSig 使用的私钥和 SDKAppID 是否对应。
    ERR_SVR_ACCOUNT_USERSIG_MISMATCH_ID         = 70013,  // 请求的 Identifier 与生成 UserSig 的 Identifier 不匹配。
    ERR_SVR_ACCOUNT_USERSIG_MISMATCH_SDKAPPID   = 70014,  // 请求的 SDKAppID 与生成 UserSig 的 SDKAppID 不匹配。
    ERR_SVR_ACCOUNT_USERSIG_PUBLICKEY_NOT_FOUND = 70016,  // 验证 UserSig 时公钥不存在。请先登录控制台下载私钥，下载私钥的具体方法可参考 [下载签名用的私钥](https://cloud.tencent.com/document/product/269/32688#.E4.B8.8B.E8.BD.BD.E7.AD.BE.E5.90.8D.E7.94.A8.E7.9A.84.E7.A7.81.E9.92.A5) 。
    ERR_SVR_ACCOUNT_SDKAPPID_NOT_FOUND          = 70020,  // SDKAppID 未找到，请在云通信 IM 控制台确认应用信息。
    ERR_SVR_ACCOUNT_INVALID_USERSIG             = 70052,  // UserSig 已经失效，请重新生成，再次尝试。
    ERR_SVR_ACCOUNT_NOT_FOUND                   = 70107,  // 请求的用户帐号不存在。
    ERR_SVR_ACCOUNT_SEC_RSTR                    = 70114,  // 安全原因被限制。
    ERR_SVR_ACCOUNT_INTERNAL_TIMEOUT            = 70169,  // 服务端内部超时，请重试。
    ERR_SVR_ACCOUNT_INVALID_COUNT               = 70206,  // 请求中批量数量不合法。
    ERR_SVR_ACCOUNT_INVALID_PARAMETERS          = 70402,  // 参数非法，请检查必填字段是否填充，或者字段的填充是否满足协议要求。
    ERR_SVR_ACCOUNT_ADMIN_REQUIRED              = 70403,  // 请求需要 App 管理员权限。
    ERR_SVR_ACCOUNT_FREQ_LIMIT                  = 70050,  // 因失败且重试次数过多导致被限制，请检查 UserSig 是否正确，一分钟之后再试。
    ERR_SVR_ACCOUNT_BLACKLIST                   = 70051,  // 帐号被拉入黑名单。
    ERR_SVR_ACCOUNT_COUNT_LIMIT                 = 70398,  // 创建帐号数量超过免费体验版数量限制，请升级为专业版。
    ERR_SVR_ACCOUNT_INTERNAL_ERROR              = 70500,  // 服务端内部错误，请重试。

    // 资料错误码

    ERR_SVR_PROFILE_INVALID_PARAMETERS          = 40001,  // 请求参数错误，请根据错误描述检查请求是否正确。
    ERR_SVR_PROFILE_ACCOUNT_MISS                = 40002,  // 请求参数错误，没有指定需要拉取资料的用户帐号。
    ERR_SVR_PROFILE_ACCOUNT_NOT_FOUND           = 40003,  // 请求的用户帐号不存在。
    ERR_SVR_PROFILE_ADMIN_REQUIRED              = 40004,  // 请求需要 App 管理员权限。
    ERR_SVR_PROFILE_SENSITIVE_TEXT              = 40005,  // 资料字段中包含敏感词。
    ERR_SVR_PROFILE_INTERNAL_ERROR              = 40006,  // 服务端内部错误，请稍后重试。
    ERR_SVR_PROFILE_READ_PERMISSION_REQUIRED    = 40007,  // 没有资料字段的读权限，详情可参见 [资料字段](https://cloud.tencent.com/document/product/269/1500#.E8.B5.84.E6.96.99.E5.AD.97.E6.AE.B5) 。
    ERR_SVR_PROFILE_WRITE_PERMISSION_REQUIRED   = 40008,  // 没有资料字段的写权限，详情可参见 [资料字段](https://cloud.tencent.com/document/product/269/1500#.E8.B5.84.E6.96.99.E5.AD.97.E6.AE.B5) 。
    ERR_SVR_PROFILE_TAG_NOT_FOUND               = 40009,  // 资料字段的 Tag 不存在。
    ERR_SVR_PROFILE_SIZE_LIMIT                  = 40601,  // 资料字段的 Value 长度超过500字节。
    ERR_SVR_PROFILE_VALUE_ERROR                 = 40605,  // 标配资料字段的 Value 错误，详情可参见 [标配资料字段](https://cloud.tencent.com/doc/product/269/1500#.E6.A0.87.E9.85.8D.E8.B5.84.E6.96.99.E5.AD.97.E6.AE.B5) 。
    ERR_SVR_PROFILE_INVALID_VALUE_FORMAT        = 40610,  // 资料字段的 Value 类型不匹配，详情可参见 [标配资料字段](https://cloud.tencent.com/doc/product/269/1500#.E6.A0.87.E9.85.8D.E8.B5.84.E6.96.99.E5.AD.97.E6.AE.B5) 。

    // 关系链错误码

    ERR_SVR_FRIENDSHIP_INVALID_PARAMETERS       = 30001,  // 请求参数错误，请根据错误描述检查请求是否正确。
    ERR_SVR_FRIENDSHIP_INVALID_SDKAPPID         = 30002,  // SDKAppID 不匹配。
    ERR_SVR_FRIENDSHIP_ACCOUNT_NOT_FOUND        = 30003,  // 请求的用户帐号不存在。
    ERR_SVR_FRIENDSHIP_ADMIN_REQUIRED           = 30004,  // 请求需要 App 管理员权限。
    ERR_SVR_FRIENDSHIP_SENSITIVE_TEXT           = 30005,  // 关系链字段中包含敏感词。
    ERR_SVR_FRIENDSHIP_INTERNAL_ERROR           = 30006,  // 服务端内部错误，请重试。
    ERR_SVR_FRIENDSHIP_NET_TIMEOUT              = 30007,  // 网络超时，请稍后重试。
    ERR_SVR_FRIENDSHIP_WRITE_CONFLICT           = 30008,  // 并发写导致写冲突，建议使用批量方式。
    ERR_SVR_FRIENDSHIP_ADD_FRIEND_DENY          = 30009,  // 后台禁止该用户发起加好友请求。
    ERR_SVR_FRIENDSHIP_COUNT_LIMIT              = 30010,  // 自己的好友数已达系统上限。
    ERR_SVR_FRIENDSHIP_GROUP_COUNT_LIMIT        = 30011,  // 分组已达系统上限。
    ERR_SVR_FRIENDSHIP_PENDENCY_LIMIT           = 30012,  // 未决数已达系统上限。
    ERR_SVR_FRIENDSHIP_BLACKLIST_LIMIT          = 30013,  // 黑名单数已达系统上限。
    ERR_SVR_FRIENDSHIP_PEER_FRIEND_LIMIT        = 30014,  // 对方的好友数已达系统上限。
    ERR_SVR_FRIENDSHIP_IN_SELF_BLACKLIST        = 30515,  // 请求添加好友时，对方在自己的黑名单中，不允许加好友。
    ERR_SVR_FRIENDSHIP_ALLOW_TYPE_DENY_ANY      = 30516,  // 请求添加好友时，对方的加好友验证方式是不允许任何人添加自己为好友。
    ERR_SVR_FRIENDSHIP_IN_PEER_BLACKLIST        = 30525,  // 请求添加好友时，自己在对方的黑名单中，不允许加好友。
    ERR_SVR_FRIENDSHIP_ALLOW_TYPE_NEED_CONFIRM  = 30539,  // A 请求加 B 为好友，B 的加好友验证方式被设置为“AllowType_Type_NeedConfirm”，这时 A 与 B 之间只能形成未决关系，该返回码用于标识加未决成功，以便与加好友成功的返回码区分开，调用方可以捕捉该错误给用户一个合理的提示。
    ERR_SVR_FRIENDSHIP_ADD_FRIEND_SEC_RSTR      = 30540,  // 添加好友请求被安全策略打击，请勿频繁发起添加好友请求。
    ERR_SVR_FRIENDSHIP_PENDENCY_NOT_FOUND       = 30614,  // 请求的未决不存在。
    ERR_SVR_FRIENDSHIP_DEL_NONFRIEND            = 31704,  // 与请求删除的帐号之间不存在好友关系。
    ERR_SVR_FRIENDSHIP_DEL_FRIEND_SEC_RSTR      = 31707,  // 删除好友请求被安全策略打击，请勿频繁发起删除好友请求。
    ERR_SVR_FRIENDSHIP_ACCOUNT_NOT_FOUND_EX     = 31804,  // 请求的用户帐号不存在。

    // 最近联系人错误码

    ERR_SVR_CONV_ACCOUNT_NOT_FOUND              = 50001,  // 请求的用户帐号不存在。
    ERR_SVR_CONV_INVALID_PARAMETERS             = 50002,  // 请求参数错误，请根据错误描述检查请求是否正确。
    ERR_SVR_CONV_ADMIN_REQUIRED                 = 50003,  // 请求需要 App 管理员权限。
    ERR_SVR_CONV_INTERNAL_ERROR                 = 50004,  // 服务端内部错误，请重试。
    ERR_SVR_CONV_NET_TIMEOUT                    = 50005,  // 网络超时，请稍后重试。

    // 消息错误码

    ERR_SVR_MSG_PKG_PARSE_FAILED                = 20001,  // 请求包非法，请检查发送方和接收方帐号是否存在。
    ERR_SVR_MSG_INTERNAL_AUTH_FAILED            = 20002,  // 内部鉴权失败。
    ERR_SVR_MSG_INVALID_ID                      = 20003,  // Identifier 无效或者 Identifier 未导入云通信 IM。
    ERR_SVR_MSG_NET_ERROR                       = 20004,  // 网络异常，请重试。
    ERR_SVR_MSG_INTERNAL_ERROR1                 = 20005,  // 服务端内部错误，请重试。
    ERR_SVR_MSG_PUSH_DENY                       = 20006,  // 触发发送单聊消息之前回调，App 后台返回禁止下发该消息。
    ERR_SVR_MSG_IN_PEER_BLACKLIST               = 20007,  // 发送单聊消息，被对方拉黑，禁止发送。
    ERR_SVR_MSG_BOTH_NOT_FRIEND                 = 20009,  // 消息发送双方互相不是好友，禁止发送（配置单聊消息校验好友关系才会出现）。
    ERR_SVR_MSG_NOT_PEER_FRIEND                 = 20010,  // 发送单聊消息，自己不是对方的好友（单向关系），禁止发送。
    ERR_SVR_MSG_NOT_SELF_FRIEND                 = 20011,  // 发送单聊消息，对方不是自己的好友（单向关系），禁止发送。
    ERR_SVR_MSG_SHUTUP_DENY                     = 20012,  // 因禁言，禁止发送消息。
    ERR_SVR_MSG_REVOKE_TIME_LIMIT               = 20016,  // 消息撤回超过了时间限制（默认2分钟）。
    ERR_SVR_MSG_DEL_RAMBLE_INTERNAL_ERROR       = 20018,  // 删除漫游内部错误。
    ERR_SVR_MSG_JSON_PARSE_FAILED               = 90001,  // JSON 格式解析失败，请检查请求包是否符合 JSON 规范。
    ERR_SVR_MSG_INVALID_JSON_BODY_FORMAT        = 90002,  // JSON 格式请求包中 MsgBody 不符合消息格式描述，或者 MsgBody 不是 Array 类型，请参考 [TIMMsgElement 对象](https://cloud.tencent.com/document/product/269/2720#.E6.B6.88.E6.81.AF.E5.85.83.E7.B4.A0timmsgelement) 的定义。
    ERR_SVR_MSG_INVALID_TO_ACCOUNT              = 90003,  // JSON 格式请求包体中缺少 To_Account 字段或者 To_Account 字段不是 Integer 类型
    ERR_SVR_MSG_INVALID_RAND                    = 90005,  // JSON 格式请求包体中缺少 MsgRandom 字段或者 MsgRandom 字段不是 Integer 类型
    ERR_SVR_MSG_INVALID_TIMESTAMP               = 90006,  // JSON 格式请求包体中缺少 MsgTimeStamp 字段或者 MsgTimeStamp 字段不是 Integer 类型
    ERR_SVR_MSG_BODY_NOT_ARRAY                  = 90007,  // JSON 格式请求包体中 MsgBody 类型不是 Array 类型，请将其修改为 Array 类型
    ERR_SVR_MSG_ADMIN_REQUIRED                  = 90009,  // 请求需要 App 管理员权限。
    ERR_SVR_MSG_INVALID_JSON_FORMAT             = 90010,  // JSON 格式请求包不符合消息格式描述，请参考 [TIMMsgElement 对象](https://cloud.tencent.com/document/product/269/2720#.E6.B6.88.E6.81.AF.E5.85.83.E7.B4.A0timmsgelement) 的定义。
    ERR_SVR_MSG_TO_ACCOUNT_COUNT_LIMIT          = 90011,  // 批量发消息目标帐号超过500，请减少 To_Account 中目标帐号数量。
    ERR_SVR_MSG_TO_ACCOUNT_NOT_FOUND            = 90012,  // To_Account 没有注册或不存在，请确认 To_Account 是否导入云通信 IM 或者是否拼写错误。
    ERR_SVR_MSG_TIME_LIMIT                      = 90026,  // 消息离线存储时间错误（最多不能超过7天）。
    ERR_SVR_MSG_INVALID_SYNCOTHERMACHINE        = 90031,  // JSON 格式请求包体中 SyncOtherMachine 字段不是 Integer 类型
    ERR_SVR_MSG_INVALID_MSGLIFETIME             = 90044,  // JSON 格式请求包体中 MsgLifeTime 字段不是 Integer 类型
    ERR_SVR_MSG_ACCOUNT_NOT_FOUND               = 90048,  // 请求的用户帐号不存在。
    ERR_SVR_MSG_INTERNAL_ERROR2                 = 90994,  // 服务内部错误，请重试。
    ERR_SVR_MSG_INTERNAL_ERROR3                 = 90995,  // 服务内部错误，请重试。
    ERR_SVR_MSG_INTERNAL_ERROR4                 = 91000,  // 服务内部错误，请重试。
    ERR_SVR_MSG_INTERNAL_ERROR5                 = 90992,  // 服务内部错误，请重试；如果所有请求都返回该错误码，且 App 配置了第三方回调，请检查 App 服务端是否正常向云通信 IM 后台服务端返回回调结果。
    ERR_SVR_MSG_BODY_SIZE_LIMIT                 = 93000,  // JSON 数据包超长，消息包体请不要超过8k。
    ERR_SVR_MSG_LONGPOLLING_COUNT_LIMIT         = 91101,  // Web 端长轮询被踢（Web 端同时在线实例个数超出限制）。
    // 120001 - 130000,  // 单聊第三方回调返回的自定义错误码。

    // 群组错误码

    ERR_SVR_GROUP_INTERNAL_ERROR                = 10002,  // 服务端内部错误，请重试。
    ERR_SVR_GROUP_API_NAME_ERROR                = 10003,  // 请求中的接口名称错误，请核对接口名称并重试。
    ERR_SVR_GROUP_INVALID_PARAMETERS            = 10004,  // 参数非法，请根据错误描述检查请求是否正确。
    ERR_SVR_GROUP_ACOUNT_COUNT_LIMIT            = 10005,  // 请求包体中携带的帐号数量过多。
    ERR_SVR_GROUP_FREQ_LIMIT                    = 10006,  // 操作频率限制，请尝试降低调用的频率。
    ERR_SVR_GROUP_PERMISSION_DENY               = 10007,  // 操作权限不足，比如 Public 群组中普通成员尝试执行踢人操作，但只有 App 管理员才有权限。
    ERR_SVR_GROUP_INVALID_REQ                   = 10008,  // 请求非法，可能是请求中携带的签名信息验证不正确，请再次尝试。
    ERR_SVR_GROUP_SUPER_NOT_ALLOW_QUIT          = 10009,  // 该群不允许群主主动退出。
    ERR_SVR_GROUP_NOT_FOUND                     = 10010,  // 群组不存在，或者曾经存在过，但是目前已经被解散。
    ERR_SVR_GROUP_JSON_PARSE_FAILED             = 10011,  // 解析 JSON 包体失败，请检查包体的格式是否符合 JSON 格式。
    ERR_SVR_GROUP_INVALID_ID                    = 10012,  // 发起操作的 Identifier 非法，请检查发起操作的用户 Identifier 是否填写正确。
    ERR_SVR_GROUP_ALLREADY_MEMBER               = 10013,  // 被邀请加入的用户已经是群成员。
    ERR_SVR_GROUP_FULL_MEMBER_COUNT             = 10014,  // 群已满员，无法将请求中的用户加入群组，如果是批量加人，可以尝试减少加入用户的数量。
    ERR_SVR_GROUP_INVALID_GROUPID               = 10015,  // 群组 ID 非法，请检查群组 ID 是否填写正确。
    ERR_SVR_GROUP_REJECT_FROM_THIRDPARTY        = 10016,  // App 后台通过第三方回调拒绝本次操作。
    ERR_SVR_GROUP_SHUTUP_DENY                   = 10017,  // 因被禁言而不能发送消息，请检查发送者是否被设置禁言。
    ERR_SVR_GROUP_RSP_SIZE_LIMIT                = 10018,  // 应答包长度超过最大包长（1MB），请求的内容过多，请尝试减少单次请求的数据量。
    ERR_SVR_GROUP_ACCOUNT_NOT_FOUND             = 10019,  // 请求的用户帐号不存在。
    ERR_SVR_GROUP_GROUPID_IN_USED               = 10021,  // 群组 ID 已被使用，请选择其他的群组 ID。
    ERR_SVR_GROUP_SEND_MSG_FREQ_LIMIT           = 10023,  // 发消息的频率超限，请延长两次发消息时间的间隔。
    ERR_SVR_GROUP_REQ_ALLREADY_BEEN_PROCESSED   = 10024,  // 此邀请或者申请请求已经被处理。
    ERR_SVR_GROUP_GROUPID_IN_USED_FOR_SUPER     = 10025,  // 群组 ID 已被使用，并且操作者为群主，可以直接使用。
    ERR_SVR_GROUP_SDKAPPID_DENY                 = 10026,  // 该 SDKAppID 请求的命令字已被禁用。
    ERR_SVR_GROUP_REVOKE_MSG_NOT_FOUND          = 10030,  // 请求撤回的消息不存在。
    ERR_SVR_GROUP_REVOKE_MSG_TIME_LIMIT         = 10031,  // 消息撤回超过了时间限制（默认2分钟）。
    ERR_SVR_GROUP_REVOKE_MSG_DENY               = 10032,  // 请求撤回的消息不支持撤回操作。
    ERR_SVR_GROUP_NOT_ALLOW_REVOKE_MSG          = 10033,  // 群组类型不支持消息撤回操作。
    ERR_SVR_GROUP_REMOVE_MSG_DENY               = 10034,  // 该消息类型不支持删除操作。
    ERR_SVR_GROUP_NOT_ALLOW_REMOVE_MSG          = 10035,  // 音视频聊天室和在线成员广播大群不支持删除消息。
    ERR_SVR_GROUP_AVCHATROOM_COUNT_LIMIT        = 10036,  // 音视频聊天室创建数量超过了限制，请参考 [价格说明](https://cloud.tencent.com/document/product/269/11673) 购买预付费套餐“IM音视频聊天室”。
    ERR_SVR_GROUP_COUNT_LIMIT                   = 10037,  // 单个用户可创建和加入的群组数量超过了限制，请参考 [价格说明](https://cloud.tencent.com/document/product/269/11673) 购买或升级预付费套餐“单人可创建与加入群组数”。
    ERR_SVR_GROUP_MEMBER_COUNT_LIMIT            = 10038,  // 群成员数量超过限制，请参考 [价格说明](https://cloud.tencent.com/document/product/269/11673) 购买或升级预付费套餐“扩展群人数上限”。
};

#endif  // __V2TIM_ERROR_CODE_H__
