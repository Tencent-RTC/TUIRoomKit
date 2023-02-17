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

// 宫格布局时的单页显示最大值
const int kGridLayoutPageSize = 36;
// 顶部布局和垂直布局时的单页显示最大值
const int kVerAndHorLayoutPageSize = 6;

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
    if (stage_list_direction_ == direction)
        return;

    stage_list_direction_ = direction;
    ui_->pop_widget->setStyle(QApplication::style());
    ui_->stage_list->setStyle(QApplication::style());
    ui_->pop_widget->activateWindow();
    SetVideoViewLayout(stage_list_direction_);
    ReSizeStage();
}

void StageListController::SetVideoViewLayout(StageListDirection direction) {
    for (auto it = current_page_video_view_list_.begin();
        it != current_page_video_view_list_.end(); ++it) {
        stage_layout_->removeWidget(*it);
    }
    bool need_update_view_list = false;
    std::string current_main_window_user = DataStore::Instance()->GetCurrentMainWindowUser();
    if (direction == StageListDirection::kGridDirection && !current_main_window_user.empty()) {
        // main_widget_control_ 如果正在显示，则要添加到list中
        if (main_window_view_->IsScreenShareWindow()) {
            all_screen_share_userid_list_.push_back(current_main_window_user);
        } else {
            const TUIUserInfo* user = TUIRoomCore::GetInstance()->GetUserInfo(current_main_window_user);
            if (user->role == TUIRole::kMaster || user->user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
                all_video_userid_list_.push_front(current_main_window_user);
            } else {
                all_video_userid_list_.insert(current_page_video_view_list_.size() + 1, current_main_window_user);
            }
        }

        main_window_view_->StopCurrentVideo();
        main_window_view_->InitMainVideo();
        DataStore::Instance()->SetCurrentMainWindowUser("");
        for (int i = 0; i < current_page_video_view_list_.size(); i++) {
            VideoRenderView* item = current_page_video_view_list_.at(i);
            item->StopCurrentVideo();
        }
        if (current_page_video_view_list_.size() < kVerAndHorLayoutPageSize) {
            VideoRenderView* video_view = new (std::nothrow) VideoRenderView(this);
            if (video_view != nullptr) {
                connect(video_view, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
                const TUIUserInfo* user = TUIRoomCore::GetInstance()->GetUserInfo(current_main_window_user);
                video_view->UpdateUserInfo(*user);
                current_page_video_view_list_.push_front(video_view);
            }
        }
        need_update_view_list = true;
    }

    page_size_ = (direction == StageListDirection::kGridDirection ? kGridLayoutPageSize : kVerAndHorLayoutPageSize);
    int all_user_size = all_screen_share_userid_list_.size() + all_video_userid_list_.size();
    if (all_user_size > kVerAndHorLayoutPageSize || need_update_view_list) {
        if (direction == StageListDirection::kGridDirection) {
            // max size is kGridLayoutPageSize
            int new_size = (all_user_size > kGridLayoutPageSize ? kGridLayoutPageSize - kVerAndHorLayoutPageSize
                : all_user_size - kVerAndHorLayoutPageSize);
            for (int i = 0; i < new_size; i++) {
                VideoRenderView* video_view = new (std::nothrow) VideoRenderView(this);
                if (video_view != nullptr) {
                    connect(video_view, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
                    current_page_video_view_list_.push_back(video_view);
                }
            }
            need_update_view_list = true;
        } else if (current_page_video_view_list_.size() > kVerAndHorLayoutPageSize) {
            // max size is 6
            auto view_iter = current_page_video_view_list_.begin() + kVerAndHorLayoutPageSize;
            while (view_iter != current_page_video_view_list_.end()) {
                VideoRenderView* view = *view_iter;
                view_iter = current_page_video_view_list_.erase(view_iter);
                RemoveVideoViewFromStage(view);
            }
        }
    }

    int pos = 0;
    for (auto it = current_page_video_view_list_.begin();
        it != current_page_video_view_list_.end(); ++it) {
        if (direction == StageListDirection::kVerDirection || is_popup_list_) {
            stage_layout_->addWidget(*it, pos, 0);
        } else if (direction == StageListDirection::kGridDirection) {
            int row = 1, column = 1;
            GridLayoutDeciders(row, column);
            stage_layout_->addWidget(*it, pos / column, pos % column);
        } else {
            // stage_list_direction_ == StageListDirection::kHorDirection
            stage_layout_->addWidget(*it, 0, pos);
        }
        ++pos;
    }
    if (need_update_view_list) {
        UpdateCurrentVideoPage();
    }
}

void StageListController::GridLayoutDeciders(int& row, int& column) {
    int current_page_size = current_page_video_view_list_.size();
    if (current_page_size <= 2) {
        row = 1, column = (current_page_size ? current_page_size : 1);
    } else if (current_page_size <= 4) {
        row = 2, column = 2;
    } else if (current_page_size <= 6) {
        row = 2, column = 3;
    } else if (current_page_size <= 9) {
        row = 3, column = 3;
    } else if (current_page_size <= 12) {
        row = 3, column = 4;
    } else if (current_page_size <= 16) {
        row = 4, column = 4;
    } else if (current_page_size <= 20) {
        row = 4, column = 5;
    } else if (current_page_size <= 25) {
        row = 5, column = 5;
    } else if (current_page_size <= 30) {
        row = 5, column = 6;
    } else {
        row = 6, column = 6;
    }
}

void StageListController::ReSizeRoomStage() {
    if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
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
    } else if (stage_list_direction_ == StageListDirection::kGridDirection) {
        int max_width = this->parentWidget()->width();
        int total_view_width = max_width - 2 * kHorizontalButtonWidth;
        int max_height = this->parentWidget()->height();

        int row = 1, column = 1;
        GridLayoutDeciders(row, column);
        kVideoViewWidth = total_view_width / column;
        kVideoViewHeight = max_height / row;

        for (auto view : current_page_video_view_list_) {
            view->setFixedSize(kVideoViewWidth - 5, kVideoViewHeight - 5);
            view->show();
        }
        ui_->stage_widget->setMaximumSize(max_width, max_height);
        ui_->stage_list->setMaximumSize(total_view_width, max_height);
        ui_->stage_list->resize(total_view_width, max_height);
        ui_->pop_widget->resize(max_width, max_height);
        this->setMaximumHeight(max_height);
        this->setMinimumHeight(max_height);
        this->setMaximumWidth(max_width);
        this->setMinimumWidth(max_width);
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
    if (stage_list_direction_ == StageListDirection::kGridDirection || is_popup_list_) {
        btn_stage_hide_.hide();
    } else if (stage_list_direction_ == StageListDirection::kVerDirection) {
        btn_stage_hide_.resize(15, kVerticalButtonWidth);
        btn_stage_hide_.move(this->parentWidget()->width() - (this->isVisible() ? this->width() - 2 : 15), this->parentWidget()->height() / 2 + 15);
        btn_stage_hide_.show();
        btn_stage_hide_.raise();
    }else {
        btn_stage_hide_.resize(kHorizontalButtonHeight, 15);
        btn_stage_hide_.move(this->parentWidget()->width() / 2 -15, (this->isVisible() ? this->height() + 12 : 30));
        btn_stage_hide_.show();
        btn_stage_hide_.raise();
    }
}
void StageListController::ChangeCollapseButtonStyle() {
    QString sheet = "background:transparent;background-image:url(:/StageListController/StageListViewControl/ver.png);";
    if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
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
        // Calculate the number of videos that can be scrolled
        int scroll_count = (page_size_ - all_screen_share_userid_list_.size());

        // 上一页按钮
        // Previous page button
        if (last_video_index_ == 0) {
            ui_->previous_page_left->hide();
            ui_->previous_page_up->hide();
        } else {
            // 屏幕分享
            // Screen sharing
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                ui_->previous_page_up->show();
            } else {
                ui_->previous_page_left->show();
            }
        }
        // 下一页按钮
        // Next page button
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
    // If the current page can still display video
    if (current_page_video_view_list_.size() < page_size_) {
        // 麦上列表的显示顺序 : [ 屏幕分享(者) | 主持人 | 自己 | 其他成员 ]
        // Display order of the mic-on list: [ Screen sharer | Host | You | Other members ]
        if (is_screen_share) {
            if (all_screen_share_userid_list_.contains(user_info.user_id))
                all_screen_share_userid_list_.removeOne(user_info.user_id);
            all_screen_share_userid_list_.push_back(user_info.user_id);
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
                all_video_userid_list_.push_front(user_info.user_id);
            }
        } else {
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
            }

            if (user_info.has_screen_stream || user_info.role == TUIRole::kMaster ||
                user_info.user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
                all_video_userid_list_.push_front(user_info.user_id);
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
            } else if (stage_list_direction_ == StageListDirection::kGridDirection) {
                int row = 1, column = 1;
                GridLayoutDeciders(row, column);
                auto item = stage_layout_->itemAtPosition(i / column, i % column);
                if (item == nullptr) {
                    stage_layout_->addWidget(current_page_video_view_list_.at(i), i / column, i % column);
                }
            } else {
                // stage_list_direction_ == StageListDirection::kHorDirection
                auto item = stage_layout_->itemAtPosition(0, i);
                if (item == nullptr) {
                    stage_layout_->addWidget(current_page_video_view_list_.at(i), 0, i);
                }
            }
            VideoRenderView* view = current_page_video_view_list_.at(i);
            view->StopCurrentVideo();
        }
        UpdateCurrentVideoPage();
        ReSizeStage();
    } else {
        if (is_screen_share) {
            if (all_screen_share_userid_list_.contains(user_info.user_id)) {
                all_screen_share_userid_list_.removeOne(user_info.user_id);
            }
            all_screen_share_userid_list_.push_back(user_info.user_id);
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
                all_video_userid_list_.push_front(user_info.user_id);
            }
        } else {
            if (all_video_userid_list_.contains(user_info.user_id)) {
                all_video_userid_list_.removeOne(user_info.user_id);
            }

            if (user_info.has_screen_stream || user_info.role == TUIRole::kMaster ||
                user_info.user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
                all_video_userid_list_.push_front(user_info.user_id);
                for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                    VideoRenderView* item = current_page_video_view_list_.at(i);
                    item->StopCurrentVideo();
                }
                UpdateCurrentVideoPage();
            } else {
                all_video_userid_list_.push_back(user_info.user_id);
                bool is_need_refresh = all_screen_share_userid_list_.contains(user_info.user_id);
                if (!is_need_refresh) {
                    for (int i = 0; i < current_page_video_view_list_.size() - all_screen_share_userid_list_.size(); i++) {
                        VideoRenderView* item = current_page_video_view_list_.at(i);
                        if (item->GetUserId() == user_info.user_id) {
                            is_need_refresh = true;
                            break;
                        }
                    }
                }
                if (is_need_refresh) {
                    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                        VideoRenderView* item = current_page_video_view_list_.at(i);
                        item->StopCurrentVideo();
                    }
                    UpdateCurrentVideoPage();
                }
            }
        }
        ChangeButtonsStatus();
    }
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
        if (all_screen_share_userid_list_.contains(user_id)) {
            all_screen_share_userid_list_.removeOne(user_id);
        }
        if (all_video_userid_list_.contains(user_id)) {
            all_video_userid_list_.removeOne(user_id);
            int insert_index = all_video_userid_list_.indexOf(DataStore::Instance()->GetCurrentUserInfo().user_id);
            if (insert_index != -1) {
                all_video_userid_list_.insert(insert_index + 1, user_id);
            } else {
                all_video_userid_list_.push_back(user_id);
            }
        }
    } else {
        all_video_userid_list_.removeOne(user_id);
    }

    if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) > all_video_userid_list_.size())
        last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());

    if (all_video_userid_list_.size() + all_screen_share_userid_list_.size() < page_size_) {
        for (auto view_iter = current_page_video_view_list_.begin(); view_iter != current_page_video_view_list_.end(); view_iter++) {
            if ((*view_iter)->GetUserId() == user_id && (is_screen_share == (*view_iter)->IsScreenShareWindow())) {
                VideoRenderView* view = *view_iter;
                current_page_video_view_list_.erase(view_iter);
                RemoveVideoViewFromStage(view);
                break;
            }
        }
        ChangeButtonsStatus();
        ReSizeStage();
    } else {
        bool is_need_refresh = all_screen_share_userid_list_.contains(user_id);
        if (!is_need_refresh) {
            for (int i = 0; i < current_page_video_view_list_.size() - all_screen_share_userid_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                if (item->GetUserId() == user_id) {
                    is_need_refresh = true;
                    break;
                }
            }
        }

        if (is_need_refresh) {
            for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                item->StopCurrentVideo();
            }
            UpdateCurrentVideoPage();
        }
        ChangeButtonsStatus();
    }
}

