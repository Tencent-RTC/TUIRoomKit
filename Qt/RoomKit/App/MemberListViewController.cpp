#include "MemberListViewController.h"
#include "MemberItemView.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "TXMessageBox.h"
#include "StatusUpdateCenter.h"
#include <QMenu>
#include <algorithm>
#include "log.h"

const int kMasterWidth = 410;
const int kMemberWidth = 350;

MemberListViewController::MemberListViewController(const TUIUserInfo& user_info, QWidget* parent)
    :user_info_(user_info)
    ,QDialog(parent)
    ,view_dragger_(this){
    ui_ = new Ui::MemberListViewController();
    ui_->setupUi(this);

    InitUi();
    InitConnect();
}

MemberListViewController::~MemberListViewController(){
    delete ui_;
}

void MemberListViewController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    QDialog::mouseMoveEvent(event);
}

void MemberListViewController::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    QDialog::mousePressEvent(event);
}

void MemberListViewController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    QDialog::mouseReleaseEvent(event);
}

void MemberListViewController::InitUi() {
    LOAD_STYLE_SHEET(":/MemberListViewController/MemberListViewController/MemberListViewController.qss");
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::WindowCloseButtonHint | Qt::Tool);
    ui_->member_list_widget->setFocusPolicy(Qt::NoFocus);
    // 成员端不显示操作功能
    // The operation feature is not displayed on the member's client
    if (user_info_.role != tuikit::TUIRole::kRoomOwner) {
        ui_->control_widget->hide();
        ui_->opeate_widget->hide();
        
        auto member_list = TUIRoomCore::GetInstance()->GetRoomUsers();
        auto it = find_if(member_list.begin(), member_list.end(), [](const TUIUserInfo& user_info) {
            return user_info.role == tuikit::TUIRole::kRoomOwner;
        });
        if (it == member_list.end()) {
            return; 
        }
        if (it->user_name.length() != 0) {
            ui_->master_name_label->setText(QString::fromStdString(it->user_name));
        } else {
            ui_->master_name_label->setText(QString::fromStdString(it->user_id));
        }
        this->setMaximumWidth(kMemberWidth);
        this->setMinimumWidth(kMemberWidth);
    } else {
        ui_->control_widget->show();
        ui_->forbid_camera_widget->show();
        ui_->forbid_mic_widget->show();
        if (user_info_.user_name.length() != 0) {
            ui_->master_name_label->setText(QString::fromStdString(user_info_.user_name));
        } else {
            ui_->master_name_label->setText(QString::fromStdString(user_info_.user_id));
        }
        this->setMaximumWidth(kMasterWidth);
        this->setMinimumWidth(kMasterWidth);
    }
    ShowMemberCount();
    this->raise();
}

void MemberListViewController::InitConnect() {
    connect(ui_->close_btn, &QPushButton::clicked, this, [=]() {
        hide();
    });

    connect(ui_->forbid_mic_btn, &QRadioButton::clicked, this, &MemberListViewController::SlotForbidMic);
    connect(ui_->forbid_camera_btn, &QRadioButton::clicked, this, &MemberListViewController::SlotForbidCamera);

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserEnter, this, &MemberListViewController::SlotOnRemoteUserEnterRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserLeave, this, &MemberListViewController::SlotOnRemoteUserLeaveRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserCameraAvailable, this, &MemberListViewController::SlotOnRemoteUserVideoOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserAudioAvailable, this, &MemberListViewController::SlotOnRemoteUserAudioOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRoomMasterChanged, this, &MemberListViewController::SlotOnRoomMasterChanged);
    
    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalUpdateUserInfo, this, &MemberListViewController::SlotUpdateUserInfo);
}

