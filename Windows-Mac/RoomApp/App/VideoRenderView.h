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
    // �ر�ԭʼView���������
    void StopCurrentVideo();
    // ����֡ô����ǰ����ʾĬ�ϱ�����ͼ
    void ResetBackgroundImage();

    std::string GetUserId();
    void UpdateUserInfo(const TUIUserInfo& user_info);
    void StartPreview();
    void StopPreview();
    void RemoveUser();
    void UpdateCameraPreview();

    liteav::TXView GetPlayWindow();
    bool IsScreenShareWindow();
    void PopVideoTip(bool top);
    void InitMainVideo();
    void UserStartScreenShare(const std::string& user_id); // ��ʼ��Ļ����
    void DoubleClickMainWindow();
    void DoubleClickStageWindow();

protected:
    void resizeEvent(QResizeEvent* event);
    void showEvent(QShowEvent* event);
    bool eventFilter(QObject *obj, QEvent *event);
    void mouseDoubleClickEvent(QMouseEvent* event);
public slots:
    void SlotOnFirstVideoFrame(const QString& user_id, const TUIStreamType streamType);
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
    bool is_main_window_ = false;         // �Ƿ�Ϊ����Ƶҳ����
    bool is_screen_share_window_ = false; // �� ��Ļ���� ���� ����ͷ
};
