#include <QPainter>
#include <QPalette>
#include <QDebug>
#include <thread>
#include <QTimer>
#include <QBitmap>
#include "VideoRenderView.h"
#include "CommonDef.h"
#include "DataStore.h"
#include "MessageDispatcher/MessageDispatcher.h"

VideoRenderView::VideoRenderView(QWidget *parent, bool is_screen_share_window)
    : QWidget(parent)
    , is_screen_share_window_(is_screen_share_window) {
    ui_ = new Ui::VideoRenderView();
    ui_->setupUi(this);
    qApp->installEventFilter(this);
    InitUi();
    InitConnect();
}

VideoRenderView::~VideoRenderView() {
    delete ui_;
}

void VideoRenderView::InitUi() {
    LOAD_STYLE_SHEET(":/VideoRenderView/VideoRenderView/VideoRenderView.qss");
    video_head_ = new VideoRenderViewInfo(ui_->border_widget);

#ifdef _WIN32
    video_head_->setAttribute(Qt::WA_TranslucentBackground);
    video_head_->setWindowFlags(video_head_->windowFlags() | Qt::FramelessWindowHint | Qt::Tool);
    video_head_->setMaximumHeight(30);
    video_head_->setMinimumHeight(30);
    int width = ui_->border_widget->width() - 5;
    video_head_->setMaximumWidth(width);
    video_head_->setMinimumWidth(width);
    video_head_->setFixedSize(ui_->border_widget->width() - 5, 30);
    video_head_->hide();
#else
    video_head_->setWindowFlags(video_head_->windowFlags() | Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
    video_head_->setMaximumHeight(25);
    video_head_->setMinimumHeight(25);
    int width = ui_->border_widget->width();
    video_head_->resize(width, 25);
    video_head_->show();
#endif

    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
}
void VideoRenderView::StopCurrentVideo() {
    if (user_info_.user_id.empty())
        return;

    const TUIUserInfo* local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user->user_id == user_info_.user_id) {
        if (local_user->has_video_stream && !is_screen_share_window_) {
            TUIRoomCore::GetInstance()->UpdateCameraPreview(NULL);
        }
    } else {
        TUIRoomCore::GetInstance()->StopRemoteView(user_info_.user_id,
            is_screen_share_window_ ? TUIStreamType::kStreamTypeScreen : TUIStreamType::kStreamTypeCamera);
    }

    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
}
void VideoRenderView::ResetBackgroundImage() {
    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
}
void VideoRenderView::UpdateCameraPreview() {
    is_screen_share_window_ = false;
    const TUIUserInfo* local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user->user_id == user_info_.user_id) {
        TUIRoomCore::GetInstance()->UpdateCameraPreview(this->GetPlayWindow());
        if (local_user->has_video_stream) {
            ui_->stackedWidget->setCurrentIndex(1);
            ui_->video_view->setUpdatesEnabled(false);
        } else {
            ui_->video_view->setUpdatesEnabled(true);
            ui_->stackedWidget->setCurrentIndex(0);
        }
    }

    if (video_head_ != NULL && is_main_window_) {
        video_head_->UserStartScreenShare(user_info_.user_id, is_main_window_ && is_screen_share_window_);
    }
}

void VideoRenderView::InitConnect() {
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnFirstVideoFrame,
        this, &VideoRenderView::SlotOnFirstVideoFrame);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnUserVoiceVolume,
        this, &VideoRenderView::SlotOnUserVoiceVolume);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnStatistics, this, &VideoRenderView::OnNetStatistics);
}
void VideoRenderView::PopVideoTip(bool top) {
#ifdef _WIN32
    if (video_head_ != nullptr) {
        video_head_->setAttribute(Qt::WA_TranslucentBackground);
        if (top) {
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool | Qt::WindowStaysOnTopHint);
        } else {
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool | Qt::WindowStaysOnTopHint);
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool);
        }
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        video_head_->setFixedSize(width, 30);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_window_?15:0));
        video_head_->show();
        if (!this->parentWidget()->isVisible()) {
            video_head_->hide();
        }
    }
#endif
}

void VideoRenderView::resizeEvent(QResizeEvent* event) {
#ifdef _WIN32
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        video_head_->setFixedSize(width, 30);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_window_?15:0));
        if (this->isVisible() && this->isActiveWindow()) {
            video_head_->show();
        }
    }
