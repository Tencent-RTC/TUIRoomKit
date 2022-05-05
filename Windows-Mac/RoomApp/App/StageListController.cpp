#include "StageListController.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "StatusUpdateCenter.h"
#include "CommonDef.h"
#include "DataStore.h"
#include <algorithm>
#include <QTimer>
#include <QWheelEvent>
#include <QDesktopWidget>
#include "log.h"
#include "TXMessageBox.h"

int kVideoViewWidth = 300;
int kVideoViewHeight = 200;
int kMaxVideoViewWidth = 300;
int kMinVideoViewWidth = 200;
int kMaxVideoViewHeight = 200;
const int kVerticalButtonWidth = 30;
const int kVerticalButtonHeight = 25;
const int kHorizontalButtonWidth = 25;
const int kHorizontalButtonHeight = 30;

StageListController::StageListController(QWidget* parent)
    : QWidget(parent) {
    ui_ = new Ui::StageListController();
    ui_->setupUi(this);
    InitUi();
    InitConnect();
}

StageListController::~StageListController() {
    ClearCurrentPageVideoView();
    all_video_userid_list_.clear();
    all_screen_share_userid_list_.clear();
    DataStore::Instance()->SetCurrentMainWindowUser("");
    for (auto user : DataStore::Instance()->GetScreenShareUsers()) {
        DataStore::Instance()->RemoveScreenShareUser(user);
    }
    delete ui_;
}

bool StageListController::eventFilter(QObject* watched, QEvent* event) {
    if (watched == ui_->stage_list) {
        if (event->type() == QEvent::Wheel) {
            QWheelEvent* wheel_event = static_cast<QWheelEvent*>(event);
            if (wheel_event->delta() > 0) {
                if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                    if (ui_->previous_page_up->isVisible()) {
                        ShowPreviousPage();
                    }
                } else {
                    if (ui_->previous_page_left->isVisible()) {
                        ShowPreviousPage();
                    }
                }
            } else {
                if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                    if (ui_->next_page_down->isVisible()) {
                        ShowNextPage();
                    }
                } else {
                    if (ui_->next_page_right->isVisible()) {
                        ShowNextPage();
                    }
                }
            }
            return true;
        }
    }

    return QWidget::eventFilter(watched, event);
}
void StageListController::showEvent(QShowEvent* event) {
    ChangeCollapseButtonPosition();
    LOAD_STYLE_SHEET(":/StageListController/StageListViewControl/StageListController.qss");
    return QWidget::showEvent(event);
}
void StageListController::InitUi() {
    btn_stage_hide_.setParent(this->parentWidget()->parentWidget());
    btn_stage_hide_.setWindowFlags(btn_stage_hide_.windowFlags() | Qt::WindowStaysOnTopHint);
    btn_stage_hide_.setObjectName("btn_stage_hide");
    btn_stage_hide_.setCheckable(true);

    ui_->previous_page_left->hide();
    ui_->next_page_right->hide();
    ui_->previous_page_up->hide();
    ui_->next_page_down->hide();

    stage_layout_ = static_cast<QGridLayout*>(ui_->stage_list->layout());
    ui_->stage_list->installEventFilter(this);
    ReSizeStage();
}

void StageListController::InitConnect() {
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserEnter, this, &StageListController::SlotOnRemoteUserEnterRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserLeave, this, &StageListController::SlotOnRemoteUserLeaveRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserCameraAvailable, this, &StageListController::SlotOnRemoteUserVideoOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserAudioAvailable, this, &StageListController::SlotOnRemoteUserAudioOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserScreenAvailable, this, &StageListController::SlotOnRemoteUserScreenVideoOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserEnterSpeechState, this, &StageListController::SlotOnRemoteUserEnterSpeechState);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserExitSpeechState, this, &StageListController::SlotOnRemoteUserExitSpeechState);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRoomMasterChanged, this, &StageListController::SlotOnRoomMasterChanged);

    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalUpdateUserInfo, this, &StageListController::SlotUpdateUserInfo);

    connect(ui_->previous_page_left, &QPushButton::clicked, this, [=]() {
        ShowPreviousPage();
    });
    connect(ui_->previous_page_up, &QPushButton::clicked, this, [=]() {
        ShowPreviousPage();
    });
    connect(ui_->next_page_right, &QPushButton::clicked, this, [=]() {
        ShowNextPage();
    });
    connect(ui_->next_page_down, &QPushButton::clicked, this, [=]() {
        ShowNextPage();
    });

    connect(&btn_stage_hide_, &QPushButton::clicked, this, [=](bool checked) {
        ChangeCollapseButtonPosition();
    });
}

