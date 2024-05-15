#include <QPainter>
#include <QStyleOption>
#include "VideoRenderViewInfo.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "DataStore.h"

VideoRenderViewInfo::VideoRenderViewInfo(QWidget *parent)
    : QWidget(parent)
    , net_quality_(tr("Unknow")) {
    ui_ = new Ui::VideoRenderViewInfo();
    ui_->setupUi(this);
    this->setWindowTitle(kAppName);
    ui_->net_btn->installEventFilter(this);

    setAttribute(Qt::WA_TranslucentBackground, true);

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnNetworkQuality, this, &VideoRenderViewInfo::OnNetQuality);
    
    LOAD_STYLE_SHEET(":/VideoRenderView/VideoRenderView/VideoRenderViewInfo.qss");
}

VideoRenderViewInfo::~VideoRenderViewInfo() {
    delete ui_;
}

void VideoRenderViewInfo::UpdateUserInfo(const TUIUserInfo& info) {
    user_info_ = info;
    if (user_info_.user_name.length() != 0) {
        ui_->name_label->setText(QString::fromStdString(info.user_name));
    } else {
        ui_->name_label->setText(QString::fromStdString(info.user_id));
    }
    ui_->mic_btn->setStyle(QApplication::style());
    ui_->name_label->setToolTip(ui_->name_label->text());
}

void VideoRenderViewInfo::SetVoiceLevel(int voice_level) {
    voice_level_ = voice_level;

    QString voice_image_ = QString(":/VoiceLevel/VoiceLevel/mic_on_%1.png").arg(voice_level);

    QString style_sheet = QString("[has_mic=\"true\"] QPushButton#mic_btn {\
            border-image:url(%1);\
        }").arg(voice_image_);

    ui_->mic_btn->setStyleSheet(style_sheet);
    ui_->mic_btn->setStyle(QApplication::style());
}

void VideoRenderViewInfo::paintEvent(QPaintEvent* event) {
    QStyleOption opt;
    opt.init(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
    return QWidget::paintEvent(event);
}
bool VideoRenderViewInfo::eventFilter(QObject *obj, QEvent *event) {
    if (event->type() == QEvent::Enter) {
        if (obj == ui_->net_btn) {
            QString net_info = QString(tr("downloss: %1%\nNetStatus: %2\n")).arg(net_tooltip_.downLoss).arg(net_quality_);
            ui_->net_btn->setToolTip(net_info);
        }
    }
    return QWidget::eventFilter(obj, event);
}

void VideoRenderViewInfo::OnNetStatistics(const NetToolTip& net_tooltip) {
    net_tooltip_.app_cpu = net_tooltip.app_cpu;
    net_tooltip_.rtt = net_tooltip.rtt;
    net_tooltip_.downLoss = net_tooltip.downLoss;
}

bool VideoRenderViewInfo::HasMic() const {
    return user_info_.has_audio_stream;
}

bool VideoRenderViewInfo::HasVideo() const {
    return user_info_.has_video_stream;
}

bool VideoRenderViewInfo::VoiceLevel() const {
    return voice_level_;
}
void VideoRenderViewInfo::OnNetQuality(UserNetQualityInfo local_user_quality, \
    std::vector<UserNetQualityInfo> remote_users_quality) {
    int quality = 0;
    if (user_info_.user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
        quality = local_user_quality.quality;
    } else {
        for (int i = 0; i < remote_users_quality.size(); i++) {
			std::string user_id = remote_users_quality[i].user_id;
            if (user_info_.user_id == user_id) {
                quality = remote_users_quality[i].quality;
                break;
            }
        }
    }
    switch (quality) {
    case liteav::TRTCQuality_Unknown:
        net_quality_ = tr("Unknow");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/network.png);}");
        break;
    case liteav::TRTCQuality_Excellent:
        net_quality_ = tr("Excellent");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_full.png);}");
        break;
    case liteav::TRTCQuality_Good:
        net_quality_ = tr("Good");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_good.png);}");
        break;
    case liteav::TRTCQuality_Poor:
        net_quality_ = tr("Poor");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_poor.png);}");
        break;
    case liteav::TRTCQuality_Bad:
        net_quality_ = tr("Bad");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_normal.png);}");
        break;
    case liteav::TRTCQuality_Vbad:
        net_quality_ = tr("Very bad");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_normal.png);}");
        break;
    case liteav::TRTCQuality_Down:
        net_quality_ = tr("Down");
        ui_->net_btn->setStyleSheet("QPushButton{border-image: url(:/MainWindow/MainWindow/net_bad.png);}");
        break;
    }
}

void VideoRenderViewInfo::InitMainVideo() {
    ui_->name_label->hide();
    ui_->mic_btn->hide();
    ui_->net_btn->hide();
}

void VideoRenderViewInfo::ShowMainVideo() {
    ui_->name_label->show();
    ui_->mic_btn->show();
    ui_->net_btn->show();
}

void VideoRenderViewInfo::UserStartScreenShare(const std::string& user_id, bool is_main_window) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    std::string user_name = user_id;
    if (user_info->user_name.length() != 0) {
        user_name = user_info->user_name;
    }
    user_info_.user_id = user_id;
    user_info_.user_name = user_name;
    QString text_name = QString::fromStdString(user_name);
    if (is_main_window) {
        ui_->name_label->setMinimumWidth(200);
        ui_->name_label->setMaximumWidth(200);
        text_name = QString(tr("%0 is sharing")).arg(QString::fromStdString(user_name));
    }
    ui_->name_label->setText(text_name);
    ui_->name_label->show();
    ui_->name_label->setToolTip(text_name);
}
