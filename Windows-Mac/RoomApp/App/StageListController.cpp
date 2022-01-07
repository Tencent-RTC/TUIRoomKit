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
    InitRoomLayout();
    ReSizeStage();
}

void StageListController::InitConnect() {
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserEnter, this, &StageListController::SlotOnRemoteUserEnterRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserLeave, this, &StageListController::SlotOnRemoteUserLeaveRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserCameraAvailable, this, &StageListController::SlotOnRemoteUserVideoOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserAudioAvailable, this, &StageListController::SlotOnRemoteUserAudioOpen);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserScreenVideoAvailable, this, &StageListController::SlotOnRemoteUserScreenVideoOpen);
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

void StageListController::InitRoomLayout() {
    // 预先创建主持人的位置
    master_video_view_ = new VideoRenderView(this);
    connect(master_video_view_, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
    stage_layout_->addWidget(master_video_view_, 0, 0);
    all_video_view_list_.push_front(master_video_view_);
    current_page_video_view_list_.push_front(master_video_view_);
    master_video_view_->show();
}

void StageListController::ReSizeStage() {
    ReSizeRoomStage();
}

void StageListController::PopVideoTip(bool top) {
    for (auto view : all_video_view_list_) {
        view->PopVideoTip(top);
    }
}
void StageListController::ShowVideoTip(bool show, bool is_minimized) {
    is_mainwindow_minimized_ = is_minimized;
    for (auto view : all_video_view_list_) {
        view->ShowVideoTip(show, is_minimized);
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
    SetVideoViewLayout(stage_list_direction_);
    ReSizeStage();
}

void StageListController::SetStageListDirection(StageListDirection direction) {
    stage_list_direction_ = direction;
    ui_->pop_widget->setStyle(QApplication::style());
    ui_->stage_list->setStyle(QApplication::style());

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

        for (auto view : all_video_view_list_) {
            view->setFixedSize(kVideoViewWidth - (is_popup_list_ ? 15 : 25), kVideoViewHeight - 15);
        }
        for (auto view : current_page_video_view_list_) {
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

        for (auto view : all_video_view_list_) {
            view->setFixedSize(kVideoViewWidth - 20, kVideoViewHeight - 25);
        }
        for (auto view : current_page_video_view_list_) {
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
        current_page_video_view_list_.size() < all_video_view_list_.size()) {
        // 上一页按钮
        if (last_video_index_ < page_size_) {
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
        if (last_video_index_ == all_video_view_list_.size() - 1) {
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

void StageListController::InsertUser(const TUIUserInfo& user_info) {
    LINFO("InsertUser user_id:%s, user_name:%s, role:%d",
        user_info.user_id.c_str(), user_info.user_name.c_str(), user_info.role);
    if (IsOnStage(user_info.user_id)) {
        UpdateUserInfo(user_info);
        return;
    }
    // 显示主持人
    if (user_info.role == TUIRole::kMaster) {
        AddMaster(user_info);
        return;
    }
    // 显示成员自己
    if (DataStore::Instance()->GetCurrentUserInfo().user_id == user_info.user_id) {
        AddLocalUser(user_info);
        return;
    }
    // 显示其他成员
    VideoRenderView* video_view = new (std::nothrow) VideoRenderView(this);
    if (video_view == nullptr) {
        return;
    }
    connect(video_view, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
    video_view->ShowVideoTip(false, is_mainwindow_minimized_);
    video_view->UpdateUserInfo(user_info);
    all_video_view_list_.push_back(video_view);
    // 如果当前页还可以展示视频
    if (current_page_video_view_list_.size() < page_size_) {
        current_page_video_view_list_.push_back(video_view);

        int count = stage_layout_->count();
        for (int i = 0; i < count + 1; ++i) {
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                auto item = stage_layout_->itemAtPosition(i, 0);
                if (item == nullptr) {
                    stage_layout_->addWidget(video_view, i, 0);
                }
            } else {
                auto item = stage_layout_->itemAtPosition(0, i);
                if (item == nullptr) {
                    stage_layout_->addWidget(video_view, 0, i);
                }
            }
        }
        // 开始订阅视频流
        video_view->show();
        video_view->StartPreview();
        if (is_popup_list_) {
            video_view->PopVideoTip(true);
        }
        last_video_index_ = current_page_video_view_list_.size() - 1;
    } else {
        video_view->hide();
    }
    ReSizeStage();
}

void StageListController::AddMaster(const TUIUserInfo& user_info) {
    if (master_video_view_ == nullptr) {
        return;
    }
    // 开始订阅视频流
    master_video_view_->show();
    master_video_view_->resize(kVideoViewWidth, kVideoViewHeight);
    master_video_view_->UpdateUserInfo(user_info);
    master_video_view_->StartPreview();
    last_video_index_ = current_page_video_view_list_.size() - 1;
    ReSizeStage();
}

void StageListController::AddLocalUser(const TUIUserInfo& user_info) {
    VideoRenderView* video_view = new (std::nothrow) VideoRenderView(this);
    if (video_view == nullptr || all_video_view_list_.size() == 0) {
        return;
    }
    connect(video_view, &VideoRenderView::SignalShowVideoOnMainScreen, this, &StageListController::SlotShowVideoOnMainScreen);
    video_view->UpdateUserInfo(user_info);
    all_video_view_list_.insert(++all_video_view_list_.begin(), video_view);
    // 如果当前只有一页
    if (last_video_index_ < page_size_ - 1) {
        // 插入本人到主持人后方，先将窗口往后赶
        int stage_count = stage_layout_->count();
        for (int i = stage_count - 1; i >= 1; --i) {
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                auto item_move = stage_layout_->itemAtPosition(i, 0);
                if (item_move != nullptr) {
                    stage_layout_->addWidget(item_move->widget(), i + 1, 0);
                }
            } else {
                auto item_move = stage_layout_->itemAtPosition(0, i);
                if (item_move != nullptr) {
                    stage_layout_->addWidget(item_move->widget(), 0, i + 1);
                }
            }
        }
        // 插入自己到当前页
        if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
            stage_layout_->addWidget(video_view, 1, 0);
        } else {
            stage_layout_->addWidget(video_view, 0, 1);
        }
        current_page_video_view_list_.insert(++current_page_video_view_list_.begin(), video_view);
        video_view->StartPreview();
        video_view->show();
        // 当前页超出，则需要删除最后的窗口
        if (current_page_video_view_list_.size() > page_size_) {
            auto last_video = current_page_video_view_list_.back();
            last_video->hide();
            last_video->StopPreview();
            stage_layout_->removeWidget(last_video);
            current_page_video_view_list_.remove(last_video);
        }
        last_video_index_ = current_page_video_view_list_.size() - 1;
    } else {
        video_view->hide();
        // 本人插入后，last_video_index_一定往后推
        ++last_video_index_;
    }
    ReSizeStage();
}
void StageListController::SlotUpdateUserInfo(const TUIUserInfo& user_info) {
    this->UpdateUserInfo(user_info);
}
void StageListController::UpdateUserInfo(const TUIUserInfo& user_info) {
    LINFO("UpdateUserInfo user_id:%s, user_name:%s, role:%d,\
        has_video_stream:%d, has_audio_stream:%d,has_screen_stream:%d",
        user_info.user_id.c_str(), user_info.user_name.c_str(), user_info.role,
        user_info.has_video_stream, user_info.has_audio_stream, user_info.has_screen_stream);
    for (auto view : all_video_view_list_) {
        if (view->GetUserId() == user_info.user_id) {
            view->UpdateUserInfo(user_info);
            return;
        }
    }
}

void StageListController::RemoveUser(const std::string& user_id) {
    LINFO("RemoveUser user_id:%s", user_id.c_str());
    RemoveVideoView(user_id);
    ReSizeStage();
}

liteav::TXView StageListController::GetPlayWindow(const std::string& user_id) {
    for (auto view : all_video_view_list_) {
        if (view->GetUserId() == user_id) {
            return view->GetPlayWindow();
        }
    }
    return NULL;
}

bool StageListController::IsOnStage(const std::string& user_id) {
    for (auto view : all_video_view_list_) {
        if (view->GetUserId() == user_id) {
            return true;
        }
    }
    return false;
}

void StageListController::ShowPreviousPage() {
    if (last_video_index_ == page_size_ - 1) {
        return;
    }
    LINFO("ShowPreviousPage");
    auto list = GetPreviousPage();
    SetCurrentPageVideoView(list);
    ChangeButtonsStatus();
}

void StageListController::ShowNextPage() {
    if (last_video_index_ == all_video_view_list_.size() - 1) {
        return;
    }
    LINFO("ShowNextPage");
    auto list = GetNextPage();
    SetCurrentPageVideoView(list);
    ChangeButtonsStatus();
}

int StageListController::GetVideoViewPos(const std::string& user_id) {
    int pos = 0;
    auto it = all_video_view_list_.begin();
    for (; it != all_video_view_list_.end(); ++it) {
        if ((*it)->GetUserId() == user_id) {
            return pos;
        }
        ++pos;
    }
    return -1;
}

void StageListController::ClearCurrentPageVideoView() {
    auto it = current_page_video_view_list_.begin();
    for (; it != current_page_video_view_list_.end(); ++it) {
        if ((*it) != master_video_view_) {
            (*it)->hide();
            (*it)->StopPreview();
            stage_layout_->removeWidget(*it);
        }
    }
    current_page_video_view_list_.clear();
    current_page_video_view_list_.push_front(master_video_view_);
}

void StageListController::SetCurrentPageVideoView(std::list<VideoRenderView*> video_view_list) {
    auto iterator_new = video_view_list.begin();
    auto iterator_old = current_page_video_view_list_.begin();
    VideoRenderView* new_video = *iterator_new;
    VideoRenderView* old_video = *iterator_old;
    int pos = 0;
    for (; pos < page_size_; ++pos) {
        // 逐个删除和添加，防止页面变化过大闪烁
        // 先删除旧的视频
        if (iterator_old != current_page_video_view_list_.end()) {
            old_video = *iterator_old;
            ++iterator_old;
            if (std::find(video_view_list.begin(), video_view_list.end(), old_video) == video_view_list.end()) {
                old_video->hide();
                old_video->StopPreview();
                stage_layout_->removeWidget(old_video);
            }
        }
        // 添加新的视频
        if (iterator_new != video_view_list.end()) {
            new_video = *iterator_new;
            ++iterator_new;
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                stage_layout_->addWidget(new_video, pos, 0);
            } else {
                stage_layout_->addWidget(new_video, 0, pos);
            }
            new_video->StartPreview();
            new_video->show();
            if (is_popup_list_) {
                new_video->PopVideoTip(true);
            }
        }
    }
    std::swap(video_view_list, current_page_video_view_list_);
}

std::list<VideoRenderView*> StageListController::GetPreviousPage() {
    if (all_video_view_list_.size() <= page_size_) {
        last_video_index_ = all_video_view_list_.size() - 1;
        return all_video_view_list_;
    }
    std::list<VideoRenderView*> list;
    std::vector<VideoRenderView*> array_video{ all_video_view_list_.begin(),all_video_view_list_.end() };
    int last_index = last_video_index_ - (page_size_ - (is_member_screen_sharing_ ? 2 : 1));
    int member_page_size = page_size_ - (is_member_screen_sharing_ ? 2 : 1);
    if (screen_share_video_view_ != nullptr) {
        --member_page_size;
        --last_index;
    }
    // 当往前翻一页不够一页时，取最前面的一页
    if (last_index <= page_size_ - 1) {
        for (int i = 0; i < page_size_; ++i) {
            list.push_back(array_video[i]);
        }
        last_index = list.size() - 1;
    } else {
        for (int i = last_index - member_page_size + 1; i <= last_index; ++i) {
            list.push_back(array_video[i]);
        }
        list.push_front(master_video_view_);
        if (screen_share_video_view_ && is_member_screen_sharing_) {
            list.push_front(*(++all_video_view_list_.begin()));
            list.push_front(screen_share_video_view_);
        } else if (is_member_screen_sharing_) {
            list.push_front(*all_video_view_list_.begin());
        }
    }
    last_video_index_ = last_index;
    return std::move(list);
}

std::list<VideoRenderView*> StageListController::GetNextPage() {
    if (all_video_view_list_.size() <= page_size_) {
        last_video_index_ = all_video_view_list_.size() - 1;
        return all_video_view_list_;
    }
    std::list<VideoRenderView*> list;
    std::vector<VideoRenderView*> array_video{ all_video_view_list_.begin(),all_video_view_list_.end() };
    int last_index = last_video_index_ + page_size_ - (is_member_screen_sharing_ ? 2 : 1);
    int member_page_size = page_size_ - (is_member_screen_sharing_ ? 2 : 1);
    if (screen_share_video_view_ != nullptr) {
        --last_index;
        --member_page_size;
    }
    // 当往后翻已经不满一页时，取最后的一页
    if (last_index + 1 >= array_video.size()) {
        for (int i = array_video.size() - member_page_size; i < array_video.size(); ++i) {
            list.push_back(array_video[i]);
        }
        last_video_index_ = array_video.size() - 1;
    } else {
        // 当往后翻至少还有一页时，取后面的一页
        for (int i = last_video_index_ + 1; i <= last_index; ++i) {
            list.push_back(array_video[i]);
        }
        last_video_index_ = last_index;
    }
    list.push_front(master_video_view_);
    if (screen_share_video_view_ && is_member_screen_sharing_) {
        list.push_front(*(++all_video_view_list_.begin()));
        list.push_front(screen_share_video_view_);
    } else if (is_member_screen_sharing_) {
        list.push_front(*all_video_view_list_.begin());
    }
    return std::move(list);
}

void StageListController::RemoveVideoView(std::string user_id) {
    auto iterator_current_page = find_if(current_page_video_view_list_.begin(), current_page_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
    });
    auto iterator_stage = find_if(all_video_view_list_.begin(), all_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
    });
    // 在所有窗口中找不到该用户则退出
    if (iterator_stage == all_video_view_list_.end()) {
        return;
    }
    // 要删除的窗口不在当前列表显示
    if (iterator_current_page == current_page_video_view_list_.end()) {
        int remove_index = GetVideoViewPos(user_id);
        // 如果当前显示页之前的对象退出了，last_video_index_ 需要往前推
        if (remove_index < last_video_index_) {
            --last_video_index_;
        }
        if (iterator_stage != all_video_view_list_.end()) {
            (*iterator_stage)->StopPreview();
            (*iterator_stage)->close();
            all_video_view_list_.erase(iterator_stage);
            delete (*iterator_stage);
        }
    } else {
        // 主持人只关闭视频，不销毁窗口
        if (*iterator_current_page == master_video_view_) {
            master_video_view_->StopPreview();
            return;
        }
        // 要删除的窗口在当前列表显示
        // 寻找一个替换的窗口
        VideoRenderView* repalce_view = ReplaceVideoView(user_id);
        if (repalce_view == nullptr) {
            all_video_view_list_.erase(iterator_stage);
            RemoveVideoViewFromStage(*iterator_current_page);
            current_page_video_view_list_.erase(iterator_current_page);
            --last_video_index_;
        } else {
            // 判断替换的窗口的位置在当前页之前还是之后
            // 如果替换的窗口的位置在当前页之前，则last_video_index_需要往前推
            int remove_index = GetVideoViewPos(repalce_view->GetUserId());
            if (remove_index < last_video_index_) {
                --last_video_index_;
            }
            ReplaceVideoViewFromStage(repalce_view, *iterator_stage);
            all_video_view_list_.erase(iterator_stage);
            current_page_video_view_list_.erase(iterator_current_page);
            current_page_video_view_list_.push_back(repalce_view);
        }
    }
    ReSizeStage();
}

void StageListController::RemoveVideoViewFromStage(VideoRenderView* video_view) {
    if (video_view == nullptr) {
        return;
    }
    stage_layout_->removeWidget(video_view);
    video_view->StopPreview();
    video_view->close();
    delete video_view;
    video_view = nullptr;
}

VideoRenderView* StageListController::ReplaceVideoView(std::string user_id) {
    auto iterator_stage = all_video_view_list_.begin();
    for (; iterator_stage != all_video_view_list_.end(); ++iterator_stage) {
        if ((*iterator_stage) != master_video_view_ &&
            (*iterator_stage)->GetUserId() != user_id && 
            !(*iterator_stage)->IsOnCurrentPage() ) {
            return *iterator_stage;
        }
    }
    return nullptr;
}

void StageListController::ReplaceVideoViewFromStage(VideoRenderView* new_video_view, VideoRenderView* old_video_view) {
    if (new_video_view == nullptr || old_video_view == master_video_view_) {
        return;
    }
    auto item_remove = stage_layout_->itemAtPosition(0, 0);
    for (int i = 0; i < stage_layout_->count(); ++i) {
        if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
            item_remove = stage_layout_->itemAtPosition(i, 0);
        } else {
            item_remove = stage_layout_->itemAtPosition(0, i);
        }
        if (item_remove == nullptr)
            continue;
        auto video_item = item_remove->widget();
        if (video_item == old_video_view) {
            stage_layout_->removeWidget(old_video_view);
            old_video_view->StopPreview();
            old_video_view->close();
            delete old_video_view;
            if (stage_list_direction_ == StageListDirection::kVerDirection || is_popup_list_) {
                stage_layout_->addWidget(new_video_view, i, 0);
            }
            else {
                stage_layout_->addWidget(new_video_view, 0, i);
            }
            new_video_view->show();
            new_video_view->StartPreview();
            return;
        }
    }
}

void StageListController::SlotOnRemoteUserEnterRoom(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    InsertUser(*user_info);
}

void StageListController::SlotOnRemoteUserLeaveRoom(const QString& user_id) {
    RemoveUser(user_id.toStdString());
}

void StageListController::SlotOnRemoteUserVideoOpen(const QString& user_id, bool available) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    if (!available) {
        TUIRoomCore::GetInstance()->StopRemoteView(user_id.toStdString());
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
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    if (screen_share_video_view_ != nullptr && available == false) {
        UserStopScreenShare(user_id.toStdString());
    }
    // 主持人分享不需要变换位置
    if (user_info->role == TUIRole::kMaster) {
        return;
    }
    if (available) {
        MoveScreenShareUserToHead(user_id.toStdString());
    } else {
        MoveScreenShareUserToBehind(user_id.toStdString());
    }
}

void StageListController::SlotOnRemoteUserEnterSpeechState(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    InsertUser(*user_info);
}

void StageListController::SlotOnRemoteUserExitSpeechState(const QString& user_id) {
    auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    if (user_info == nullptr) {
        return;
    }
    RemoveUser(user_id.toStdString());
}

void StageListController::SlotShowVideoOnMainScreen(const std::string& user_id) {
    emit SignalShowVideoOnMainScreen(user_id);
}

void StageListController::SlotInsertScreenOnStage(const std::string& user_id) {
    screen_share_video_view_ = new VideoRenderView(this);
    screen_share_video_view_->ScreenShareOnStage(user_id);
    connect(screen_share_video_view_, &VideoRenderView::SignalReviveScreenShare, this, &StageListController::SlotReviveScreenShare);
    auto new_list = current_page_video_view_list_;
    new_list.push_front(screen_share_video_view_);
    if (new_list.size() > page_size_) {
        new_list.resize(page_size_);
    }
    all_video_view_list_.push_front(screen_share_video_view_);
    ++last_video_index_;
    SetCurrentPageVideoView(new_list);
    ReSizeStage();
}

void StageListController::SlotReviveScreenShare(const std::string& user_id) {
    UserStopScreenShare(user_id);
    emit SignalReviveScreenShare(user_id);
}

void StageListController::UserStopScreenShare(const std::string& user_id) {
    if (screen_share_video_view_ == nullptr) {
        return;
    }
    VideoRenderView* replace_video = ReplaceVideoView(user_id);
    auto new_list = current_page_video_view_list_;
    new_list.erase(new_list.begin());
    if (replace_video != nullptr) {
        new_list.push_back(replace_video);
    }
    all_video_view_list_.erase(all_video_view_list_.begin());
    --last_video_index_;
    SetCurrentPageVideoView(new_list);
    ReSizeStage();
    screen_share_video_view_->deleteLater();
    screen_share_video_view_ = nullptr;
}

void StageListController::SlotReviveVideo(const std::string& user_id) {
    for (auto view : all_video_view_list_) {
        if (view->GetUserId() == user_id) {
            view->ReviveVideo();
            break;
        }
    }
    if (screen_share_video_view_ != nullptr) {
        TUIRoomCore::GetInstance()->StopRemoteView(screen_share_video_view_->GetUserId(), TUIStreamType::kStreamTypeScreen);
        SlotReviveScreenShare(screen_share_video_view_->GetUserId());
    }
}

void StageListController::SlotOnRoomMasterChanged(const QString& user_id) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user && local_user->user_id == user_id.toStdString()) {
        TXMessageBox::Instance().AddLineTextMessage(tr("You have become the new master."));
    }
    ChangeMaster(user_id.toStdString());
}