void StageListController::ReSizeStage() {
    ReSizeRoomStage();
}

void StageListController::PopVideoTip(bool top) {
    for (auto view : current_page_video_view_list_) {
        view->PopVideoTip(top);
    }
}

QWidget* StageListController::PopStageListController() {
    is_popup_list_ = true;
    QLayout* layout = ui_->stage_widget->layout();
    if (layout != nullptr) {
        layout->removeWidget(ui_->pop_widget);
    }
    SetVideoViewLayout(StageListDirection::kVerDirection);
    ReSizeStage();

    if (btn_stage_hide_.isVisible()) {
        btn_stage_hide_.hide();
    }

    return ui_->pop_widget;
}

void StageListController::InsertStageList() {
    is_popup_list_ = false;
    QLayout* layout = ui_->stage_widget->layout();
    if (layout != nullptr) {
        layout->addWidget(ui_->pop_widget);
    }

    ui_->pop_widget->activateWindow();
    SetVideoViewLayout(stage_list_direction_);
    ReSizeStage();
}

void StageListController::SetStageListDirection(StageListDirection direction) {
    stage_list_direction_ = direction;
    ui_->pop_widget->setStyle(QApplication::style());
    ui_->stage_list->setStyle(QApplication::style());
    ui_->pop_widget->activateWindow();
    SetVideoViewLayout(stage_list_direction_);
    ReSizeStage();
}

void StageListController::SetVideoViewLayout(StageListDirection direction) {
    auto it = current_page_video_view_list_.begin();
    int pos = 0;
    for (; it != current_page_video_view_list_.end(); ++it) {
        if (pos == 0) {
            ++pos;
            continue;
        }
        stage_layout_->removeWidget(*it);
        if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
            stage_layout_->addWidget(*it, pos, 0);
        } else {
            stage_layout_->addWidget(*it, 0, pos);
        }
        ++pos;
    }
}

void StageListController::ReSizeRoomStage() {
    // 计算大小
    if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
        // 屏幕分享时按照桌面高度来计算
        QDesktopWidget* desk = QApplication::desktop();
        int max_height = desk->availableGeometry().height() - 200;
        int total_view_height = max_height - 2 * kVerticalButtonHeight;
        kVideoViewHeight = total_view_height/ page_size_;
        kVideoViewWidth = kVideoViewHeight * 1.5;

        if (!is_popup_list_) {
            max_height = this->parentWidget()->height();
            total_view_height = max_height - 2 * kVerticalButtonHeight;
            kVideoViewHeight = total_view_height / page_size_;
            kVideoViewWidth = kVideoViewHeight * 1.5;
        }

        kVideoViewHeight = kVideoViewHeight > kMaxVideoViewHeight ? kMaxVideoViewHeight : kVideoViewHeight;
        kVideoViewWidth = kVideoViewWidth > kMaxVideoViewWidth ? kMaxVideoViewWidth : kVideoViewWidth;
        kVideoViewWidth = kVideoViewWidth < kMinVideoViewWidth ? kMinVideoViewWidth : kVideoViewWidth;

        for (auto view : current_page_video_view_list_) {
            view->setFixedSize(kVideoViewWidth - (is_popup_list_ ? 15 : 25), kVideoViewHeight - 15);
            view->show();
        }
        int stage_height = current_page_video_view_list_.size() == page_size_ ?
            total_view_height : kVideoViewHeight * current_page_video_view_list_.size();
        ui_->stage_widget->setMaximumSize(kVideoViewWidth, max_height);
        ui_->stage_list->setMaximumSize(kVideoViewWidth, stage_height);
        ui_->stage_list->resize(kVideoViewWidth, stage_height);
        ui_->pop_widget->resize(kVideoViewWidth, is_popup_list_ ? (stage_height + 2 * kVerticalButtonHeight) : max_height);
        emit SignalPopStageSizeChanged(kVideoViewWidth, stage_height + 2 * kVerticalButtonHeight);
        this->setMaximumWidth(kVideoViewWidth + 5);
        this->setMinimumWidth(kVideoViewWidth + 5);
        this->setMaximumHeight(max_height);
        this->setMinimumHeight(max_height);
    } else {
        int max_width = this->parentWidget()->width();
        int total_view_width = max_width - 2 * kHorizontalButtonWidth;
        kVideoViewWidth = total_view_width / page_size_;
        kVideoViewHeight = kVideoViewWidth * 2 / 3;

        for (auto view : current_page_video_view_list_) {
            view->setFixedSize(kVideoViewWidth - 20, kVideoViewHeight - 25);
            view->show();
        }
        int stage_width = current_page_video_view_list_.size() == page_size_ ?
            total_view_width : kVideoViewWidth * current_page_video_view_list_.size();
        ui_->stage_widget->setMaximumSize(max_width, kVideoViewHeight);
        ui_->stage_list->setMaximumSize(stage_width, kVideoViewHeight);
        ui_->stage_list->resize(stage_width, kVideoViewHeight);
        ui_->pop_widget->resize(max_width, kVideoViewHeight);
        this->setMaximumHeight(kVideoViewHeight + 5);
        this->setMinimumHeight(kVideoViewHeight + 5);
        this->setMaximumWidth(max_width);
        this->setMinimumWidth(max_width);
    }
    ChangeButtonsStatus();
    ChangeCollapseButtonPosition();
}

