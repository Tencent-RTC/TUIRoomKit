#ifndef __USER_DIRECTORY_H__
#define __USER_DIRECTORY_H__

#include <QObject>

class UserDirectory : public QObject {
    Q_OBJECT

public:
    UserDirectory(QObject *parent);
    ~UserDirectory();

    static std::string GetUserLogFilePath();
    static std::string GetUserConfigFile(bool is_app_launch=false);
    static std::string GetUserCrashFilePath();
};
#endif