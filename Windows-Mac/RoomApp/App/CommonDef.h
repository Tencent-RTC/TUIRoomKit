#pragma once
#include <QFile>
#include <QString>
#include "Common.h"

static constexpr char kAppName[] = "RoomApp";
static constexpr char kAppVersion[] = "1.0.0.0";

static constexpr int kShareItemWidth  = 200;
static constexpr int kShareItemHeight = 150;
static constexpr int kShareItemSpace  = 30;
static constexpr int kShareItemMargin = 40;
static constexpr int kShareIconWidth  = 80;
static constexpr int kShareIconHeight = 80;

enum class MemberOperate {
    kMuteMicrophone = 1,
    kMuteCamera = 2,
    kOnStage = 3,
    kKickOffUser = 4,
    kAgreeSpeak = 5,
    kDisAgreeSpeak = 6,
    kForbidSpeak = 7,
    kForbidMicrophone = 8,
    kForbidCamera = 9
};

enum class LoginError {
    kNoError = 0,
    kGetAppIdFail = 1,
    kUserVerifyByPictureFail = 2,
    kUserLoginByCodeFail = 3,
    kUserLoginByTokenFail = 4,
    kUserLogoutFail = 5,
    kUserDeleteFail = 6,
    kUserUpdateFail = 7,
    kUserQueryFail = 8,
};

enum class MemberStatus {
    kStageUp = 0,
    kInvited = 1,
    kApplied = 2,
    kStageDown = 3,
};

enum class StageListDirection {
    kHorDirection = 1,
    kVerDirection = 2
};

class NetToolTip {
 public:
    int app_cpu = 0;    // 当前App CPU占用率 (Current app's CPU utilization)
    int rtt = 0;        // 网络延时 (Network latency)
    int downLoss = 0;   // 下行丢包率 (Downstream packet loss rate)
};
struct UserNetQualityInfo {
	std::string user_id;
	// 网络质量，参见 TRTCTypeDef.h 的 TRTCQuality 枚举
    // Network quality. For more information, see `TRTCQuality` enumerations of `TRTCTypeDef.h`
	int quality;
    UserNetQualityInfo() : quality(0) {}
};

struct UserLoginInfo {
    std::string user_id;
    std::string user_sig;
    std::string name;
    int sdk_app_id;

    UserLoginInfo() 
        : sdk_app_id(0) {
    }
};