void StageListController::ChangeCollapseButtonPosition() {
    ChangeCollapseButtonStyle();
    if (stage_list_direction_ == StageListDirection::kVerDirection) {
        btn_stage_hide_.resize(15, kVerticalButtonWidth);
        btn_stage_hide_.move(this->parentWidget()->width() - (this->isVisible() ? this->width() - 2 : 15), this->parentWidget()->height() / 2 + 15);
    } else {
        btn_stage_hide_.resize(kHorizontalButtonHeight, 15);
        btn_stage_hide_.move(this->parentWidget()->width() / 2 -15, (this->isVisible() ? this->height() + 12 : 30));
    }
    btn_stage_hide_.show();
    btn_stage_hide_.raise();
}
void StageListController::ChangeCollapseButtonStyle() {
    QString sheet = "background:transparent;background-image:url(:/StageListController/StageListViewControl/ver.png);";
    if (stage_list_direction_ == StageListDirection::kVerDirection) {
        if (btn_stage_hide_.isChecked()) {
            sheet = "background:transparent;border-image:url(:/StageListController/StageListViewControl/ver_hover.png);";
            this->hide();
        } else {
            sheet = "background:transparent;border-image:url(:/StageListController/StageListViewControl/ver.png);";
            this->show();
        }
    } else {
        if (btn_stage_hide_.isChecked()) {
            sheet = "background:transparent;border-image:url(:/StageListController/StageListViewControl/hor_hover.png);";
            this->hide();
        } else {
            sheet = "background:transparent;border-image:url(:/StageListController/StageListViewControl/hor.png);";
            this->show();
        }
    }
    btn_stage_hide_.setStyleSheet(sheet);
    btn_stage_hide_.raise();
}
void StageListController::ChangeButtonsStatus() {
    if (current_page_video_view_list_.size() == page_size_ &&
        current_page_video_view_list_.size() < (all_screen_share_userid_list_.size()\
            + all_video_userid_list_.size())) {
        // 计算可以滚动的视频位个数
        int scroll_count = (page_size_ - all_screen_share_userid_list_.size());

        // 上一页按钮
        if (last_video_index_ == 0) {
            ui_->previous_page_left->hide();
            ui_->previous_page_up->hide();
        } else {
            // 屏幕分享时候
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                ui_->previous_page_up->show();
            } else {
                ui_->previous_page_left->show();
            }
        }
        // 下一页按钮
        if (last_video_index_ + scroll_count >= all_video_userid_list_.size()) {
            ui_->next_page_down->hide();
            ui_->next_page_right->hide();
        } else {
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                ui_->next_page_down->show();
            } else {
                ui_->next_page_right->show();
            }
        }
    } else {
        ui_->previous_page_left->hide();
        ui_->previous_page_up->hide();
        ui_->next_page_down->hide();
        ui_->next_page_right->hide();
    }
    if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
        ui_->up_widget->show();
        ui_->down_widget->show();
        ui_->left_widget->hide();
        ui_->right_widget->hide();
    } else {
        ui_->up_widget->hide();
        ui_->down_widget->hide();
        ui_->left_widget->show();
        ui_->right_widget->show();
    }
}