void StageListController::ChangeMaster(const std::string& user_id) {
    auto iterator_current_page = find_if(current_page_video_view_list_.begin(), current_page_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
        });
    auto iterator_stage = find_if(all_video_view_list_.begin(), all_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
        });
    // 在所有窗口中找不到该用户则退出
    if (iterator_stage == all_video_view_list_.end()) {
        return;
    }
    VideoRenderView* new_master_video = *iterator_stage;
    std::list<VideoRenderView*> new_stage_list = current_page_video_view_list_;
    new_stage_list.remove(master_video_view_);
    // 新主持人的窗口不在当前列表显示
    if (iterator_current_page == current_page_video_view_list_.end()) {
        int master_index = GetVideoViewPos(user_id);
        // 如果当前显示页之前的对象退出了，last_video_index_ 需要往前推
        if (master_index < last_video_index_) {
            --last_video_index_;
        }
        new_stage_list.insert(new_stage_list.begin(), new_master_video);
    } else {
        // 新主持人的窗口在当前列表显示
        // 寻找一个替换的窗口
        VideoRenderView* repalce_view = ReplaceVideoView(user_id);
        if (repalce_view == nullptr) {
            new_stage_list.remove(new_master_video);
            new_stage_list.insert(new_stage_list.begin(), new_master_video);
            --last_video_index_;
        } else {
            // 判断替换的窗口的位置在当前页之前还是之后
            // 如果替换的窗口的位置在当前页之前，则last_video_index_需要往前推
            int replace_index = GetVideoViewPos(repalce_view->GetUserId());
            if (replace_index < last_video_index_) {
                --last_video_index_;
            }
            auto new_replace_pos = std::find(new_stage_list.begin(), new_stage_list.end(), new_master_video);
            new_stage_list.insert(new_replace_pos, repalce_view);
            new_stage_list.remove(new_master_video);
            new_stage_list.insert(new_stage_list.begin(), new_master_video);
        }
    }
    SetCurrentPageVideoView(new_stage_list);

    auto find_master = std::find(all_video_view_list_.begin(), all_video_view_list_.end(), master_video_view_);
    if (find_master != all_video_view_list_.end()) {
        master_video_view_->StopPreview();
        master_video_view_->close();
        all_video_view_list_.remove(master_video_view_);
        delete master_video_view_;
    }
    master_video_view_ = new_master_video;
    all_video_view_list_.remove(new_master_video);
    all_video_view_list_.insert(all_video_view_list_.begin(), new_master_video);
    ReSizeStage();
}

