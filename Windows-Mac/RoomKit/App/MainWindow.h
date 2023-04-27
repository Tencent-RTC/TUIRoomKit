#pragma once

#include <QMainWindow>
#include "ui_MainWindow.h"
#include "CommonDef.h"
#include "MainWindowLayout.h"
#include "MemberListViewController.h"
#include "PopStageListController.h"
#include "SettingViewController.h"
#include "PresetDeviceController.h"

class LoginViewController;
class MainWindow : public QMainWindow {
    Q_OBJECT

public:
    MainWindow(tuikit::TUISpeechMode speech_mode, QWidget *parent = Q_NULLPTR);
    ~MainWindow();

    void InitShow(bool show_preview_wnd = true);
    void SetLoginView(LoginViewController* login_view);

protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void mouseDoubleClickEvent(QMouseEvent *event);
    void closeEvent(QCloseEvent* event);
    void showEvent(QShowEvent* event);
    void hideEvent(QHideEvent* event);
    void resizeEvent(QResizeEvent *event);
    bool eventFilter(QObject *obj, QEvent *event);
private:
    void ShowUserList();
    void ShowStageList();
    void StageAddMember(const TUIUserInfo& user_info);
    void StageRemoveMember(const std::string& user_id);
    void MemberListAddMember(const TUIUserInfo& user_info);
    void StartLocalCamera();
    void StopLocalCamera();
    void StartLocalMicrophone();
    void StopLocalMicrophone();
    void InitUi();
    void CloseMainWindow();
    void StageUp();
    void StageDown();
    void DealStartCameraError();
    void DealStartMicError();
    void PopupBottomBar(bool checked);
    void AdaptHighDPISize();

signals:
    void SignalShowLoginWind(TUIExitRoomType type_exit_room);

private slots:
    void SlotClose();
    void SlotBottomMenuMuteCamera(bool);
    void SlotBottomMenuMuteMicrophone(bool);
    void SlotShowChatRoom(bool);
    void SlotOnError(int code, const QString& message);
    void SlotOnExitRoom(TUIExitRoomType code, const QString& message);
    void SlotOnAllUserMicrophoneDisableChanged(const QString& room_id,
                                               bool is_disable);
    void SlotOnAllUserCameraDisableChanged(const QString& room_id,
                                           bool is_disable);
    void SlotEndDetection();
    void SlotOnCreateRoom(int code, const QString& message);
    void SlotOnEnterRoom(int code, const QString& message);
    void SlotOnCameraStateChanged(bool has_video, tuikit::TUIChangeReason reason);
    void SlotOnMicrophoneStateChanged(bool has_audio, tuikit::TUIChangeReason reason);
    void SlotOnRequestOpenCameraByAdmin(const QString& request_id);
    void SlotOnRequestOpenMicrophoneByAdmin(const QString& request_id);

    void SlotOnHideMenuBarTimeout();
private:
    Ui::MainWindow ui;
    MemberListViewController* member_list_view_control_ = nullptr;

    StageListController*        stage_list_view_control_ = nullptr;
    TopBarController*           top_menu_bar_ = nullptr;
    VideoRenderView*            main_widget_control_ = nullptr;

    PopStageListController* pop_widget_ = nullptr;
    tuikit::TUISpeechMode speech_mode_;

    LoginViewController* login_view_ = nullptr;
    TUIExitRoomType type_exit_room_ = TUIExitRoomType::kNormal;
    PresetDeviceController* device_preview_ = nullptr;
    bool enter_room_success_ = false;
    bool is_default_close_camera_ = false;
    bool is_default_close_mic_ = false;
    std::string room_id_;
    QTimer      hide_menu_bar_timer_;

    MainWindowLayout*       main_window_layout_ = nullptr;
};
