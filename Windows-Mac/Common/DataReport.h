#ifndef __DATAREPORT_H__
#define __DATAREPORT_H__

#include <QObject>
#include <mutex>
#include <map>
#include <set>

// �ϱ��¼�����
enum class ReportType {
    kAppLaunch = 0,             // TRTCApp����
    kAppRegister = 1,           // TRTCApp�ֻ�������ע��ɹ�
    kAppUpdate = 2,             // TRTCApp����
    kRoomLaunch = 3,            // RoomApp����
    kEnterRoom = 4,             // ���뷿��
    kOpenChatRoom = 5,          // ��������
    kSendChatMessage = 6,       // ����������Ϣ
    kOpenSetting = 7,           // ������ҳ��
    kOpenCamera = 8,            // ��������ͷ
    kOpenMicrophone = 9,        // ������˷�
    kStartScreenSharing = 10,   // ��ʼ��Ļ����
    kOpenMemberlist = 11,       // �򿪳�Ա�б�
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
    std::map<ReportType, std::string> report_map_;  // �ϱ���������ӳ���
    std::set<ReportType> reported_map_; // �Ѿ��ϱ�������
};

#endif  // ! __DATAREPORT_H__