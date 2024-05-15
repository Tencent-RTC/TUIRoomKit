#include <QNetworkRequest>
#include <QNetWorkReply>
#include <QNetworkAccessManager>
#include <QSslConfiguration>
#include <QJsonDocument>
#include <QJsonObject>
#include "DataReport.h"
#include "log.h"

static constexpr char kAppId[] = "winTUIRoomExternal";
static constexpr char kReportId[] = "rGIwJhOtJCxYWpFRDD";
static constexpr char kReportUrl[] = "https://aegis.qq.com/collect/events";
static constexpr char kAppLaunch[] = "appLaunch";
static constexpr char kAppRegister[] = "appRegister";
static constexpr char kAppUpdate[] = "appUpdate";
static constexpr char kRoomLaunch[] = "roomLaunch";
static constexpr char kEnterRoom[] = "enterRoom";
static constexpr char kOpenChatRoom[] = "openChatRoom";
static constexpr char kSendChatMessage[] = "sendChatMessage";
static constexpr char kOpenSetting[] = "openSetting";
static constexpr char kOpenCamera[] = "openCamera";
static constexpr char kOpenMicrophone[] = "openMicrophone";
static constexpr char kStartScreenSharing[] = "startScreenSharing";
static constexpr char kOpenMemberlist[] = "openMemberlist";

DataReport* DataReport::instance_ = nullptr;
std::mutex DataReport::mutex_;

DataReport::DataReport() {
    InitReportType();
}

DataReport::~DataReport() {}

DataReport* DataReport::Instance() {
    if (instance_ == nullptr) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (instance_ == nullptr) {
            instance_ = new (std::nothrow)DataReport;
        }
    }

    return instance_;
}

void DataReport::DestoryInstance() {}

void DataReport::SetSdkAppId(int sdkappid, bool is_online) {
    sdkappid_ = sdkappid;
    is_online_ = is_online;
}

void DataReport::OperateReport(ReportType report_type, int code) {
    if (!NeedReprot(report_type)) {
        // 该类型已经上报过一次，不需要再上报。
        return;
    }
    QNetworkAccessManager* network_access_manager = new QNetworkAccessManager();
    QString request_url = GenerateReportJson(report_type, code);
    QNetworkRequest network_request;
    network_request.setUrl(QUrl(request_url));
    network_request.setHeader(QNetworkRequest::ContentTypeHeader, QVariant("application/json"));
    LINFO("Report Url is %s,type is %d,code is %d", request_url.toStdString().c_str(), report_type, code);
    network_access_manager->get(network_request);
    connect(network_access_manager, &QNetworkAccessManager::finished, this, [=](QNetworkReply* network_reply) {
        if (network_reply == nullptr) {
            return;
        }
        if (network_reply->error() == QNetworkReply::NoError) {
            reported_map_.insert(report_type);
            QByteArray response_data = network_reply->readAll();
            LINFO("OperatorReport response %s", response_data.data());
        } else {
            QVariant status_code = network_reply->attribute(QNetworkRequest::HttpStatusCodeAttribute);
            LINFO("OperatorReport failed , status_code : %d, error_code : %d ,error : %s",
                status_code.toInt(), static_cast<int>(network_reply->error()),
                network_reply->errorString().toStdString().c_str());
        }
        network_reply->deleteLater();
        network_access_manager->deleteLater();
        });
}

QString DataReport::GenerateReportJson(ReportType report_type, int code) {
    /*
    * 请求参数
    * "https://aegis.qq.com/collect/events?payload=[{\"name\":\"test1\",\"ext1\":\"ext1\",\"ext2\":\"ext2\",\"ext3\":\"ext3\"}]&id=rGIwJhOtJCxYWpFRDD&uin=1627546960");
    */
    std::string report_name = report_map_[report_type];
    std::string ext1 = report_name;
    if (report_type == ReportType::kEnterRoom) {
        if (code == 0) {
            ext1 = "enterRoom-success";
        } else {
            ext1 = "enterRoom-failed#error:" + std::to_string(code);
        }
    }
    QString report_url = QString("%1?payload=[{\"name\":\"%2\",\"ext1\":\"%3\",\"ext2\":\"%4\",\"ext3\":\"%5\"}]&id=%6&uin=%7")
        .arg(kReportUrl).arg(report_name.c_str()).arg(ext1.c_str()).arg(kAppId).arg(sdkappid_).arg(kReportId).arg(sdkappid_);
    return report_url;
}

void DataReport::InitReportType() {
    report_map_[ReportType::kAppLaunch] = kAppLaunch;
    report_map_[ReportType::kAppRegister] = kAppRegister;
    report_map_[ReportType::kAppUpdate] = kAppUpdate;
    report_map_[ReportType::kRoomLaunch] = kRoomLaunch;
    report_map_[ReportType::kEnterRoom] = kEnterRoom;
    report_map_[ReportType::kOpenChatRoom] = kOpenChatRoom;
    report_map_[ReportType::kSendChatMessage] = kSendChatMessage;
    report_map_[ReportType::kOpenSetting] = kOpenSetting;
    report_map_[ReportType::kOpenCamera] = kOpenCamera;
    report_map_[ReportType::kOpenMicrophone] = kOpenMicrophone;
    report_map_[ReportType::kStartScreenSharing] = kStartScreenSharing;
    report_map_[ReportType::kOpenMemberlist] = kOpenMemberlist;
}

bool DataReport::NeedReprot(ReportType report_type) {
    if (is_online_ && std::string(kAppId) != "winTUIRoom") {
        return false;
    } else if (!is_online_ && std::string(kAppId) == "winTUIRoom") {
        return false;
    }
    if (reported_map_.find(report_type) == reported_map_.end()) {
        return true;
    }
    return false;
}