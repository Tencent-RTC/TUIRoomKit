#pragma once

#include <QWidget>
#include <QLabel>
#include <QPushButton>
#include <VideoRenderViewInfo.h>
#include "TUIRoomCore.h"
#include "ui_VideoRenderView.h"

class VideoRenderView : public QWidget
{
    Q_OBJECT

public:
    VideoRenderView(QWidget *parent, bool is_screen_share_window = false);
    ~VideoRenderView();

    void InitUi();
    void InitConnect();
    // 关闭原始View上面的拉流
    // Disable stream pull on the original view
    void StopCurrentVideo();

    std::string GetUserId();
    void UpdateUserInfo(const TUIUserInfo& user_info);
    void StartPreview();
    void StopPreview();
    void UpdateCameraPreview();

    liteav::TXView GetPlayWindow();
    bool IsScreenShareWindow();
    void PopVideoTip(bool top);
    void InitMainVideo();
    void UserStartScreenShare(const std::string& user_id); // 开始屏幕分享
    void DoubleClickMainWindow();
    void DoubleClickStageWindow();

protected:
    void resizeEvent(QResizeEvent* event);
    void showEvent(QShowEvent* event);
    bool eventFilter(QObject *obj, QEvent *event);
    void mouseDoubleClickEvent(QMouseEvent* event);
public slots:
    void SlotOnFirstVideoFrame(const QString& user_id, const TUIStreamType streamType);
    void SlotOnRemoteUserCameraAvailable(const QString& user_id, bool available);
    void SlotOnRemoteUserScreenAvailable(const QString& user_id, bool available);
    void SlotOnUserVoiceVolume(const QString& user_id, int volume);
    void OnNetStatistics(const liteav::TRTCStatistics& statis);
signals:
    void SignalShowVideoOnMainScreen(const std::string user_id, bool is_screen_share_window);
    void SignalRemoveVideoFromMainScreen(const std::string user_id);
private:
    Ui::VideoRenderView* ui_;
    QLabel* pLabel = NULL;

    VideoRenderViewInfo* video_head_ = nullptr;
    TUIUserInfo user_info_;
    bool is_main_window_ = false;         // 是否为主视频页窗口 (Whether it is the main video page window)
    bool is_screen_share_window_ = false; // 是 屏幕分享 还是 摄像头 (Whether it is screen sharing or camera video)
};
