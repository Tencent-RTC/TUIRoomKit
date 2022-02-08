#pragma once
#include <QObject>
#include <QMainWindow>
#include <QMouseEvent>
#include <QDesktopWidget>
#include "ui_MainWindow.h"
#include "ViewDragger.h"
#include "StageListController.h"
#include "ChatRoomViewController.h"
#include "BottomBarController.h"
#include "TopBarController.h"
#include "PopStageListController.h"
#include "TransferRoomController.h"

#define PADDING 10
enum MouseDirection { UP = 0, DOWN = 1, LEFT, RIGHT, LEFTTOP, LEFTBOTTOM, RIGHTBOTTOM, RIGHTTOP, NONE };
class MainWindowLayout : public QObject {
    Q_OBJECT
public:
    MainWindowLayout(QMainWindow* main_window);
    ~MainWindowLayout();

    void SetMainWindowUi(Ui::MainWindow* ui);
    StageListController* GetStageListController();
    ChatRoomViewController* GetChatRoomViewController();
    BottomBarController* GetBottomBarController();
    TopBarController* GetTopBarController();
    BottomBarController* GetShareMenuBar();
    PopStageListController* GetPopStageListController();
    VideoRenderView* GetMainWidgetController();

    void InitConnect();
    void InitLayout();

    void PopUpBottomBar(bool popups);
    void PopUpChatRoom(bool popups);

    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void mouseDoubleClickEvent(QMouseEvent *event);
    void showEvent(QShowEvent* event);
    void resizeEvent(QResizeEvent *event);
    void ResetArrowCursor();

    void ResizeMove(QMouseEvent* event);
    void Region(const QPoint &currentGlobalPoint);
    void RemoteUserScreenOpen(const std::string& user_id);
    void RemoteUserScreenClose(const std::string& user_id);

    void ShowTransferRoomWindow();
public slots:
    void SlotShowSetting(int index);
    void SlotShowChatRoom(bool show);
    void SlotOnRemoteUserScreenAvailable(const QString& user_id, bool available);
    void SlotShowVideoOnMainScreen(const std::string& user_id);
    void SlotStageListLayoutChanged(StageListDirection direction);
private:
    QMainWindow*    main_window_ = nullptr;
    Ui::MainWindow* main_window_ui_ = nullptr;
    ViewDragger     view_dragger_;

    StageListController*        stage_list_view_control_ = nullptr;
    ChatRoomViewController*     chat_room_view_control_ = nullptr;
    BottomBarController*        bottom_menu_bar_ = nullptr;
    TopBarController*           top_menu_bar_ = nullptr;
    VideoRenderView*            main_widget_control_ = nullptr;

    BottomBarController*        share_menu_bar_ = nullptr;
    PopStageListController*     pop_widget_ = nullptr;

    SettingViewController*      setting_ = nullptr;
    MouseDirection          resize_dir_;
    bool is_resize_pressed_ = false;

    TransferRoomController* transfer_room_window_ = nullptr;
};