void StageListController::InsertUser(const TUIUserInfo& user_info, bool is_screen_share) {
    LINFO("InsertUser user_id:%s, user_name:%s, role:%d",
        user_info.user_id.c_str(), user_info.user_name.c_str(), user_info.role);

    // 如果当前页还可以展示视频
    if (current_page_video_view_list_.size() < page_size_) {
        // 麦上列表的显示顺序：[ 屏幕分享(者) | 主持人 | 自己 | 其他成员 ]
        if (is_screen_share) {
            all_screen_share_userid_list_.push_back(user_info.user_id);
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
                all_video_userid_list_.push_front(user_info.user_id);
            }
        } else {
            if (user_info.has_screen_stream) {
                // 屏幕分享者
                all_video_userid_list_.push_front(user_info.user_id);
            } else if (user_info.role == TUIRole::kMaster) {
                // 主持人
                int i = 0;
                for (; i < all_video_userid_list_.size() && i < page_size_; i++) {
                    const TUIUserInfo* user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(i));
                    if (user->has_screen_stream)
                        continue;
                    else
                        break;
                }
                all_video_userid_list_.insert(i, user_info.user_id);
            } else if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info.user_id) {
                // 成员自己
                int i = 0;
                for (; i < all_video_userid_list_.size() && i < page_size_; i++) {
                    const TUIUserInfo* user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(i));
                    if (user->has_screen_stream || user->role == TUIRole::kMaster)
                        continue;
                    else
                        break;
                }
                all_video_userid_list_.insert(i, user_info.user_id);
            } else {
                all_video_userid_list_.push_back(user_info.user_id);
            }
        }

        VideoRenderView* video_view = new (std::nothrow) VideoRenderView(this, is_screen_share);
        if (video_view == nullptr) {
            return;
        }
        connect(video_view, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
        current_page_video_view_list_.push_back(video_view);

        video_view->UpdateUserInfo(user_info);

        for (int i = 0; i < current_page_video_view_list_.size(); i++) {
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                auto item = stage_layout_->itemAtPosition(i, 0);
                if (item == nullptr) {
                    stage_layout_->addWidget(current_page_video_view_list_.at(i), i, 0);
                }
            } else {
                auto item = stage_layout_->itemAtPosition(0, i);
                if (item == nullptr) {
                    stage_layout_->addWidget(current_page_video_view_list_.at(i), 0, i);
                }
            }
            VideoRenderView* view = current_page_video_view_list_.at(i);
            view->StopCurrentVideo();
        }
    } else {
        if (is_screen_share) {
            if (all_screen_share_userid_list_.contains(user_info.user_id)) {
                all_screen_share_userid_list_.removeOne(user_info.user_id);
            }
            all_screen_share_userid_list_.push_back(user_info.user_id);
        } else {
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
            }
            const TUIUserInfo* user = TUIRoomCore::GetInstance()->GetUserInfo(user_info.user_id);
            if (user->role == TUIRole::kMaster) {
                all_video_userid_list_.insert(all_screen_share_userid_list_.size(), user_info.user_id);
            } else if (user->has_screen_stream) {
                all_video_userid_list_.push_front(user_info.user_id);
            } else {
                all_video_userid_list_.push_back(user_info.user_id);
            }

            for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                item->StopCurrentVideo();
            }
        }
    }

    UpdateCurrentVideoPage();
    ChangeButtonsStatus();
    ReSizeStage();
}
void StageListController::SlotUpdateUserInfo(const TUIUserInfo& user_info) {
    if (main_window_view_ != nullptr && main_window_view_->GetUserId() == user_info.user_id) {
        main_window_view_->UpdateUserInfo(user_info);
    } else {
        this->UpdateUserInfo(user_info);
    }
}
void StageListController::UpdateUserInfo(const TUIUserInfo& user_info) {
    LINFO("UpdateUserInfo user_id:%s, user_name:%s, role:%d,\
        has_video_stream:%d, has_audio_stream:%d,has_screen_stream:%d",
        user_info.user_id.c_str(), user_info.user_name.c_str(), user_info.role,
        user_info.has_video_stream, user_info.has_audio_stream, user_info.has_screen_stream);
    for (auto view : current_page_video_view_list_) {
        if (view->GetUserId() == user_info.user_id) {
            view->UpdateUserInfo(user_info);
            return;
        }
    }
}
void StageListController::RemoveUser(const std::string& user_id, bool is_screen_share) {
    LINFO("RemoveUser user_id:%s", user_id.c_str());
    if (is_screen_share) {
        all_screen_share_userid_list_.removeOne(user_id);
        if (all_video_userid_list_.contains(user_id)) {
            all_video_userid_list_.removeOne(user_id);
            int insert_index = all_video_userid_list_.indexOf(DataStore::Instance()->GetCurrentUserInfo().user_id);
            all_video_userid_list_.insert(insert_index + 1, user_id);
        }
    } else {
        all_video_userid_list_.removeOne(user_id);
    }

    if (all_video_userid_list_.size() + all_screen_share_userid_list_.size() < page_size_) {
        for (auto view_iter = current_page_video_view_list_.begin(); view_iter != current_page_video_view_list_.end(); view_iter++) {
            if ((*view_iter)->GetUserId() == user_id && (is_screen_share == (*view_iter)->IsScreenShareWindow())) {
                VideoRenderView* view = *view_iter;
                current_page_video_view_list_.erase(view_iter);
                RemoveVideoViewFromStage(view);
                break;
            }
        }
    } else {
        for (int i = 0; i < current_page_video_view_list_.size(); i++) {
            VideoRenderView* item = current_page_video_view_list_.at(i);
            item->StopCurrentVideo();
        }
        if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) >= all_video_userid_list_.size()) {
            last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());
        }
        UpdateCurrentVideoPage();
    }

    ChangeButtonsStatus();
    ReSizeStage();
}

