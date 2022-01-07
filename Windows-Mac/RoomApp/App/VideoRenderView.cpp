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

VideoRenderView::VideoRenderView(QWidget *parent)
    : QWidget(parent) {
    ui_ = new Ui::VideoRenderView();
    ui_->setupUi(this);
    qApp->installEventFilter(this);
    InitUi();
    InitConnect();
    this->hide();
}

VideoRenderView::~VideoRenderView() {
    delete ui_;
}

void VideoRenderView::InitUi() {
    LOAD_STYLE_SHEET(":/VideoRenderView/VideoRenderView/VideoRenderView.qss");
    video_head_ = new VideoRenderViewInfo(ui_->border_widget);
    video_head_->setAttribute(Qt::WA_TranslucentBackground);
    video_head_->setWindowFlags(video_head_->windowFlags() | Qt::FramelessWindowHint | Qt::Tool | Qt::X11BypassWindowManagerHint);
    video_head_->setMaximumHeight(30);
    video_head_->setMinimumHeight(30);
    int width = ui_->border_widget->width() - 5;
    video_head_->setMaximumWidth(width);
    video_head_->setMinimumWidth(width);
    video_head_->setFixedSize(ui_->border_widget->width() - 5, 30);
    video_head_->hide();

    ui_->stackedWidget->setCurrentIndex(0);
    ui_->video_view->setUpdatesEnabled(true);
}

void VideoRenderView::InitConnect() {
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnFirstVideoFrame,
        this, &VideoRenderView::SlotOnFirstVideoFrame);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnUserVoiceVolume,
        this, &VideoRenderView::SlotOnUserVoiceVolume);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnStatistics, this, &VideoRenderView::OnNetStatistics);
}
void VideoRenderView::PopVideoTip(bool top) {
    if (video_head_ != nullptr) {
        video_head_->setAttribute(Qt::WA_TranslucentBackground);
        if (top) {
#ifdef __APPLE__
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::Tool);
            //video_head_->setAttribute(Qt::WA_MacAlwaysShowToolWindow);
#else
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool | Qt::WindowStaysOnTopHint);
#endif
            is_mainwindow_minimized_ = false;
        } else {
#ifdef __APPLE__
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::Tool);
            //video_head_->setAttribute(Qt::WA_MacAlwaysShowToolWindow);
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool);
#else
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool | Qt::WindowStaysOnTopHint);
            video_head_->setWindowFlags(Qt::FramelessWindowHint | Qt::Tool);
#endif
        }
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        video_head_->setFixedSize(width, 30);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_video_?15:0));
        video_head_->show();
        if (!is_on_current_page_ || !isVisible()) {
            video_head_->hide();
        }
    }
}

void VideoRenderView::ShowVideoTip(bool show, bool is_minimized) {
    is_mainwindow_minimized_ = is_minimized;
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        video_head_->setFixedSize(width, 30);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_video_?15:0));
        video_head_->setVisible(show && this->isVisible() && !is_mainwindow_minimized_);
    }
}
void VideoRenderView::resizeEvent(QResizeEvent* event) {
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        video_head_->setFixedSize(width, 30);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_video_?15:0));
        if (this->isVisible() && !is_mainwindow_minimized_) {
            video_head_->show();
        }
    }
    QWidget::resizeEvent(event);
}

void VideoRenderView::showEvent(QShowEvent* event) {
    if (video_head_ != nullptr) {
        int width = ui_->border_widget->width() - 5;
        video_head_->setMaximumWidth(width);
        video_head_->setMinimumWidth(width);
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_video_?15:0));
        if (!is_mainwindow_minimized_)
            video_head_->show();
    }
    QWidget::showEvent(event);
}

void VideoRenderView::hideEvent(QHideEvent* event) {
    if (video_head_ != nullptr) {
        video_head_->hide();
    }
    //StopPreview();

    QWidget::hideEvent(event);
}

bool VideoRenderView::eventFilter(QObject *obj, QEvent *event) {
    if (video_head_ != NULL) {
        QPoint global_pos = mapToGlobal(ui_->border_widget->pos());
        video_head_->move(global_pos.x(), global_pos.y() + (is_main_video_?15:0));
        if (obj == this) {
            if (event->type() == QEvent::Hide || event->type() == QEvent::Close) {
                video_head_->hide();
            } else if (event->type() == QEvent::Enter) {
                ShowVideoTip(true, false);
            }
        }
    }
    return QWidget::eventFilter(obj, event);
}
void VideoRenderView::paintEvent(QPaintEvent* event) {
    ShowVideoTip(true, is_mainwindow_minimized_);
    QWidget::paintEvent(event);
}

