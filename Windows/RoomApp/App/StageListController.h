#pragma once

#include <QWidget>
#include <QGridLayout>
#include <QHBoxLayout>
#include <QVBoxLayout>
#include <list>
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

    void InsertUser(const TUIUserInfo& user_info);
    void RemoveUser(const std::string& user_id);
    liteav::TXView GetPlayWindow(const std::string& user_id);
    bool IsOnStage(const std::string& user_id);
    
    void ReSizeStage();
    QWidget* PopStageListController();
    void InsertStageList();
    void SetStageListDirection(StageListDirection direction);

    void PopVideoTip(bool top);
    void ShowVideoTip(bool show, bool is_minimized = false);
    void AddMainVideo(VideoRenderView* video_view);
private:
    // 初始化相关
    void InitUi();
    void InitConnect();
    void InitRoomLayout();

    // Ui相关
    void ReSizeRoomStage();
    void ChangeButtonsStatus();
    void ShowPreviousPage();
    void ShowNextPage();
    void RemoveVideoViewFromStage(VideoRenderView* video_view);
    void ReplaceVideoViewFromStage(VideoRenderView* new_video_view, VideoRenderView* old_video_view);
    void AddMaster(const TUIUserInfo& user_info);
    void AddLocalUser(const TUIUserInfo& user_info);
    void ClearCurrentPageVideoView();
    void SetCurrentPageVideoView(std::list<VideoRenderView*> video_view_list);
    void SetVideoViewLayout(StageListDirection direction);
    int GetVideoViewPos(const std::string& user_id);
    void ChangeMaster(const std::string& user_id);
    void MoveScreenShareUserToHead(const std::string& user_id);
    void MoveScreenShareUserToBehind(const std::string& user_id);
    void UserStopScreenShare(const std::string& user_id);
    void UpdateUserInfo(const TUIUserInfo& user_info);

    std::list<VideoRenderView*> GetPreviousPage();
    std::list<VideoRenderView*> GetNextPage();
    void RemoveVideoView(std::string user_id);
    VideoRenderView* ReplaceVideoView(std::string user_id);
    void ChangeCollapseButtonPosition();
    void ChangeCollapseButtonStyle();
protected:
    bool eventFilter(QObject* watched, QEvent* event);
    void showEvent(QShowEvent* event);

signals:
    void SignalPopStageSizeChanged(int width, int height);
    void SignalShowVideoOnMainScreen(const std::string& user_id);
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
    void SlotShowVideoOnMainScreen(const std::string& user_id);
    void SlotInsertScreenOnStage(const std::string& user_id);
    void SlotReviveScreenShare(const std::string& user_id);
    void SlotReviveVideo(const std::string& user_id);
    bool IsVerticalStageListDirection() const;

    void SlotUpdateUserInfo(const TUIUserInfo& user_info);
private:
    Ui::StageListController* ui_;
    QGridLayout* stage_layout_ = nullptr;
    QHBoxLayout* stage_horizontal_layout_ = nullptr;
    QVBoxLayout* stage_vertical_layout_ = nullptr;
    std::list<VideoRenderView*> all_video_view_list_;
    std::list<VideoRenderView*> current_page_video_view_list_;
    VideoRenderView* master_video_view_ = nullptr;
    VideoRenderView* main_video_view_ = nullptr;
    VideoRenderView* screen_share_video_view_ = nullptr;
    int page_size_ = 6;
    int last_video_index_ = 0;
    StageListDirection stage_list_direction_ = StageListDirection::kHorDirection;
    bool is_popup_list_ = false;
    bool is_member_screen_sharing_ = false;
    bool is_mainwindow_minimized_ = false;
    QPushButton     btn_stage_hide_;
};
