#include "UserDirectory.h"
#include <QDir>
#ifdef _WIN32
#include <windows.h>
#else
#include <QStandardPaths>
#endif

#include "../App/CommonDef.h"

UserDirectory::UserDirectory(QObject *parent)
    : QObject(parent) {
}

UserDirectory::~UserDirectory() {
}
std::string UserDirectory::GetUserLogFilePath() {
    std::string log_path;
#ifdef _WIN32
    // HomeLocation +"/AppData/Roaming/liteav/log/" + APP_NAME + "/";
    char appdata_path[MAX_PATH];
    GetEnvironmentVariableA("appdata", appdata_path, MAX_PATH);
    log_path = std::string(appdata_path) + "/liteav/log/" + kAppName + "/";
    QDir log_dir(QString::fromStdString(log_path));
    if (!log_dir.exists()) {
        log_dir.mkdir(QString::fromStdString(log_path));
    }
#else
    // DocumentsLocation + "/log/";
    log_path = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation).toStdString() + "/log/";
#endif
    return log_path;
}
std::string UserDirectory::GetUserConfigFile(bool is_app_launch) {
    std::string config_file;
#ifdef _WIN32
    // QStandardPaths::HomeLocation + "/AppData/Roaming/liteav/" + APP_NAME + "/config.ini";
    char appdata_path[MAX_PATH];
    GetEnvironmentVariableA("appdata", appdata_path, MAX_PATH);
    if (is_app_launch) {
        config_file = std::string(appdata_path) + "/liteav/TRTCApp/config.ini";
    } else {
        config_file = std::string(appdata_path) + "/liteav/" + kAppName + "/config.ini";
    }
#else
    // QStandardPaths::DocumentsLocation + "/log/config.ini";
    config_file = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation).toStdString() +
        "/log/config.ini";
#endif
    return config_file;
}
std::string UserDirectory::GetUserCrashFilePath() {
    std::string crash_file_path;
#ifdef _WIN32
    // QStandardPaths::HomeLocation + "/AppData/Roaming/liteav/log/" + APP_NAME + "/";
    char appdata_path[MAX_PATH];
    GetEnvironmentVariableA("appdata", appdata_path, MAX_PATH);
    crash_file_path = std::string(appdata_path) + "/liteav/log/" + kAppName + "/";
#else
    // QStandardPaths::DocumentsLocation + "/log/";
    crash_file_path = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation).toStdString() + "/log/";
#endif
    return crash_file_path;
}
std::string UserDirectory::GetUserDownloadFilePath() {
    std::string download_file_path;
#ifdef _WIN32
    // QStandardPaths::HomeLocation + "/AppData/Roaming/liteav/" + APP_NAME + "/setup.exe";
    char appdata_path[MAX_PATH];
    GetEnvironmentVariableA("appdata", appdata_path, MAX_PATH);
    download_file_path = std::string(appdata_path) + "/liteav/" + kAppName + "/setup.exe";
#else
    download_file_path = QStandardPaths::writableLocation(QStandardPaths::DocumentsLocation).toStdString() + "/log/setup.dmg";
#endif
    return std::move(download_file_path);
}