void StageListController::UserExit(const std::string& user_id) {
    LINFO("UserExit user_id:%s", user_id.c_str());
    all_video_userid_list_.removeOne(user_id);
    all_screen_share_userid_list_.removeOne(user_id);
    
    if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) > all_video_userid_list_.size())
        last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());

    if (all_video_userid_list_.size() + all_screen_share_userid_list_.size() < page_size_) {
        if (stage_list_direction_ == StageListDirection::kGridDirection && !is_popup_list_) {
            for (auto view_iter = current_page_video_view_list_.begin(); view_iter != current_page_video_view_list_.end(); view_iter++) {
                if ((*view_iter)->GetUserId() == user_id) {
                    VideoRenderView* view = *view_iter;
                    current_page_video_view_list_.erase(view_iter);
                    RemoveVideoViewFromStage(view);
                    break;
                }
            }
            int pos = 0, row = 1, column = 1;
            GridLayoutDeciders(row, column);
            for (auto view_iter = current_page_video_view_list_.begin();
                view_iter != current_page_video_view_list_.end(); ++view_iter) {
                stage_layout_->addWidget(*view_iter, pos / column, pos % column);
                ++pos;
            }
            UpdateCurrentVideoPage();
        } else {
            for (auto view_iter = current_page_video_view_list_.begin(); view_iter != current_page_video_view_list_.end(); view_iter++) {
                if ((*view_iter)->GetUserId() == user_id) {
                    VideoRenderView* view = *view_iter;
                    current_page_video_view_list_.erase(view_iter);
                    RemoveVideoViewFromStage(view);
                    break;
                }
            }
        }
        ChangeButtonsStatus();
        ReSizeStage();
    } else {
        bool is_need_refresh = all_screen_share_userid_list_.contains(user_id);
        if (!is_need_refresh) {
            for (int i = 0; i < current_page_video_view_list_.size() - all_screen_share_userid_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                if (item->GetUserId() == user_id) {
                    is_need_refresh = true;
                    break;
                }
            }
        }

        if (is_need_refresh) {
            for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                item->StopCurrentVideo();
            }
            UpdateCurrentVideoPage();
        }
        ChangeButtonsStatus();
    }
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
        if (!item->IsScreenShareWindow()) {
            item->StopCurrentVideo();
        }
    }

    const std::string local_user_id = DataStore::Instance()->GetCurrentUserInfo().user_id;
    int new_index = last_video_index_;
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        if (!item->IsScreenShareWindow()) {
            const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(new_index++));
            item->UpdateUserInfo(*item_user);
            if (item_user->user_id == local_user_id) {
                item->UpdateCameraPreview();
            } else {
                item->StartPreview();
            }
        }
    }

    //UpdateCurrentVideoPage();
    ChangeButtonsStatus();
}

