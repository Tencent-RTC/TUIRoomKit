#include "MemberItemView.h"
#include "TUIRoomCore.h"
#include "CommonDef.h"
#include "DataStore.h"
#include "MessageDispatcher/MessageDispatcher.h"

MemberItemView::MemberItemView(TUIRole role, const TUIUserInfo& user_info, QWidget* parent)
    :role_(role)
    ,user_info_(user_info)
    ,QWidget(parent){
    ui_ = new Ui::MemberItemView;
    ui_->setupUi(this);

    InitUi();
    InitConnect();
}

MemberItemView::~MemberItemView(){
    delete ui_;
}

void MemberItemView::InitUi() {
    LOAD_STYLE_SHEET(":/MemberItemView/MemberItemView/MemberItemView.qss");

    if (role_ != TUIRole::kMaster) {
        ui_->mic_btn->setEnabled(false);
        ui_->cam_btn->setEnabled(false);
        ui_->control_widget->hide();
    }

    ui_->mic_btn->installEventFilter(this);
    ui_->cam_btn->installEventFilter(this);
}

void MemberItemView::InitConnect() {
    connect(ui_->mic_btn, &QPushButton::clicked, this, &MemberItemView::SlotMemberOperate);
    connect(ui_->cam_btn, &QPushButton::clicked, this, &MemberItemView::SlotMemberOperate);
    connect(ui_->kick_off_btn, &QPushButton::clicked, this, &MemberItemView::SlotMemberOperate);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnUserVoiceVolume, this, &MemberItemView::SlotOnUserVoiceVolume);
}

bool MemberItemView::eventFilter(QObject *watched, QEvent *event) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (event->type() == QEvent::Enter && local_user && local_user->role == TUIRole::kMaster) {
        if (watched == ui_->cam_btn) {
            QString tip = user_info_.has_video_stream ? tr("click to close video") : tr("click to open video");
            ui_->cam_btn->setToolTip(tip);
        } else if (watched == ui_->mic_btn) {
            QString tip = user_info_.has_audio_stream ? tr("click to close audio") : tr("click to open audio");
            ui_->mic_btn->setToolTip(tip);
        }
    }
    return QWidget::eventFilter(watched, event);
}

void MemberItemView::UpdateUserInfo(const std::string& user_id) {
    const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    user_info_.has_audio_stream = user_info->has_audio_stream;
    user_info_.has_video_stream = user_info->has_video_stream;
    user_info_.has_subscribed_audio_stream = user_info->has_subscribed_audio_stream;
    user_info_.has_subscribed_video_stream = user_info->has_subscribed_video_stream;
    if (user_info->user_name.length() != 0) {
        ui_->member_name_label->setText(QString::fromStdString(user_info->user_name));
        ui_->member_name_label->setToolTip(QString::fromStdString(user_info->user_name));
    } else {
        ui_->member_name_label->setText(QString::fromStdString(user_info->user_id));
        ui_->member_name_label->setToolTip(QString::fromStdString(user_info->user_id));
    }
    ui_->mic_btn->setStyle(QApplication::style());
    ui_->cam_btn->setStyle(QApplication::style());
}

std::string MemberItemView::GetUserId() {
    return user_info_.user_id;
}

void MemberItemView::SetMemberStatus(MemberStatus status) {
    speech_mode_ = TUIRoomCore::GetInstance()->GetRoomInfo().mode;
    member_status_ = status;
}

void MemberItemView::UpdateMaster() {
    role_ = TUIRole::kMaster;
    ui_->mic_btn->setEnabled(true);
    ui_->cam_btn->setEnabled(true);
    ui_->control_widget->show();
}

void MemberItemView::SlotMemberOperate() {
    // 成员列表操作，只有主持人有权限
    // Member list operation. Only the host has the permission
    if (role_ != TUIRole::kMaster) {
        return;
    }
    QObject* obj = sender();
    if (obj == ui_->mic_btn) {
        emit SignalMemberOperate(MemberOperate::kMuteMicrophone, user_info_.user_id);
    } else if (obj == ui_->cam_btn) {
        emit SignalMemberOperate(MemberOperate::kMuteCamera, user_info_.user_id);
    } else if (obj == ui_->kick_off_btn) {
        emit SignalMemberOperate(MemberOperate::kKickOffUser, user_info_.user_id);
    }
}

void MemberItemView::SlotOnUserVoiceVolume(const QString& user_id, int volume) {
    if ((DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id && user_id.isEmpty())
        || user_id.toStdString() == user_info_.user_id) {
        int voice_level = volume / 10 - (volume % 10 > 0 ? 1 : 0);
        voice_level = voice_level > 0 ? voice_level : 0;
        QString voice_image = QString(":/VoiceLevel/VoiceLevel/mic_on_%1.png").arg(voice_level);
        QString styleSheet = QString("[has_mic=\"true\"] QPushButton#mic_btn {\
                        border-image:url(%1);}").arg(voice_image);
        ui_->mic_btn->setStyleSheet(styleSheet);
        ui_->mic_btn->setStyle(QApplication::style());
    }
}

bool MemberItemView::HasMic() const{
    return user_info_.has_audio_stream;
}

bool MemberItemView::HasVideo() const{
    return user_info_.has_video_stream;
}

bool MemberItemView::IsOnStage() const{
    return true;
}