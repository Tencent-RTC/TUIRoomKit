#pragma once

#include <QWidget>
#include <QGridLayout>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <QList>
#include "ui_StageListController.h"
#include "TUIRoomCore.h"
#include "CommonDef.h"
#include "VideoRenderView.h"

class StageListController : public QWidget
{
    Q_OBJECT
    Q_PROPERTY(bool ver_direction READ IsVerticalStageListDirection)
public:
    StageListController(QWidget* parent);
    ~StageListController();
    
    void InsertUser(const TUIUserInfo& user_info, bool is_screen_share);
    void RemoveUser(const std::string& user_id, bool is_screen_share);
    liteav::TXView GetPlayWindow(const std::string& user_id);
    bool IsOnStage(const std::string& user_id);
    
    void ReSizeStage();
    QWidget* PopStageListController();
    void InsertStageList();
    void SetStageListDirection(StageListDirection direction);

    void PopVideoTip(bool top);
    void SetMainWindowView(VideoRenderView* video_view);
private:
    void InitUi();
    void InitConnect();

    void ReSizeRoomStage();
    void ChangeButtonsStatus();
    void ShowPreviousPage();
    void ShowNextPage();
    void RemoveVideoViewFromStage(VideoRenderView* video_view);
    void ClearCurrentPageVideoView();
    void SetVideoViewLayout(StageListDirection direction);
    void UpdateUserInfo(const TUIUserInfo& user_info);
    void UserExit(const std::string& user_id);

    void ChangeCollapseButtonPosition();
    void ChangeCollapseButtonStyle();

    void GridLayoutDeciders(int& row, int& column);
protected:
    bool eventFilter(QObject* watched, QEvent* event);
    void showEvent(QShowEvent* event);

signals:
    void SignalPopStageSizeChanged(int width, int height);
    void SignalShowVideoOnMainScreen(const std::string& user_id, bool is_screen_share_window);
    void SignalReviveScreenShare(const std::string& user_id);
private slots:
    void SlotOnRemoteUserEnterRoom(const QString& user_id);
    void SlotOnRemoteUserLeaveRoom(const QString& user_id);
    void SlotOnRemoteUserVideoOpen(const QString& user_id, bool available);
    void SlotOnRemoteUserAudioOpen(const QString& user_id, bool available);
    void SlotOnRemoteUserEnterSpeechState(const QString& user_id);
    void SlotOnRemoteUserExitSpeechState(const QString& user_id);
    void SlotOnRoomMasterChanged(const QString& user_id);
    void SlotOnRemoteUserScreenVideoOpen(const QString& user_id, bool available);
    void SlotShowVideoOnMainScreen(const std::string user_id, bool is_screen_share_window);
    void SlotRemoveVideoFromMainScreen(const std::string user_id);
    bool IsVerticalStageListDirection() const;

    void SlotUpdateUserInfo(const TUIUserInfo& user_info);

    void UpdateCurrentVideoPage();
private:
    Ui::StageListController* ui_;
    QGridLayout* stage_layout_ = nullptr;
    QHBoxLayout* stage_horizontal_layout_ = nullptr;
    QVBoxLayout* stage_vertical_layout_ = nullptr;

    QList<std::string> all_video_userid_list_;
    QList<std::string> all_screen_share_userid_list_;   // ������������������ʾ�ĸ��� (The substream displayed in the main window is not included)
    QList<VideoRenderView*> current_page_video_view_list_;

    VideoRenderView* main_window_view_ = nullptr;
    int page_size_ = 36;
    int last_video_index_ = 0;
    StageListDirection stage_list_direction_ = StageListDirection::kGridDirection;
    bool is_popup_list_ = false;
    bool is_member_screen_sharing_ = false;
    QPushButton     btn_stage_hide_;
};