#else
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width();
        video_head_->resize(width, 25);
    }
#endif
    QWidget::resizeEvent(event);
}

void VideoRenderView::showEvent(QShowEvent* event) {
#ifdef _WIN32
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_window_ ? 15 : 0));
        if (this->isActiveWindow())
            video_head_->show();
    }
#else
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width();
        video_head_->resize(width, 25);
    }
#endif
    QWidget::showEvent(event);
}

bool VideoRenderView::eventFilter(QObject *obj, QEvent *event) {
#ifdef _WIN32
    if (video_head_ != nullptr) {
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_window_ ? 15 : 0));
        if (this == obj && event->type() != QEvent::Paint && event->type() != QEvent::LayoutRequest) {
            if (event->type() == QEvent::Hide || event->type() == QEvent::Close) {
                video_head_->hide();
            } else if (event->type() == QEvent::Show) {
                if (this->isActiveWindow()) {
                    video_head_->show();
                    video_head_->raise();
                }
            } else if (event->type() == QEvent::WindowActivate) {
                video_head_->show();
                video_head_->raise();
            }
        }
    }
#else
    if ((user_info_.has_subscribed_video_stream && user_info_.has_video_stream)
        || (user_info_.has_subscribed_screen_stream && user_info_.has_screen_stream)) {
        if (obj == this && event->type() == QEvent::Enter) {
            video_head_->show();
        } else if (obj == this && event->type() == QEvent::Leave) {
            video_head_->hide();
        }
    } else if (video_head_ != NULL) {
        video_head_->show();
    }
#endif
    return QWidget::eventFilter(obj, event);
}

void VideoRenderView::InitMainVideo() {
    is_main_window_ = true;
    is_screen_share_window_ = false;
    user_info_.user_id = "";
    user_info_.user_name = "";
    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
    ui_->widget_back->layout()->setSpacing(0);
    ui_->widget_back->layout()->setMargin(0);
    ui_->widget_back->setStyleSheet("border:0px;border-radius:0px;background-color:black");
    ui_->background_label->setFixedSize(300, 217);
    ui_->background_label->setStyleSheet("border-image:url(:/ImageResource/TXCloud.png);");
    if (video_head_ != nullptr) {
        video_head_->InitMainVideo();
    }
}

void VideoRenderView::UserStartScreenShare(const std::string& user_id) {
    const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    user_info_ = *user_info;

    is_screen_share_window_ = true;
    auto play_window = GetPlayWindow();
    TUIRoomCore::GetInstance()->StartRemoteView(user_id, play_window, TUIStreamType::kStreamTypeScreen);
    if (video_head_ != nullptr) {
        video_head_->UserStartScreenShare(user_id, is_main_window_ && is_screen_share_window_);
    }
}

void VideoRenderView::mouseDoubleClickEvent(QMouseEvent* event) {
    // 如果自己正在屏幕分享，则不响应。
    const TUIUserInfo* local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user->has_screen_stream) {
        return QWidget::mouseDoubleClickEvent(event);
    }

    // 当用户没有视频时，不显示在大画面
    if (!is_screen_share_window_ && !user_info_.has_video_stream) {
        return QWidget::mouseDoubleClickEvent(event);
    }

    if (!user_info_.user_id.empty()) {
        if (is_main_window_) {
            DoubleClickMainWindow();
        } else {
            DoubleClickStageWindow();
        }
    }
}

void VideoRenderView::DoubleClickMainWindow() {
    if (is_screen_share_window_) {
        return;
    }
    emit SignalRemoveVideoFromMainScreen(user_info_.user_id);
}

void VideoRenderView::DoubleClickStageWindow() {
    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
    emit SignalShowVideoOnMainScreen(user_info_.user_id, is_screen_share_window_);
}

std::string VideoRenderView::GetUserId() {
    return user_info_.user_id;
}

bool VideoRenderView::IsScreenShareWindow() {
    return is_screen_share_window_;
}

void VideoRenderView::StartPreview() {
    is_screen_share_window_ = false;
    auto play_window = GetPlayWindow();
    if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id) {
        TUIRoomCore::GetInstance()->StartCameraPreview(play_window);
    } else {
        TUIRoomCore::GetInstance()->StartRemoteView(user_info_.user_id, play_window);
    }

    if (video_head_ != NULL && is_main_window_) {
        video_head_->UserStartScreenShare(user_info_.user_id, is_main_window_ && is_screen_share_window_);
    }
}