bool StageListController::IsVerticalStageListDirection() const {
    return (StageListDirection::kVerDirection == stage_list_direction_);
}

void StageListController::MoveScreenShareUserToHead(const std::string& user_id) {
    auto iterator_current_page = find_if(current_page_video_view_list_.begin(), current_page_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
    });
    auto iterator_stage = find_if(all_video_view_list_.begin(), all_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
    });
    if (iterator_stage == all_video_view_list_.end()) {
        return;
    }
    is_member_screen_sharing_ = true;
    VideoRenderView* share_video = *iterator_stage;
    std::list<VideoRenderView*> new_stage_list = current_page_video_view_list_;
    if (iterator_current_page == current_page_video_view_list_.end()) {
        int share_index = GetVideoViewPos(user_id);
        if (share_index < last_video_index_) {
            --last_video_index_;
        }
        new_stage_list.insert(new_stage_list.begin(), share_video);
        new_stage_list.resize(page_size_);
    } else {
        new_stage_list.remove(share_video);
        new_stage_list.insert(new_stage_list.begin(), share_video);
    }
    all_video_view_list_.erase(iterator_stage);
    all_video_view_list_.insert(all_video_view_list_.begin(), share_video);
    SetCurrentPageVideoView(new_stage_list);
    ReSizeStage();
}

