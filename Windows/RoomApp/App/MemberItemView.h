#pragma once

#include <QWidget>
#include "TUIRoomCore.h"
#include "CommonDef.h"
#include "ui_MemberItemView.h"

class MemberItemView : public QWidget
{
    Q_PROPERTY(bool has_mic READ HasMic)
    Q_PROPERTY(bool has_video READ HasVideo)
    Q_PROPERTY(bool on_stage READ IsOnStage)
    Q_OBJECT

public:
    MemberItemView(TUIRole role, const TUIUserInfo& user_info, QWidget *parent = nullptr);
    ~MemberItemView();

    void UpdateUserInfo(const std::string& user_id);
    std::string GetUserId();
    void UpdateMaster();
    void SetMemberStatus(MemberStatus status);
protected:
    bool eventFilter(QObject *watched, QEvent *event);
private:
    void InitUi();
    void InitConnect();

signals:
    void SignalMemberOperate(MemberOperate oper, const std::string& user_id);

public slots:
    void SlotMemberOperate();
    void SlotOnUserVoiceVolume(const QString& user_id, int volume);
    bool HasMic() const;
    bool HasVideo() const;
    bool IsOnStage() const;

private:
    TUIRole role_;
    TUISpeechMode speech_mode_;
    TUIUserInfo user_info_;
    MemberStatus member_status_;

    Ui::MemberItemView* ui_;
};