void VideoRenderView::InitMainVideo() {
    is_main_video_ = true;
    is_user_screen_sharing_ = false;
    user_info_.user_id = "";
    ui_->stackedWidget->setCurrentIndex(0);
    ui_->video_view->setUpdatesEnabled(true);
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
    if (is_main_video_ == false) {
        return;
    }
    if (user_info_.user_id.length() != 0) {
        ReviveUserVideo();
    }
    user_info_.user_id = user_id;
    is_user_screen_sharing_ = true;
    auto play_window = GetPlayWindow();
    TUIRoomCore::GetInstance()->StartRemoteView(user_id, play_window, TUIStreamType::kStreamTypeScreen);
    if (video_head_ != nullptr) {
        video_head_->UserStartScreenShare(user_id);
    }
}

void VideoRenderView::UserStopScreenShare() {
    if (is_user_screen_sharing_) {
        is_user_screen_sharing_ = false;
        InitMainVideo();
    }
}

void VideoRenderView::ScreenShareOnStage(const std::string& user_id) {
    is_screen_on_stage_ = true;
    user_info_.user_id = user_id;
    is_user_screen_sharing_ = true;
    auto play_window = GetPlayWindow();
    TUIRoomCore::GetInstance()->StartRemoteView(user_id, play_window, TUIStreamType::kStreamTypeScreen);
    if (video_head_ != nullptr) {
        video_head_->UserStartScreenShare(user_id, false);
    }
}

void VideoRenderView::SlotReviveScreenShare(const std::string& user_id) {
    if (user_info_.user_id.length() != 0) {
        ReviveUserVideo();
    }
    user_info_.user_id = user_id;
    is_user_screen_sharing_ = true;
    auto play_window = GetPlayWindow();
    TUIRoomCore::GetInstance()->StartRemoteView(user_id, play_window, TUIStreamType::kStreamTypeScreen);
    if (video_head_ != nullptr) {
        video_head_->UserStartScreenShare(user_id);
    }
}

void VideoRenderView::ShowUserVideo(const std::string& user_id) {
    // 当有人在屏幕分享时，将屏幕分享移动到麦上
    if (is_user_screen_sharing_) {
        TUIRoomCore::GetInstance()->StopRemoteView(user_info_.user_id, TUIStreamType::kStreamTypeScreen);
        emit SignalInsertScreenOnStage(user_info_.user_id);
        user_info_.user_id = "";
        user_info_.user_name = "";
        UserStopScreenShare();
    }
    // 当有人已经显示在主窗口上时，需要先还原
    if (user_info_.user_id.length() != 0) {
        ReviveUserVideo();
    }
    ui_->background_label->setFixedSize(300, 240);
    ui_->background_label->setStyleSheet("border-image:url(:/VideoRenderView/VideoRenderView/background.png);");
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    user_info_ = *user_info;
    if (video_head_ != nullptr) {
        video_head_->UpdateUserInfo(user_info_);
        video_head_->ShowMainVideo();
    }
}

void VideoRenderView::StopUserVideo(const std::string& user_id) {
    // 双击后取消视频订阅。
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    if (user_info->user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
        TUIRoomCore::GetInstance()->StopCameraPreview();
    } else {
        TUIRoomCore::GetInstance()->StopRemoteView(user_id, TUIStreamType::kStreamTypeCamera);
    }
}

void VideoRenderView::ReviveUserVideo() {
    StopUserVideo(user_info_.user_id);
    InitMainVideo();
    std::string user_id = user_info_.user_id;
    user_info_.user_id = "";
    user_info_.user_name = "";
    emit SignalReviveVideo(user_id);
}