void MemberListViewController::InsertUser(const TUIUserInfo& user_info) {
    ShowMemberCount();
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(user_info_.user_id);
    if (local_user->role != user_info_.role) {
        user_info_ = *local_user;
        InitUi();
    }
    TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
    if (user_info.role == tuikit::TUIRole::kRoomOwner) {
        SetMaster(user_info.user_name);
        return;
    }
    if (std::find(member_list.begin(), member_list.end(), user_info.user_id) != member_list.end()) {
        return;
    }
    QListWidgetItem* item = new QListWidgetItem;
    item->setFlags(item->flags() & Qt::NoItemFlags & ~Qt::ItemIsSelectable);
    MemberItemView* view = new MemberItemView(user_info_.role, user_info);
    view->UpdateUserInfo(user_info.user_id);
    connect(view, SIGNAL(SignalMemberOperate(MemberOperate,const std::string&)), this, SLOT(SlotOnMemberOperate(MemberOperate, const std::string&)));
    int width = ui_->member_list_widget->width() ;
    int height = 40;
    view->resize(width, height);
    item->setSizeHint(QSize(width, height));
    ui_->member_list_widget->addItem(item);
    ui_->member_list_widget->setItemWidget(item,view);
    member_list.push_back(user_info.user_id);
}
void MemberListViewController::SlotOnMemberOperate(MemberOperate operate, const std::string& user_id) {
    LINFO("Master MemberListControlUser, user_id :%s, opreation:%d", user_id.c_str(), operate);
    switch (operate) {
    case MemberOperate::kMuteMicrophone:
        MemberListMuteUserMic(user_id);
        break;
    case MemberOperate::kMuteCamera:
        MemberListMuteUserCamera(user_id);
        break;
    case MemberOperate::kKickOffUser:
        MemberListKickOffUser(user_id);
        break;
    default:
        break;
    }
}
void MemberListViewController::MemberListMuteUserMic(const std::string& user_id) {
    LINFO("Master MemberListMuteUserMic, user_id :%s", user_id.c_str());
    const TUIUserInfo* remote_user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (remote_user_info == nullptr) {
        return;
    }

    bool mute = remote_user_info->has_audio_stream && remote_user_info->has_subscribed_audio_stream;
    if (mute) {
        TUIRoomCore::GetInstance()->MuteUserMicrophone(user_id, mute, nullptr);
        //emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*remote_user_info);
    } else {
        auto callback = [=](RequestCallbackType type, const std::string& error_message) {
            LINFO("MuteUserMicrophone result type : %d,error_message :%s", (int)type, error_message.c_str());
            if (type == RequestCallbackType::kRequestRejected) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on microphone rejected."));
            } else if (type == RequestCallbackType::kRequestTimeout) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on microphone timeout."));
            } else if (type == RequestCallbackType::kRequestError) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on microphone error."));
            }
        };
      TUIRoomCore::GetInstance()->MuteUserMicrophone(user_id, mute, callback);
    }
}
void MemberListViewController::MemberListMuteUserCamera(const std::string& user_id) {
    LINFO("Master MemberListMuteUserCamera, user_id :%s", user_id.c_str());
    const TUIUserInfo* remote_user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (remote_user_info == nullptr) {
        return;
    }

    bool mute = remote_user_info->has_video_stream && remote_user_info->has_subscribed_video_stream;
    // 关闭时直接设置状态， 打开时按照流的状态回调里设置
    // Disabled: Directly set the status. Enabled: Set the status according to the stream status callback
    if (mute) {
        TUIRoomCore::GetInstance()->MuteUserCamera(user_id, mute, nullptr);
        //emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*remote_user_info);
    } else {
        auto callback = [=](RequestCallbackType type, const std::string& error_message) {
            LINFO("MuteUserCamera result type : %d,error_message :%s", (int)type, error_message.c_str());
            if (type == RequestCallbackType::kRequestRejected) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on camera rejected."));
            } else if (type == RequestCallbackType::kRequestTimeout) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on camera timeout."));
            } else if (type == RequestCallbackType::kRequestError) {
                TXMessageBox::Instance().AddLineTextMessage(tr("Request to turn on camera error."));
            }
        };
        TUIRoomCore::GetInstance()->MuteUserCamera(user_id, mute, callback);
    }
}
void MemberListViewController::MemberListKickOffUser(const std::string& user_id) {
    LINFO("Master MemberListKickOffUser, user_id :%s", user_id.c_str());
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    auto callback = [=](RequestCallbackType type, const std::string& error_message) {
        if (type == RequestCallbackType::kRequestError) {
            LINFO("KickOffUser result type : %d,error_message :%s", (int)type, error_message.c_str());
        }
    };
    TUIRoomCore::GetInstance()->KickOffUser(user_id, callback);
}

void MemberListViewController::RemoveUser(const std::string& user_id) {
    ShowMemberCount();
    auto user = member_list.end();
    if ((user = std::find(member_list.begin(), member_list.end(), user_id)) != member_list.end()) {
        member_list.erase(user);
    }
    for (int i = 0; i < ui_->member_list_widget->count(); ++i) {
        QListWidgetItem* item = ui_->member_list_widget->item(i);
        MemberItemView* view = static_cast<MemberItemView*>(ui_->member_list_widget->itemWidget(item));
        if (view->GetUserId() == user_id) {
            ui_->member_list_widget->takeItem(i);
            delete item;
            delete view;
            return;
        }
    }
}
void MemberListViewController::SlotUpdateUserInfo(const TUIUserInfo& user_info) {
    this->UpdateUserInfo(user_info.user_id);
}
void MemberListViewController::UpdateUserInfo(const std::string& user_id) {
    for (int i = 0; i < ui_->member_list_widget->count(); ++i) {
        QListWidgetItem* item = ui_->member_list_widget->item(i);
        MemberItemView* view = static_cast<MemberItemView*>(ui_->member_list_widget->itemWidget(item));
        if (view->GetUserId() == user_id) {
            view->UpdateUserInfo(user_id);
            return;
        }
    }
}

