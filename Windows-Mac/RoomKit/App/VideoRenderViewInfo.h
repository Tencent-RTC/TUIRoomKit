#pragma once

#include <QWidget>
#include "ui_VideoRenderViewInfo.h"
#include "CommonDef.h"
#include "TUIRoomCore.h"

class VideoRenderViewInfo : public QWidget
{
    Q_PROPERTY(bool has_mic READ HasMic)
    Q_PROPERTY(bool has_video READ HasVideo)
    Q_PROPERTY(int voice_level READ VoiceLevel)
    Q_OBJECT

public:
    VideoRenderViewInfo(QWidget *parent = nullptr);
    ~VideoRenderViewInfo();

    void UpdateUserInfo(const TUIUserInfo& info);
    void SetVoiceLevel(int voice_level);
    void InitMainVideo();
    void UserStartScreenShare(const std::string& user_id, bool is_main_window = true);
    void ShowMainVideo();
    
public slots:
    bool HasMic() const;
    bool HasVideo() const;
    bool VoiceLevel() const;
    void OnNetStatistics(const NetToolTip& net_tooltip);
    void OnNetQuality(UserNetQualityInfo local_user_quality, std::vector<UserNetQualityInfo> remote_users_quality);
protected:
    void paintEvent(QPaintEvent* event);
    bool eventFilter(QObject *obj, QEvent *event);
private:
    TUIUserInfo user_info_;
    Ui::VideoRenderViewInfo* ui_;
    int voice_level_ = 0;
    NetToolTip  net_tooltip_;
    QString net_quality_;
};