void VideoRenderView::mouseDoubleClickEvent(QMouseEvent* event) {
    // 麦上双击功能暂不启动
    return QWidget::mouseDoubleClickEvent(event);

    if (user_info_.user_id.length() == 0) {
        return;
    }
    if (is_screen_on_stage_) {
        // 屏幕分享窗口显示在麦上列表
        TUIRoomCore::GetInstance()->StopRemoteView(user_info_.user_id, TUIStreamType::kStreamTypeScreen);
        emit SignalReviveScreenShare(user_info_.user_id);
        user_info_.user_id = "";
        user_info_.user_name = "";
    } else if (is_main_video_) {
        if (is_user_screen_sharing_ == false) {
            // 麦上列表的窗口显示在主窗口
            ReviveUserVideo();
        }
    } else if (is_show_on_main_screen_ == false) {
        // 麦上列表上的窗口点击
        is_show_on_main_screen_ = true;
        ui_->stackedWidget->setCurrentIndex(0);
        ui_->video_view->setUpdatesEnabled(true);
        StopUserVideo(user_info_.user_id);
        emit SignalShowVideoOnMainScreen(user_info_.user_id);
    }

    return QWidget::mouseDoubleClickEvent(event);
}

void VideoRenderView::ReviveVideo() {
    is_show_on_main_screen_ = false;
    auto play_window = GetPlayWindow();
    if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id) {
        TUIRoomCore::GetInstance()->StartCameraPreview(play_window);
    } else {
        TUIRoomCore::GetInstance()->StartRemoteView(user_info_.user_id, play_window, TUIStreamType::kStreamTypeCamera);
    }
}

bool VideoRenderView::IsTalking() const {
    return is_talking_;
}

std::string VideoRenderView::GetUserId() {
    return user_info_.user_id;
}

bool VideoRenderView::IsOnCurrentPage() {
    return is_on_current_page_;
}

void VideoRenderView::StartPreview() {
    is_on_current_page_ = true;
    if (is_show_on_main_screen_ || is_screen_on_stage_) {
        return;
    }
    if (!is_local_user) {
        auto play_window = GetPlayWindow();
        TUIRoomCore::GetInstance()->StartRemoteView(user_info_.user_id, play_window);
    }
    if (is_playing_) {
        QTimer::singleShot(300, this, [=]() {
            ui_->stackedWidget->setCurrentIndex(1);
            ui_->video_view->setUpdatesEnabled(false);
        });
    }
}

void VideoRenderView::StopPreview() {
    is_on_current_page_ = false;
    if (is_show_on_main_screen_ || is_screen_on_stage_) {
        return;
    }
    if (!is_local_user) {
        TUIRoomCore::GetInstance()->StopRemoteView(user_info_.user_id, TUIStreamType::kStreamTypeCamera);
    }
    ui_->stackedWidget->setCurrentIndex(0);
    ui_->video_view->setUpdatesEnabled(true);
}

void VideoRenderView::UpdateUserInfo(const TUIUserInfo& user_info) {
    if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info.user_id) {
        is_local_user = true;
    }
    user_info_ = user_info;
    if (is_local_user && user_info_.has_video_stream && is_on_current_page_) {
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);
    }
    if (user_info_.has_video_stream == false) {
        is_playing_ = false;
        ui_->stackedWidget->setCurrentIndex(0);
        ui_->video_view->setUpdatesEnabled(true);
    } else if (!user_info_.has_subscribed_video_stream && is_on_current_page_) {
        auto play_window = GetPlayWindow();
        TUIRoomCore::GetInstance()->StartRemoteView(user_info_.user_id, play_window);
        user_info_.has_subscribed_video_stream = true;
    }
    if (video_head_ != NULL) {
        video_head_->UpdateUserInfo(user_info_);
    }
}

void VideoRenderView::RemoveUser() {
    is_playing_ = false;
    ui_->stackedWidget->setCurrentIndex(0);
    ui_->video_view->setUpdatesEnabled(true);
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
    if (is_user_screen_sharing_ && streamType == TUIStreamType::kStreamTypeScreen) {
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);
        return;
    }
    // 当前窗口用户还未设置，或屏幕分享的流不显示
    if (user_info_.user_id == "" || streamType != TUIStreamType::kStreamTypeCamera || is_show_on_main_screen_) {
        return;
    }
    if ((DataStore::Instance()->GetCurrentUserInfo().user_id == user_info_.user_id && user_id.isEmpty())
        || user_id.toStdString() == user_info_.user_id) {
        is_playing_ = true;
        ui_->stackedWidget->setCurrentIndex(1);
        ui_->video_view->setUpdatesEnabled(false);
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
        is_talking_ = false;
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
