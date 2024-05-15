#ifndef __DATAREPORT_H__
#define __DATAREPORT_H__

#include <QObject>
#include <mutex>
#include <map>
#include <set>

// 上报事件类型
enum class ReportType {
    kAppLaunch = 0,             // TRTCApp启动
    kAppRegister = 1,           // TRTCApp手机或邮箱注册成功
    kAppUpdate = 2,             // TRTCApp更新
    kRoomLaunch = 3,            // RoomApp启动
    kEnterRoom = 4,             // 加入房间
    kOpenChatRoom = 5,          // 打开聊天室
    kSendChatMessage = 6,       // 发送聊天消息
    kOpenSetting = 7,           // 打开设置页面
    kOpenCamera = 8,            // 开启摄像头
    kOpenMicrophone = 9,        // 开启麦克风
    kStartScreenSharing = 10,   // 开始屏幕分享
    kOpenMemberlist = 11,       // 打开成员列表
};

class DataReport : public QObject{
    Q_OBJECT
public:
    
    static DataReport* Instance();
    static void DestoryInstance();

    void OperateReport(ReportType report_type, int code = 0);
    void SetSdkAppId(int sdkappid, bool is_online = false);

private:
    QString GenerateReportJson(ReportType report_type, int code);

    void InitReportType();
    bool NeedReprot(ReportType report_type);

private:
    DataReport();
    ~DataReport();

    static DataReport* instance_;
    static std::mutex mutex_;

    int sdkappid_ = 0;
    bool is_online_ = false;
    std::map<ReportType, std::string> report_map_;  // 上报数据类型映射表
    std::set<ReportType> reported_map_; // 已经上报的类型
};

#endif  // ! __DATAREPORT_H__