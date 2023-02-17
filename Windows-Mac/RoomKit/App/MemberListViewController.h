#ifndef __MEMBER_LIST_VIEW_CONTROL_H__
#define __MEMBER_LIST_VIEW_CONTROL_H__

#include <QWidget>
#include <QDialog>
#include "TUIRoomCore.h"
#include "CommonDef.h"
#include "ViewDragger.h"
#include "ui_MemberListViewController.h"

class MemberListViewController : public QDialog {
    Q_OBJECT

public:
    MemberListViewController(const TUIUserInfo& user_info, QWidget *parent);
    ~MemberListViewController();

    void InsertUser(const TUIUserInfo& user_info);
    void RemoveUser(const std::string& user_id);
    void UpdateUserInfo(const std::string& user_id);
    void SlotUpdateUserInfo(const TUIUserInfo& user_info);
    void SetMaster(const std::string& user_name);

protected:
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
private:
    void InitUi();
    void InitConnect();
    void UpdateMaster(const std::string& user_id);
    void ShowMemberCount();

    void MemberListMuteUserMic(const std::string& user_id);
    void MemberListMuteUserCamera(const std::string& user_id);
    void MemberListKickOffUser(const std::string& user_id);
private slots:
    void SlotOnRemoteUserEnterRoom(const QString& user_id);
    void SlotOnRemoteUserLeaveRoom(const QString& user_id);
    void SlotOnRemoteUserVideoOpen(const QString& user_id, bool available);
    void SlotOnRemoteUserAudioOpen(const QString& user_id, bool available);
    void SlotOnRemoteUserEnterSpeechState(const QString& user_id);
    void SlotOnRemoteUserExitSpeechState(const QString& user_id);
    void SlotOnRoomMasterChanged(const QString& user_id);

    void SlotOnMemberOperate(MemberOperate operate, const std::string& user_id);
    
    void SlotForbidCamera(bool checked);
    void SlotForbidMic(bool checked);

    bool ForbidCamera() const;
    bool ForbidMic() const;
private:
    std::vector<std::string> member_list;
    TUIUserInfo user_info_;
    ViewDragger view_dragger_;
    Ui::MemberListViewController* ui_;
    bool forbid_camera_ = false;
    bool forbid_mic_ = false;
};

#endif