void StageListController::ShowNextPage() {
    LINFO("ShowNextPage");
    last_video_index_ += (page_size_ - all_screen_share_userid_list_.size());
    if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) > all_video_userid_list_.size())
        last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());
    
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        if (!item->IsScreenShareWindow()) {
            item->StopCurrentVideo();
        }
    }

    const std::string local_user_id = DataStore::Instance()->GetCurrentUserInfo().user_id;
    int new_index = last_video_index_;
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        if (!item->IsScreenShareWindow()) {
            const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(new_index++));
            item->UpdateUserInfo(*item_user);
            if (item_user->user_id == local_user_id) {
                item->UpdateCameraPreview();
            } else {
                item->StartPreview();
            }
        }
    }

    //UpdateCurrentVideoPage();
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
    video_view->StopCurrentVideo();
    stage_layout_->removeWidget(video_view);
    video_view->close();
    delete video_view;
    video_view = nullptr;
}

void StageListController::SlotOnRemoteUserEnterRoom(const QString& user_id) {
  return;
}

void StageListController::SlotOnRemoteUserLeaveRoom(const QString& user_id) {
  UserExit(user_id.toStdString());
}

void StageListController::SlotOnRemoteUserVideoOpen(const QString& user_id, bool available) {
    LINFO("SlotOnRemoteUserVideoOpen, user_id : %s, available : %d", user_id.toStdString().c_str(), available);
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    if (!available) {
        if (!main_window_view_->IsScreenShareWindow() &&
            DataStore::Instance()->GetCurrentMainWindowUser() == user_id.toStdString()) {
            SlotRemoveVideoFromMainScreen(user_id.toStdString());
        } else {
            for (auto item : current_page_video_view_list_) {
                if (item->GetUserId() == user_id.toStdString() && !item->IsScreenShareWindow()) {
                    item->StopPreview();
                    break;
                }
            }
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
    LINFO("SlotOnRemoteUserScreenVideoOpen, user_id : %s, available : %d", user_id.toStdString().c_str(), available);
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }

    std::string current_main_screen_user = DataStore::Instance()->GetCurrentMainWindowUser();
    if (!current_main_screen_user.empty()) {
        if (available) {
            if (current_page_video_view_list_.size() < page_size_) {
                InsertUser(*user_info, true);
                ChangeButtonsStatus();
                return;
            } else {
                all_screen_share_userid_list_.push_front(user_id.toStdString());
                if (all_video_userid_list_.contains(user_id.toStdString())) {
                    all_video_userid_list_.removeOne(user_id.toStdString());
                    all_video_userid_list_.push_front(user_id.toStdString());

                    // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
                    // The order of the mic-on list changed. Stop the stream pull on the current page first
                    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                        VideoRenderView* item = current_page_video_view_list_.at(i);
                        item->StopCurrentVideo();
                    }
                }
            }
        } else {
            if (!(user_id.toStdString() == main_window_view_->GetUserId() && main_window_view_->IsScreenShareWindow())) {
                RemoveUser(user_id.toStdString(), true);
                ChangeButtonsStatus();
                return;
            } else if (all_video_userid_list_.contains(user_id.toStdString())) {
                all_video_userid_list_.removeOne(user_id.toStdString());
                int insert_index = all_video_userid_list_.indexOf(DataStore::Instance()->GetCurrentUserInfo().user_id);
                all_video_userid_list_.insert(insert_index + 1, user_id.toStdString());

                // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
                // The order of the mic-on list changed. Stop the stream pull on the current page first
                for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                    VideoRenderView* item = current_page_video_view_list_.at(i);
                    item->StopCurrentVideo();
                }
            }
        }
    } else {
        if (all_screen_share_userid_list_.contains(user_id.toStdString())
            && stage_list_direction_ == StageListDirection::kGridDirection) {
            all_screen_share_userid_list_.removeOne(user_id.toStdString());
            for (auto view_iter = current_page_video_view_list_.begin(); view_iter != current_page_video_view_list_.end(); view_iter++) {
                if ((*view_iter)->GetUserId() == user_id.toStdString()) {
                    VideoRenderView* view = *view_iter;
                    current_page_video_view_list_.erase(view_iter);
                    RemoveVideoViewFromStage(view);
                    break;
                }
            }
            int pos = 0, row = 1, column = 1;
            GridLayoutDeciders(row, column);
            for (auto view_iter = current_page_video_view_list_.begin();
                view_iter != current_page_video_view_list_.end(); ++view_iter) {
                stage_layout_->addWidget(*view_iter, pos / column, pos % column);
                ++pos;
            }
        } else if (all_video_userid_list_.contains(user_id.toStdString())) {
            all_video_userid_list_.removeOne(user_id.toStdString());
            all_video_userid_list_.push_front(user_id.toStdString());

            // 麦上列表的排列顺序发生改变，此时先停止当前页的拉流
            // The order of the mic-on list changed. Stop the stream pull on the current page first
            for (int i = 0; i < current_page_video_view_list_.size(); i++) {
                VideoRenderView* item = current_page_video_view_list_.at(i);
                item->StopCurrentVideo();
            }
        }
    }

    UpdateCurrentVideoPage();
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
    if (main_window_view_->GetUserId() == user_id.toStdString() && !main_window_view_->IsScreenShareWindow()) {
        main_window_view_->InitMainVideo();
        DataStore::Instance()->SetCurrentMainWindowUser("");
        TUIRoomCore::GetInstance()->StopRemoteView(user_id.toStdString(), TUIStreamType::kStreamTypeCamera);
    }

    UserExit(user_id.toStdString());
}

