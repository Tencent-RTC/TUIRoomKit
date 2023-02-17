#pragma once

#include <QWidget>
#include "ui_LoginViewController.h"
#include "MainWindow.h"
#include "CommonDef.h"
#include "ViewDragger.h"

#include <QTranslator>
#include <QApplication>

class LoginViewController : public QWidget
{
    Q_OBJECT

public:
    LoginViewController(QWidget *parent = nullptr);
    ~LoginViewController();

    void InitUi();
    void InitConnect();
    QString GetRoomID();

private:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
protected:
    void ShowExitWnd(TUIExitRoomType type_exit_room);
    void showEvent(QShowEvent* event);
    void resizeEvent(QResizeEvent* event);
    void closeEvent(QCloseEvent* event);

private slots:
    void OnSwitchLanguage(bool language_zh);
    void OnLogout();
    void SlotEnterRoom();
    void SlotOnShowLoginWin(TUIExitRoomType type_exit_room);
    void SlotOnLogin(int code, const QString& message);
    void SlotOnError(int code, const QString& message);
private:
    Ui::LoginViewController* ui_;
    MainWindow* main_window_ = nullptr;
    TUISpeechMode speech_mode_;
    ViewDragger view_dragger_;

    QTranslator* translator_zh_ = nullptr;
    QTranslator* translator_en_ = nullptr;

    UserLoginInfo user_login_info_;
};