void StageListController::MoveScreenShareUserToBehind(const std::string& user_id) {
    auto iterator_stage = std::find_if(all_video_view_list_.begin(), all_video_view_list_.end(), [=](VideoRenderView* view) {
        return view->GetUserId() == user_id;
    });
    if (iterator_stage == all_video_view_list_.end()) {
        return;
    }
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    is_member_screen_sharing_ = false;
    auto share_view = *iterator_stage;
    all_video_view_list_.remove(share_view);
    std::list<VideoRenderView*> new_stage_list = current_page_video_view_list_;
    new_stage_list.remove(share_view);
    if (local_user->user_id == user_id) {
        all_video_view_list_.insert(++all_video_view_list_.begin(), share_view);
        new_stage_list.insert(++new_stage_list.begin(), share_view);
    } else {
        if (local_user->role == TUIRole::kMaster) {
            all_video_view_list_.insert(++all_video_view_list_.begin(), share_view);
            new_stage_list.insert(++new_stage_list.begin(), share_view);
        } else {
            all_video_view_list_.insert(++(++all_video_view_list_.begin()), share_view);
            new_stage_list.insert(++(++new_stage_list.begin()), share_view);
        }
    }
    SetCurrentPageVideoView(new_stage_list);
    ReSizeStage();
}

void StageListController::AddMainVideo(VideoRenderView* video_view) {
    return;
    main_video_view_ = video_view;
    connect(main_video_view_, &VideoRenderView::SignalReviveVideo, this, &StageListController::SlotReviveVideo);
    connect(main_video_view_, &VideoRenderView::SignalInsertScreenOnStage, this, &StageListController::SlotInsertScreenOnStage);
    connect(this, &StageListController::SignalReviveScreenShare, main_video_view_, &VideoRenderView::SlotReviveScreenShare);
}