void MemberListViewController::UpdateMaster(const std::string& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info != nullptr) {
        if (user_info->user_name.length() != 0) {
            ui_->master_name_label->setText(QString::fromStdString(user_info->user_name));
        } else {
            ui_->master_name_label->setText(QString::fromStdString(user_info->user_id));
        }
    }
    if (user_info_.user_id == user_id) {
        user_info_.role = tuikit::TUIRole::kRoomOwner;
        for (int i = 0; i < ui_->member_list_widget->count(); ++i) {
            QListWidgetItem* item = ui_->member_list_widget->item(i);
            MemberItemView* view = static_cast<MemberItemView*>(ui_->member_list_widget->itemWidget(item));
            view->UpdateMaster();
        }
        this->setMaximumWidth(kMasterWidth);
        this->setMinimumWidth(kMasterWidth);
        ui_->control_widget->show();
        ui_->opeate_widget->show();
        ui_->forbid_camera_widget->show();
        ui_->forbid_mic_widget->show();
        if (user_info_.user_name.length() != 0) {
            ui_->master_name_label->setText(QString::fromStdString(user_info_.user_name));
        } else {
            ui_->master_name_label->setText(QString::fromStdString(user_info_.user_id));
        }
    }
}

void MemberListViewController::SetMaster(const std::string& user_name) {
    if (user_name.length() != 0) {
        ui_->master_name_label->setText(QString::fromStdString(user_name));
    }
}

void MemberListViewController::SlotOnRemoteUserEnterRoom(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    InsertUser(*user_info);
}

void MemberListViewController::SlotOnRemoteUserLeaveRoom(const QString& user_id) {
    RemoveUser(user_id.toStdString());
}

void MemberListViewController::SlotOnRemoteUserVideoOpen(const QString& user_id, bool available) {
    UpdateUserInfo(user_id.toStdString());
}

void MemberListViewController::SlotOnRemoteUserAudioOpen(const QString& user_id, bool available) {
    UpdateUserInfo(user_id.toStdString());
}

void MemberListViewController::SlotOnRemoteUserEnterSpeechState(const QString& user_id) {
    UpdateUserInfo(user_id.toStdString());
}

void MemberListViewController::SlotOnRemoteUserExitSpeechState(const QString& user_id) {
    UpdateUserInfo(user_id.toStdString());
}

void MemberListViewController::SlotOnRoomMasterChanged(const QString& user_id) {
    RemoveUser(user_id.toStdString());
    UpdateMaster(user_id.toStdString());

    if (user_id.toStdString() == user_info_.user_id) {
        bool camera_muted = TUIRoomCore::GetInstance()->GetRoomInfo().is_all_camera_muted;
        ui_->forbid_camera_btn->setChecked(camera_muted);
        if (camera_muted) {
            ui_->forbid_camera_btn->setText(tr("open all video"));
        } else {
            ui_->forbid_camera_btn->setText(tr("forbid all video"));
        }
        bool microphone_muted = TUIRoomCore::GetInstance()->GetRoomInfo().is_all_microphone_muted;
        ui_->forbid_mic_btn->setChecked(microphone_muted);
        if (microphone_muted) {
            ui_->forbid_mic_btn->setText(tr("open all mic"));
        } else {
            ui_->forbid_mic_btn->setText(tr("forbid all mic"));
        }

        user_info_ = *TUIRoomCore::GetInstance()->GetUserInfo(user_info_.user_id);
    }
}

bool MemberListViewController::ForbidCamera() const {
    return forbid_camera_;
}

bool MemberListViewController::ForbidMic() const {
    return forbid_mic_;
}

void MemberListViewController::SlotForbidMic(bool checked) {
	LINFO("MemberListViewController::SlotForbidMic %d", checked);
    if (checked) {
        ui_->forbid_mic_btn->setText(tr("open all mic"));
    } else {
        ui_->forbid_mic_btn->setText(tr("forbid all mic"));
    }
    TUIRoomCore::GetInstance()->MuteAllUsersMicrophone(checked);
}

void MemberListViewController::SlotForbidCamera(bool checked) {
	LINFO("MemberListViewController::SlotForbidCamera %d", checked);
    if (checked) {
        ui_->forbid_camera_btn->setText(tr("open all video"));
    } else {
        ui_->forbid_camera_btn->setText(tr("forbid all video"));
    }
    TUIRoomCore::GetInstance()->MuteAllUsersCamera(checked);
}

void MemberListViewController::ShowMemberCount() {
    int member_count = TUIRoomCore::GetInstance()->GetRoomUsers().size();
    ui_->member_count_label->setText(QString(tr("%1")).arg(member_count));
}
