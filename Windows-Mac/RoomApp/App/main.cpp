#include <QApplication>
#include <QDir>
#include <QIcon>
#include <QTextStream>
#include "MainWindow.h"
#include "LoginViewController.h"
#include "CommonDef.h"
#include "ScreenCenter.h"
#include "DataStore.h"
#include "../utils/UserDirectory.h"
#include "../utils/log.h"
#ifdef _WIN32
#include "crash_dump.h"
#endif

int main(int argc, char* args[]) {
    std::string log_path = UserDirectory::GetUserLogFilePath();
    SET_LOG_PATH(log_path, kAppName);
#ifdef _WIN32
    //crash
    std::unique_ptr<CrashDump> crash_dump = std::make_unique<CrashDump>();
    if (crash_dump) {
        QString sdk_version = TUIRoomCore::GetInstance()->GetSDKVersion();
#ifdef _WIN64
        std::string app_info = "Rooms_x64";
#else
        std::string app_info = "Rooms_x86";
#endif  // _WIN64
        crash_dump->Init(app_info,sdk_version.toStdString());
    }
    // 确定缩放比例，适应高dpi显示
    HDC screen = GetDC(NULL);
    double dpi = GetDeviceCaps(screen, LOGPIXELSX);
    ReleaseDC(NULL, screen);
    QString scale = QString("%0").arg(ScreenCenter::Instance()->GetScaleByDpi(dpi));
    qputenv("QT_SCALE_FACTOR", scale.toStdString().c_str());
#endif
    QApplication::setAttribute(Qt::AA_UseOpenGLES);
    QApplication a(argc, args);
    a.setApplicationName(kAppName);
    DataStore::Instance()->ParseStartParam(argc, args);
    ScreenCenter::Instance()->GetAllScreens();
	QString workDir = QCoreApplication::applicationDirPath();
    QDir::setCurrent(workDir); 
    QApplication::addLibraryPath(workDir);
    a.setWindowIcon(QIcon(":/ImageResource/trtc.ico"));

    LINFO("This is Main Function");
    LINFO("This is log path %s", log_path.c_str());

    qApp->setStyleSheet("QLabel, QLineEdit, QToolButton, QPushButton, QProgressBar, QRadioButton {font-size: 14px;}");

    LoginViewController* login_view_controller = new LoginViewController;
    login_view_controller->show();

	return a.exec();
}