liteav::TXView StageListController::GetPlayWindow(const std::string& user_id) {
    for (auto view : current_page_video_view_list_) {
        if (view->GetUserId() == user_id) {
            return view->GetPlayWindow();
        }
    }
    return NULL;
}

bool StageListController::IsOnStage(const std::string& user_id) {
    for (auto view : current_page_video_view_list_) {
        if (view->GetUserId() == user_id) {
            return true;
        }
    }
    return false;
}

void StageListController::ShowPreviousPage() {
    LINFO("ShowPreviousPage");

    last_video_index_ -= (page_size_ - all_screen_share_userid_list_.size());
    if (last_video_index_ <= 0)
        last_video_index_ = 0;
    
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        item->StopCurrentVideo();
    }
    UpdateCurrentVideoPage();

    ChangeButtonsStatus();
}

void StageListController::ShowNextPage() {
    LINFO("ShowNextPage");
    last_video_index_ += (page_size_ - all_screen_share_userid_list_.size());
    if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) >= all_video_userid_list_.size())
        last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());
    
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        item->StopCurrentVideo();
    }
    UpdateCurrentVideoPage();

    ChangeButtonsStatus();
}

void StageListController::ClearCurrentPageVideoView() {
    auto it = current_page_video_view_list_.begin();
    for (; it != current_page_video_view_list_.end(); ++it) {
            (*it)->StopPreview();
            stage_layout_->removeWidget(*it);
            delete (*it);
    }
    current_page_video_view_list_.clear();
}

void StageListController::RemoveVideoViewFromStage(VideoRenderView* video_view) {
    if (video_view == nullptr) {
        return;
    }
    stage_layout_->removeWidget(video_view);
    video_view->StopCurrentVideo();
    video_view->close();
    delete video_view;
    video_view = nullptr;
}

void StageListController::SlotOnRemoteUserEnterRoom(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    InsertUser(*user_info, false);
}

void StageListController::SlotOnRemoteUserLeaveRoom(const QString& user_id) {
    if (main_window_view_->GetUserId() == user_id.toStdString() && !main_window_view_->IsScreenShareWindow()) {
        main_window_view_->InitMainVideo();
        DataStore::Instance()->SetCurrentMainWindowUser("");
        TUIRoomCore::GetInstance()->StopRemoteView(user_id.toStdString(), TUIStreamType::kStreamTypeCamera);
    } else if (all_video_userid_list_.contains(user_id.toStdString())) {
        RemoveUser(user_id.toStdString(), false);
    }
}

void StageListController::SlotOnRemoteUserVideoOpen(const QString& user_id, bool available) {
    LINFO("SlotOnRemoteUserVideoOpen, user_id：%s, available : %d", user_id.toStdString().c_str(), available);
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    if (!available) {
        if (!main_window_view_->IsScreenShareWindow() &&
            DataStore::Instance()->GetCurrentMainWindowUser() == user_id.toStdString()) {
            SlotRemoveVideoFromMainScreen(user_id.toStdString());
        } else {
            TUIRoomCore::GetInstance()->StopRemoteView(user_id.toStdString());
        }
    } else {
        for (auto item : current_page_video_view_list_) {
            if (item->GetUserId() == user_id.toStdString() && !item->IsScreenShareWindow()) {
                item->StartPreview();
                break;
            }
        }
    }
    UpdateUserInfo(*user_info);
}

