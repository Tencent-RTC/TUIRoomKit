#ifndef __BOTTOM_MENU_BAR_H__
#define __BOTTOM_MENU_BAR_H__

#include <QWidget>
#include <QLabel>
#include <QMenu>
#include <QAction>
#include <QWidgetAction>
#include <QCheckBox>
#include <QTimer>
#include <QPainter>
#include <QButtonGroup>
#include "ViewDragger.h"
#include "TXMessageBox.h"
#include "ui_BottomBarController.h"
#include "TUIRoomDef.h"
#include "ScreenShareWindow.h"
#include "SmallTopBarController.h"

class BottomBarController : public QWidget{
    Q_OBJECT

public:
    BottomBarController(QWidget *parent = Q_NULLPTR);
    ~BottomBarController();

    void InitUI();

    void SetShareScreenStyle(bool is_sharing_screen);
    void MoveToTop(QWidget* main_widget);
    void ExcludeShareWindow();

    void SetHasVideo(bool has_video);
    void SetHasAudio(bool has_audio);
    void SetEnableScreenShare(bool enable_screen_share);
    void SetShowChatRoom(bool show);
    void CloseWin();
    void IncreaseHandsupNum();

    void SetCurrentScreenShower(QString user_id);
    void SetChatRoomBtnStatus(bool show);
protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void closeEvent(QCloseEvent *event);
    void paintEvent(QPaintEvent* event);

private:
    void InitCameraDeviceItem();
    void ClearCameraMenu();
    void InitAudioDeviceItem();
    void ClearAudioMenu();
    void ShowTopWidget();
    void UpdateStatus(const TUIUserInfo& info);

    void StartSharing();
    void StopSharing();
#ifdef __APPLE__
    bool IsScreenRecordAuthorized();
    void RequestScreenRecordAccess(QString title, QString message);
#endif

public slots:
    void OnCameraClicked(bool checked);
    void OnAudioClicked(bool checked);
    void OnShareClicked(bool checked);
    void OnCameraSetClicked(bool checked);
    void OnAudioSetClicked(bool checked);
    void OnScreenShareSetClicked(bool checked);
    void OnMemberClicked(bool checked);
    void OnChatRoomClicked(bool checked);
    void OnBtnEndClicked();

    void OnCameraMenuTriggered(bool checked);
    void OnAudioSetTriggered(bool checked);
    void OnSpeakerSetTriggered(bool checked);
    void OnMicrophoneSetTriggered(bool checked);
    void OnScreenShareMenuTriggered();

    void OnHideBarTimeOut();

    void OnConfirmShareScreen(bool share);

    void SlotScreenCaptureStopped(int reason);

    void SlotUpdateUserInfo(const TUIUserInfo& info);
signals:
    void SignalStartScreen(bool checked);
    void SignalCameraClicked(bool checked);
    void SignalAudioClicked(bool checked);
    void SignalChatRoomClicked(bool checked);
    void SignalShowMemberList();
    void SignalShowSetting(int index);
    void SignalLeaveRoom();

private:
    Ui::BottomBarController ui;
    ViewDragger view_dragger_;
    bool is_sharing_screen_ = false;
    bool show_chatroom_ = false;
    SmallTopBarController* share_top_widget_ = nullptr;

    QMenu* pMenu_camera_ = NULL;
    QWidgetAction* pAction_camera_select_ = NULL;
    QAction* pAction_camera_set_ = NULL;
    QAction* pAction_beauty_set_ = NULL;
    std::vector<QWidgetAction*> pAction_camera_list_;
    QMap<QCheckBox*, QString> map_menu_ckbox_;
    QButtonGroup    camera_btn_group_;

    QMenu* pMenu_audio_ = NULL;
    QWidgetAction* pAction_speaker_select_ = NULL;
    QWidgetAction* pAction_microphone_select_ = NULL;
    QAction* pAction_audio_set_ = NULL;
    std::vector<QWidgetAction*> pAction_speaker_list_;
    std::vector<QWidgetAction*> pAction_microphone_list_;
    QButtonGroup    speaker_btn_group_;
    QButtonGroup    microphone_btn_group_;

    QMenu* pMenu_share_ = NULL;
    QAction* pAction_share_screen_ = NULL;

    QTimer         hide_bar_timer_;

    QLabel*         label_member_num_ = nullptr;
    tuikit::TUIRole         role_;

    std::string screen_shower_id_ = "";
    ScreenShareWindow* screen_share_window_ = nullptr;
};

#endif  //  !__BOTTOM_MENU_BAR_H__
