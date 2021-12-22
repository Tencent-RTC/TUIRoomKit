#pragma once
#include <QFile>
#include <QString>

// 设置App名称
static constexpr char kAppName[] = "RoomApp";
static constexpr char kRoomType[] = "Room_";

// 屏幕分享图片的宽高
static constexpr int kShareItemWidth  = 200;
static constexpr int kShareItemHeight = 150;
static constexpr int kShareItemSpace  = 30;
static constexpr int kShareItemMargin = 40;
static constexpr int kShareIconWidth  = 80;
static constexpr int kShareIconHeight = 80;

// 成员列表的操作：1禁麦 2禁视频 3上下台 4T人
enum class MemberOperate {
    kMuteMicrophone = 1,
    kMuteCamera = 2,
    kOnStage = 3,
    kKickOffUser = 4,
    kAgreeSpeak = 5,
    kDisAgreeSpeak = 6,
    kForbidSpeak = 7,
    kForbidMicrophone   = 8,
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
    kHorDirection = 1,  //水平
    kVerDirection = 2   //垂直
};

enum class Language {
    kChinese = 0,  // 中文
    kEnglish = 1   // 英文
};

enum TXMessageType {
    kNoButton     =   0x0000,
    kOk           =   0x0001,
    kCancel       =   0x0010,
    kLeaveRoom    =   0x0100,
    kDestoryRoom  =   0x1000
};

class NetToolTip {
 public:
    int app_cpu = 0;    // 当前App CPU占用率
    int rtt = 0;        // 网络延时
    int downLoss = 0;   // 下行丢包率
};
struct UserNetQualityInfo {
	///用户 ID
	std::string user_id;
	///网络质量，参见 TRTCTypeDef.h 的 TRTCQuality 枚举
	int quality;
    UserNetQualityInfo() : quality(0) {}
};

// 登录用户信息
struct UserLoginInfo {
    std::string user_id;
    std::string user_sig;
    std::string name;
    int sdk_app_id;

    UserLoginInfo() 
        : sdk_app_id(0) {
    }
};

#define LOAD_STYLE_SHEET(path) {\
	QString qss;\
	QFile qssFile(path);\
	qssFile.open(QFile::ReadOnly);\
	if (qssFile.isOpen())\
	{\
		qss = QLatin1String(qssFile.readAll());\
		this->setStyleSheet(qss);\
		qssFile.close();\
	}\
}

#define DELETE_OBJECT(obj) {\
    if (obj != nullptr) {\
        delete obj;\
        obj = nullptr;\
    }\
}