void VideoRenderView::StopPreview() {
    if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id) {
        TUIRoomCore::GetInstance()->StopCameraPreview();
    } else {
        TUIRoomCore::GetInstance()->StopRemoteView(user_info_.user_id,
            is_screen_share_window_ ? TUIStreamType::kStreamTypeScreen : TUIStreamType::kStreamTypeCamera);
    }

    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);

    if (is_main_window_) {
        InitMainVideo();
    }
    if (video_head_ != nullptr) {
        video_head_->UserStartScreenShare(user_info_.user_id, is_main_window_ && is_screen_share_window_);
    }
}

void VideoRenderView::UpdateUserInfo(const TUIUserInfo& user_info) {
    user_info_ = user_info;

    if (user_info.has_video_stream || (is_screen_share_window_ && user_info.has_screen_stream)) {
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);
    } else {
        ui_->video_view->setUpdatesEnabled(true);
        ui_->stackedWidget->setCurrentIndex(0);
    }

    if (video_head_ != NULL) {
        if (is_main_window_) {
            video_head_->UserStartScreenShare(user_info_.user_id, is_main_window_ && is_screen_share_window_);
        } else {
            video_head_->UpdateUserInfo(user_info_);
        }
    }
}

void VideoRenderView::RemoveUser() {
    ui_->video_view->setUpdatesEnabled(true);
    ui_->stackedWidget->setCurrentIndex(0);
    user_info_.user_id = "";
    user_info_.has_audio_stream = false;
    user_info_.has_video_stream = false;
    user_info_.has_screen_stream = false;
    if (video_head_ != nullptr) {
        video_head_->UpdateUserInfo(user_info_);
    }
}

liteav::TXView VideoRenderView::GetPlayWindow() {
    return reinterpret_cast<liteav::TXView>(ui_->video_view->winId());
}

void VideoRenderView::SlotOnFirstVideoFrame(const QString& user_id, const TUIStreamType streamType) {
    if (streamType == TUIStreamType::kStreamTypeScreen && user_id.toStdString() == user_info_.user_id) {
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);
        if (video_head_ != nullptr) {
            video_head_->UserStartScreenShare(user_id.toStdString(), is_main_window_ && is_screen_share_window_);
        }
        return;
    }
    // 当前窗口用户还未设置，或屏幕分享的流不显示
    if (user_info_.user_id == "" || streamType != TUIStreamType::kStreamTypeCamera) {
        return;
    }
    if ((DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id && user_id.isEmpty())
        || user_id.toStdString() == user_info_.user_id) {
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);

        if (video_head_ != nullptr && !user_id.isEmpty() && user_id.toStdString() == user_info_.user_id) {
            const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
            video_head_->UpdateUserInfo(*user_info);
        }
    }
}

void VideoRenderView::SlotOnUserVoiceVolume(const QString& user_id, int volume) {
    if (user_info_.user_id == "" || video_head_ == NULL) {
        return;
    }
    if ((DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id && user_id.isEmpty())
        || user_id.toStdString() == user_info_.user_id) {
        int voice_level = volume / 10 - (volume % 10 > 0 ? 1 : 0);
        voice_level = voice_level > 0 ? voice_level : 0;
        ui_->border_widget->setStyle(QApplication::style());
        video_head_->SetVoiceLevel(voice_level);
    }
}

void VideoRenderView::OnNetStatistics(const liteav::TRTCStatistics& statis) {
    if (video_head_ != nullptr) {
        NetToolTip net_tooltip;
        // 网络延时
        net_tooltip.rtt = statis.rtt;
        // 下行丢包率
        net_tooltip.downLoss = statis.downLoss;

        std::string local_user_id = DataStore::Instance()->GetCurrentUserInfo().user_id;
        if (local_user_id != user_info_.user_id) {
            for (int i = 0; i < statis.remoteStatisticsArraySize; ++i) {
                std::string user_id(statis.remoteStatisticsArray[i].userId);
                if (user_id == user_info_.user_id && statis.remoteStatisticsArray[i].streamType == liteav::TRTCVideoStreamTypeBig) {
                    net_tooltip.downLoss = statis.remoteStatisticsArray[i].finalLoss;
                    break;
                }
            }
        }
        video_head_->OnNetStatistics(net_tooltip);
    }
}