void StageListController::SlotShowVideoOnMainScreen(const std::string user_id, bool is_screen_share_window) {
    // 从麦上列表移出被双击的用户（该用户肯定是正在显示的用户）
    // Move the double-clicked user from the mic-on list (the user is being displayed)
    LINFO("User ShowVideoOnMainScreen, user_id : %s, is_screen_share_window : %d", user_id.c_str(), is_screen_share_window);

    if (is_screen_share_window) {
        all_screen_share_userid_list_.removeOne(user_id);
    } else {
        all_video_userid_list_.removeOne(user_id);
    }

    if (stage_list_direction_ == StageListDirection::kGridDirection) {
        // 先切换为右侧布局，然后将双击的画面放大
        emit StatusUpdateCenter::Instance().SignalStageListLayoutChanged(StageListDirection::kVerDirection);
    }

    std::string current_main_window_user = DataStore::Instance()->GetCurrentMainWindowUser();
    if (!current_main_window_user.empty()) {
        if (main_window_view_->IsScreenShareWindow()) {
            all_screen_share_userid_list_.push_front(current_main_window_user);
        } else {
            // 麦上列表的显示顺序 : [ 屏幕分享(者) | 主持人 | 自己 | 其他成员 ]
            // Display order of the mic-on list: [ Screen sharer | Host | You | Other members ]
            const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(current_main_window_user);
            if (user_info == nullptr) {
                return;
            }
            if (user_info->has_screen_stream || user_info->role == TUIRole::kMaster || 
                user_info->user_id == DataStore::Instance()->GetCurrentUserInfo().user_id) {
                all_video_userid_list_.push_front(current_main_window_user);
            } else {
                int insert_index = all_video_userid_list_.indexOf(DataStore::Instance()->GetCurrentUserInfo().user_id);
                if (insert_index != -1) {
                    all_video_userid_list_.insert(insert_index + 1, current_main_window_user);
                } else {
                    insert_index = all_screen_share_userid_list_.size();
                    all_video_userid_list_.insert(insert_index, current_main_window_user);
                }
            }
        }
    } else if (all_video_userid_list_.size() + all_screen_share_userid_list_.size() < page_size_) {
        RemoveUser(user_id, is_screen_share_window);
    }

    main_window_view_->StopCurrentVideo();
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        item->StopCurrentVideo();
    }

    UpdateCurrentVideoPage();
    ChangeButtonsStatus();
    // 将其视频显示到主窗口
    // Display the video in the main window
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
    LINFO("User RemoveVideoFromMainScreen, user_id : %s", user_id.c_str());
    const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
    if (user_info == nullptr) {
        return;
    }
    if (!all_screen_share_userid_list_.empty()) {
        // 如果有人在屏幕分享，则显示在主窗口
        // Display the shared screen in the main window
        LINFO("User Show Screen Share On Main Screen, user_id : %s", all_screen_share_userid_list_[0].c_str());
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
    if (last_video_index_ + (page_size_ - all_screen_share_userid_list_.size()) > all_video_userid_list_.size()) {
        last_video_index_ = all_video_userid_list_.size() - (page_size_ - all_screen_share_userid_list_.size());
    }
    int new_index = last_video_index_ >= 0 ? last_video_index_ : (last_video_index_ = 0);

    int screen_user_index = 0;
    const std::string local_user_id = DataStore::Instance()->GetCurrentUserInfo().user_id;
    for (int i = 0; i < current_page_video_view_list_.size(); i++) {
        VideoRenderView* item = current_page_video_view_list_.at(i);
        if (screen_user_index < all_screen_share_userid_list_.size()) {
            const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_screen_share_userid_list_.at(screen_user_index++));
            if (item_user && item) {
                item->UpdateUserInfo(*item_user);
                item->UserStartScreenShare(item->GetUserId());
            }
        } else {
            if (new_index < all_video_userid_list_.size()) {
                const TUIUserInfo* item_user = TUIRoomCore::GetInstance()->GetUserInfo(all_video_userid_list_.at(new_index++));
                if (item_user && item) {
                    item->UpdateUserInfo(*item_user);
                    if (item_user->user_id == local_user_id) {
                        item->UpdateCameraPreview();
                    } else {
                        item->StartPreview();
                    }
                }
            }
        }
    }
}