void StageListController::SlotOnRemoteUserAudioOpen(const QString& user_id, bool available) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    UpdateUserInfo(*user_info);
}

void StageListController::SlotOnRemoteUserScreenVideoOpen(const QString& user_id, bool available) {
    LINFO("SlotOnRemoteUserScreenVideoOpen, user_id：%s, available : %d", user_id.toStdString().c_str(), available);
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }

    std::string current_main_screen_user = DataStore::Instance()->GetCurrentMainWindowUser();
    if (!current_main_screen_user.empty()) {
        if (available) {
            if (current_page_video_view_list_.size() < page_size_) {
                InsertUser(*user_info, true);
            } else {
                all_screen_share_userid_list_.push_front(user_id.toStdString());
                if (all_video_userid_list_.contains(user_id.toStdString())) {
                    all_video_userid_list_.removeOne(user_id.toStdString());
                    all_video_userid_list_.push_front(user_id.toStdString());

                    // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
                    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                        VideoRenderView* item = current_page_video_view_list_.at(i);
                        item->StopCurrentVideo();
                    }
                }
                UpdateCurrentVideoPage();
            }
        } else {
            if (!(user_id.toStdString() == main_window_view_->GetUserId() && main_window_view_->IsScreenShareWindow())) {
                RemoveUser(user_id.toStdString(), true);
            } else if (all_video_userid_list_.contains(user_id.toStdString())) {
                all_video_userid_list_.removeOne(user_id.toStdString());
                int insert_index = all_video_userid_list_.indexOf(DataStore::Instance()->GetCurrentUserInfo().user_id);
                all_video_userid_list_.insert(insert_index + 1, user_id.toStdString());

                // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
                for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                    VideoRenderView* item = current_page_video_view_list_.at(i);
                    item->StopCurrentVideo();
                }
                UpdateCurrentVideoPage();
            }
        }
    } else {
        if (all_video_userid_list_.contains(user_id.toStdString())) {
            all_video_userid_list_.removeOne(user_id.toStdString());
            all_video_userid_list_.push_front(user_id.toStdString());

            // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
            for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                item->StopCurrentVideo();
            }
        }
        UpdateCurrentVideoPage();
    }

    ChangeButtonsStatus();
}

void StageListController::SlotOnRemoteUserEnterSpeechState(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    if (std::find(all_video_userid_list_.begin(), all_video_userid_list_.end(), user_id.toStdString()) == all_video_userid_list_.end()) {
        InsertUser(*user_info, false);
    }
}

void StageListController::SlotOnRemoteUserExitSpeechState(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    RemoveUser(user_id.toStdString(), false);
}

void StageListController::SlotShowVideoOnMainScreen(const std::string user_id, bool is_screen_share_window) {
    // 从麦上列表移出被双击的用户（该用户肯定是正在显示的用户）
    LINFO("User ShowVideoOnMainScreen, user_id：%s, is_screen_share_window : %d", user_id.c_str(), is_screen_share_window);
    main_window_view_->StopCurrentVideo();
    main_window_view_->ResetBackgroundImage();
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        if (item->GetUserId() == user_id) {
            item->StopCurrentVideo();
            break;
        }
    }

    std::string current_main_window_user = DataStore::Instance()->GetCurrentMainWindowUser();
    if (is_screen_share_window) {
        // 双击的是屏幕分享
        all_screen_share_userid_list_.removeOne(user_id);
    } else {
        // 双击的是视频
        all_video_userid_list_.removeOne(user_id);
    }

    if (!current_main_window_user.empty()) {
        if (main_window_view_->IsScreenShareWindow()) {
            all_screen_share_userid_list_.push_front(current_main_window_user);
        } else {
            const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(current_main_window_user);
            if (user_info->role == TUIRole::kMaster || user_info->has_screen_stream) {
                all_video_userid_list_.push_front(current_main_window_user);
            } else {
                bool insert_flag = false;
                for (int i = 0; i < all_video_userid_list_.size(); i++) {
                    std::string user_id = all_video_userid_list_.at(i);
                    if (TUIRoomCore::GetInstance()->GetUserInfo(user_id)->role != TUIRole::kMaster &&
                        !TUIRoomCore::GetInstance()->GetUserInfo(user_id)->has_screen_stream) {
                        if (current_main_window_user == DataStore::Instance()->GetCurrentUserInfo().user_id) {
                            all_video_userid_list_.insert(i, current_main_window_user);
                            insert_flag = true;
                            break;
                        } else if (user_id == DataStore::Instance()->GetCurrentUserInfo().user_id){
                            all_video_userid_list_.insert(i, current_main_window_user);
                            insert_flag = true;
                            break;
                        }
                    }
                }
                if (insert_flag == false) {
                    all_video_userid_list_.push_front(current_main_window_user);
                }
            }
        }
    } else if (all_video_userid_list_.size() + all_screen_share_userid_list_.size() < page_size_) {
        RemoveUser(user_id, is_screen_share_window);
    }
    UpdateCurrentVideoPage();
    ChangeButtonsStatus();
    // 将其视频显示到主窗口
    const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr)
        return;
    DataStore::Instance()->SetCurrentMainWindowUser(user_id);
    main_window_view_->UpdateUserInfo(*user_info);
    if (is_screen_share_window) {
        main_window_view_->UserStartScreenShare(user_id);
    } else {
        std::string local_userid = DataStore::Instance()->GetCurrentUserInfo().user_id;
        if (main_window_view_->GetUserId() == local_userid) {
            main_window_view_->UpdateCameraPreview();
        } else {
            main_window_view_->StartPreview();
        }
    }
}

void StageListController::SlotRemoveVideoFromMainScreen(const std::string user_id) {
    LINFO("User RemoveVideoFromMainScreen, user_id：%s", user_id.c_str());
    const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    if (!all_screen_share_userid_list_.empty()) {
        // 如果有人在屏幕分享，则显示在主窗口
        LINFO("User Show Screen Share On Main Screen, user_id：%s", all_screen_share_userid_list_[0].c_str());
        SlotShowVideoOnMainScreen(all_screen_share_userid_list_[0], true);
    } else {
        main_window_view_->StopCurrentVideo();
        main_window_view_->InitMainVideo();
        DataStore::Instance()->SetCurrentMainWindowUser("");
    }
    if (std::find(all_video_userid_list_.begin(), all_video_userid_list_.end(), user_id) == all_video_userid_list_.end()) {
        InsertUser(*user_info, false);
    }
    UpdateCurrentVideoPage();
    ChangeButtonsStatus();
}

void StageListController::SlotOnRoomMasterChanged(const QString& user_id) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user && local_user->user_id == user_id.toStdString()) {
        TXMessageBox::Instance().AddLineTextMessage(tr("You have become the new master."));
    }
    
    if (all_video_userid_list_.contains(user_id.toStdString())) {
        all_video_userid_list_.removeOne(user_id.toStdString());
        all_video_userid_list_.push_front(user_id.toStdString());
    }

    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        item->StopCurrentVideo();
    }
    UpdateCurrentVideoPage();
    
    ChangeButtonsStatus();
}

bool StageListController::IsVerticalStageListDirection() const {
    return (StageListDirection::kVerDirection == stage_list_direction_);
}

void StageListController::SetMainWindowView(VideoRenderView* video_view) {
    if (video_view == nullptr) {
        return;
    }
    main_window_view_ = video_view;
    connect(main_window_view_, &VideoRenderView::SignalRemoveVideoFromMainScreen,
        this, &StageListController::SlotRemoveVideoFromMainScreen);
}
void StageListController::UpdateCurrentVideoPage() {
    const TUIUserInfo* local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    int screen_user_index = 0;
    int new_index = last_video_index_ >= 0 ? last_video_index_ : 0;

    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        item->ResetBackgroundImage();
        if (screen_user_index < all_screen_share_userid_list_.size()) {
            const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_screen_share_userid_list_.at(screen_user_index++));
            item->UpdateUserInfo(*item_user);
            item->UserStartScreenShare(item->GetUserId());
        } else {
            if (new_index < all_video_userid_list_.size()) {
                const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(new_index++));
                item->UpdateUserInfo(*item_user);
                if (item_user->user_id == local_user->user_id) {
                    item->UpdateCameraPreview();
                } else {
                    item->StartPreview();
                }
            }
        }
    }
}