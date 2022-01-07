#include "MainWindowLayout.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "StatusUpdateCenter.h"
#include "DataStore.h"

MainWindowLayout::MainWindowLayout(QMainWindow* main_window)
    : main_window_(main_window)
#ifdef __APPLE__
    , view_dragger_(nullptr)
#else
    , view_dragger_(main_window)
#endif
{
}

MainWindowLayout::~MainWindowLayout() {
    if (setting_ != nullptr) {
        setting_->close();
        DELETE_OBJECT(setting_);
    }

    DELETE_OBJECT(bottom_menu_bar_);
}
void MainWindowLayout::SetMainWindowUi(Ui::MainWindow* ui) {
    main_window_ui_ = ui;
    //top_menu_bar_ = new TopBarController(ui.centralWidget);
    top_menu_bar_ = ui->top_menu_bar;
    connect(top_menu_bar_, &TopBarController::SignalShowSetting, this, &MainWindowLayout::SlotShowSetting);
    top_menu_bar_->hide();
}

StageListController* MainWindowLayout::GetStageListController() {
    return stage_list_view_control_;
}
ChatRoomViewController* MainWindowLayout::GetChatRoomViewController() {
    return chat_room_view_control_;
}
BottomBarController* MainWindowLayout::GetBottomBarController() {
    return bottom_menu_bar_;
}
TopBarController* MainWindowLayout::GetTopBarController() {
    return top_menu_bar_;
}
BottomBarController* MainWindowLayout::GetShareMenuBar() {
    return share_menu_bar_;
}
PopStageListController* MainWindowLayout::GetPopStageListController() {
    return pop_widget_;
}
VideoRenderView* MainWindowLayout::GetMainWidgetController() {
    return main_widget_control_;
}
void MainWindowLayout::InitLayout() {
    if (top_menu_bar_ != nullptr)
        top_menu_bar_->show();
    // 根据房间类型生成不同的布局
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }

    stage_list_view_control_ = new StageListController(main_window_ui_->content_widget);
    main_widget_control_ = new VideoRenderView(main_window_ui_->content_widget);
    main_widget_control_->InitMainVideo();
    main_widget_control_->show();
    stage_list_view_control_->AddMainVideo(main_widget_control_);
    chat_room_view_control_ = new ChatRoomViewController(*local_user, main_window_);
    chat_room_view_control_->show();
    if (main_window_ui_->chat_widget->layout() != nullptr) {
        main_window_ui_->chat_widget->layout()->addWidget(chat_room_view_control_);
    }
    QHBoxLayout* h_layout = new QHBoxLayout(main_window_);
    h_layout->addWidget(main_widget_control_);
    h_layout->setSpacing(0);
    h_layout->setMargin(0);
    QVBoxLayout* v_layout = new QVBoxLayout(main_window_);
    v_layout->addWidget(stage_list_view_control_);
    v_layout->addLayout(h_layout);
    v_layout->setSpacing(0);
    v_layout->setMargin(0);

    QHBoxLayout* main_layout = new QHBoxLayout(main_window_ui_->content_widget);
    main_layout->addLayout(v_layout);
    main_layout->setSpacing(0);
    main_layout->setMargin(0);
    main_window_ui_->content_widget->setLayout(main_layout);
    bottom_menu_bar_ = new BottomBarController(main_window_ui_->centralWidget);
    InitConnect();

    SlotShowChatRoom(false);
}

void MainWindowLayout::InitConnect() {
    connect(bottom_menu_bar_, &BottomBarController::SignalShowSetting, this, &MainWindowLayout::SlotShowSetting);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserScreenVideoAvailable, this, &MainWindowLayout::SlotOnRemoteUserScreenVideoAvailable);
    connect(stage_list_view_control_, &StageListController::SignalShowVideoOnMainScreen, this, &MainWindowLayout::SlotShowVideoOnMainScreen);
    connect(chat_room_view_control_, &ChatRoomViewController::SignalShowChatRoom, this, &MainWindowLayout::SlotShowChatRoom);

    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalStageListLayoutChanged, this, &MainWindowLayout::SlotStageListLayoutChanged);
}
void MainWindowLayout::SlotShowSetting(int index) {
    if (setting_ == nullptr) {
        setting_ = new SettingViewController(main_window_);
        connect(setting_, &SettingViewController::SignalClose, this, [=]() {setting_->close(); delete setting_; setting_ = nullptr; });
    }
    if (index >= 0 && index <= 3) {
        setting_->SetCurrentPage(index);
        setting_->show();
        setting_->raise();
    }
}

void MainWindowLayout::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    ResizeMove(event);
}
void MainWindowLayout::mousePressEvent(QMouseEvent* event) {
    if (event->button() == Qt::LeftButton &&
        (event->pos().x() < PADDING || event->pos().y() < PADDING ||
            event->pos().x() > main_window_->width() - PADDING || event->pos().y() > main_window_->height() - PADDING)) {
        is_resize_pressed_ = true;
    } else {
        view_dragger_.mousePress(event);
    }
    emit StatusUpdateCenter::Instance().SignalMainWindowActive();
}
void MainWindowLayout::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    if (event->button() == Qt::LeftButton) {
        is_resize_pressed_ = false;
        if (resize_dir_ != NONE) {
            main_window_->releaseMouse();
            main_window_->setCursor(QCursor(Qt::ArrowCursor));
        }
    }
}
void MainWindowLayout::mouseDoubleClickEvent(QMouseEvent *event) {
    view_dragger_.mouseDoubleClick(event);
}
void MainWindowLayout::showEvent(QShowEvent* event) {
    if (stage_list_view_control_ != NULL && main_window_->isVisible() && !main_window_->isMinimized())
        stage_list_view_control_->ShowVideoTip(true);

    if (bottom_menu_bar_ == nullptr)
        return;

    if (main_window_ui_->chat_widget->isVisible()) {
        bottom_menu_bar_->resize(main_window_ui_->centralWidget->width() - 10 - main_window_ui_->chat_widget->width(), 60);
    } else {
        bottom_menu_bar_->resize(main_window_ui_->centralWidget->width() - 10, 60);
    }

    bottom_menu_bar_->move(5, main_window_ui_->centralWidget->height() - bottom_menu_bar_->height() - 5);
}
void MainWindowLayout::resizeEvent(QResizeEvent *event) {
    if (bottom_menu_bar_ == nullptr)
        return;

    if (main_window_ui_->chat_widget->isVisible()) {
        bottom_menu_bar_->resize(main_window_ui_->centralWidget->width() - 10 - main_window_ui_->chat_widget->width(), 60);
    } else {
        bottom_menu_bar_->resize(main_window_ui_->centralWidget->width() - 10, 60);
    }
    bottom_menu_bar_->move(5, main_window_ui_->centralWidget->height() - bottom_menu_bar_->height() - 5);
}

void MainWindowLayout::ResetArrowCursor() {
    is_resize_pressed_ = false;
    main_window_->setCursor(Qt::ArrowCursor);
}

void MainWindowLayout::ResizeMove(QMouseEvent* event) {
    QPoint global_point = event->globalPos();

    QRect rect = main_window_->rect();
    QPoint top_left = main_window_->mapToGlobal(rect.topLeft());
    QPoint right_bottom = main_window_->mapToGlobal(rect.bottomRight());
    QRect old_rect = QRect(top_left, right_bottom);

    if (!main_window_->isMaximized() && !main_window_->isMinimized() && !main_window_->isFullScreen()) {
        if (!is_resize_pressed_) {
            this->Region(global_point);
        } else {
            if (resize_dir_ != NONE) {
                QRect new_rect(top_left, right_bottom);
                switch (resize_dir_) {
                case LEFT:
                    if (right_bottom.x() - global_point.x() <= main_window_->minimumWidth()) {
                        new_rect.setLeft(top_left.x());  //只改变左边界，小于界面的最小宽度时，设置为左上角横坐标为窗口x
                    } else {
                        new_rect.setLeft(global_point.x());
                    }
                    break;
                case RIGHT:
                    new_rect.setWidth(global_point.x() - top_left.x());
                    break;
                case UP:
                    if (right_bottom.y() - global_point.y() <= main_window_->minimumHeight()) {
                        new_rect.setY(top_left.y());
                    } else {
                        new_rect.setY(global_point.y());
                    }
                    break;
                case DOWN:
                    new_rect.setHeight(global_point.y() - top_left.y());
                    break;
                case LEFTTOP:
                    if (right_bottom.x() - global_point.x() <= main_window_->minimumWidth()) {
                        new_rect.setX(top_left.x());
                    } else {
                        new_rect.setX(global_point.x());
                    }
                    if (right_bottom.y() - global_point.y() <= main_window_->minimumHeight()) {
                        new_rect.setY(top_left.y());
                    } else {
                        new_rect.setY(global_point.y());
                    }
                    break;
                case RIGHTTOP:
                    if (global_point.x() - top_left.x() >= main_window_->minimumWidth()) {
                        new_rect.setWidth(global_point.x() - top_left.x());
                    } else {
                        new_rect.setWidth(right_bottom.x() - top_left.x());
                    }
                    if (right_bottom.y() - global_point.y() >= main_window_->minimumHeight()) {
                        new_rect.setY(global_point.y());
                    } else {
                        new_rect.setY(top_left.y());
                    }
                    break;
                case LEFTBOTTOM:
                    if (right_bottom.x() - global_point.x() >= main_window_->minimumWidth()) {
                        new_rect.setX(global_point.x());
                    } else {
                        new_rect.setX(top_left.x());
                    }
                    if (global_point.y() - top_left.y() >= main_window_->minimumHeight()) {
                        new_rect.setHeight(global_point.y() - top_left.y());
                    } else {
                        new_rect.setHeight(right_bottom.y() - top_left.y());
                    }
                    break;
                case RIGHTBOTTOM:
                    new_rect.setWidth(global_point.x() - top_left.x());
                    new_rect.setHeight(global_point.y() - top_left.y());
                    break;
                default:
                    break;
                }

                if (old_rect.width() - new_rect.width() > PADDING || old_rect.height() - new_rect.height() > PADDING
                    || new_rect.width() - old_rect.width() > PADDING || new_rect.height() - old_rect.height() > PADDING) {
                    main_window_->setGeometry(new_rect);
                }
            }
        }
    }
}

void MainWindowLayout::Region(const QPoint& current_global_point) {
    // 获取窗体在屏幕上的位置区域，topLeft为坐上角点，rightButton为右下角点
    QRect rect = main_window_->rect();

    QPoint top_left = main_window_->mapToGlobal(rect.topLeft()); //将左上角的(0,0)转化为全局坐标
    QPoint right_bottom = main_window_->mapToGlobal(rect.bottomRight());

    int x = current_global_point.x();
    int y = current_global_point.y();

    if (((top_left.x() + PADDING >= x) && (top_left.x() <= x))
        && ((top_left.y() + PADDING >= y) && (top_left.y() <= y))) {
        // 左上角
        resize_dir_ = LEFTTOP;
        main_window_->setCursor(QCursor(Qt::SizeFDiagCursor));
    } else if (((x >= right_bottom.x() - PADDING) && (x <= right_bottom.x()))
        && ((y >= right_bottom.y() - PADDING) && (y <= right_bottom.y()))) {
        // 右下角
        resize_dir_ = RIGHTBOTTOM;
        main_window_->setCursor(QCursor(Qt::SizeFDiagCursor));
    } else if (((x <= top_left.x() + PADDING) && (x >= top_left.x()))
        && ((y >= right_bottom.y() - PADDING) && (y <= right_bottom.y()))) {
        //左下角
        resize_dir_ = LEFTBOTTOM;
        main_window_->setCursor(QCursor(Qt::SizeBDiagCursor));
    } else if (((x <= right_bottom.x()) && (x >= right_bottom.x() - PADDING))
        && ((y >= top_left.y()) && (y <= top_left.y() + PADDING))) {
        // 右上角
        resize_dir_ = RIGHTTOP;
        main_window_->setCursor(QCursor(Qt::SizeBDiagCursor));
    } else if ((x <= top_left.x() + PADDING) && (x >= top_left.x())) {
        // 左边
        resize_dir_ = LEFT;
        main_window_->setCursor(QCursor(Qt::SizeHorCursor));
    } else if ((x <= right_bottom.x()) && (x >= right_bottom.x() - PADDING)) {
        // 右边
        resize_dir_ = RIGHT;
        main_window_->setCursor(QCursor(Qt::SizeHorCursor));
    } else if ((y >= top_left.y()) && (y <= top_left.y() + PADDING)) {
        // 上边
        resize_dir_ = UP;
        main_window_->setCursor(QCursor(Qt::SizeVerCursor));
    } else if ((y <= right_bottom.y()) && (y >= right_bottom.y() - PADDING)) {
        // 下边
        resize_dir_ = DOWN;
        main_window_->setCursor(QCursor(Qt::SizeVerCursor));
    } else {
        // 默认
        resize_dir_ = NONE;
        main_window_->setCursor(QCursor(Qt::ArrowCursor));
    }
}
void MainWindowLayout::SlotStageListLayoutChanged(StageListDirection direction) {
    stage_list_view_control_->ShowVideoTip(false);
    main_window_ui_->content_widget->hide();
    stage_list_view_control_->SetStageListDirection(direction);
    if (direction == StageListDirection::kVerDirection) {
        delete main_window_ui_->content_widget->layout();
        QHBoxLayout* h_layout = new QHBoxLayout(main_window_);
        h_layout->addWidget(main_widget_control_);
        h_layout->addWidget(stage_list_view_control_);
        h_layout->setSpacing(0);
        h_layout->setMargin(0);
        QHBoxLayout* main_layout = new QHBoxLayout(main_window_);
        main_layout->addLayout(h_layout);
        main_layout->setSpacing(0);
        main_layout->setMargin(0);
        main_window_ui_->content_widget->setLayout(main_layout);
    } else if (direction == StageListDirection::kHorDirection) {
        delete main_window_ui_->content_widget->layout();
        QVBoxLayout* v_layout = new QVBoxLayout(main_window_);
        v_layout->addWidget(stage_list_view_control_);
        v_layout->addWidget(main_widget_control_);
        v_layout->setSpacing(0);
        v_layout->setMargin(0);
        QHBoxLayout* main_layout = new QHBoxLayout(main_window_ui_->content_widget);
        main_layout->addLayout(v_layout);
        main_layout->setSpacing(0);
        main_layout->setMargin(0);
        main_window_ui_->content_widget->setLayout(main_layout);
    }
    main_window_ui_->content_widget->show();
    stage_list_view_control_->ShowVideoTip(true);
}
void MainWindowLayout::PopUpBottomBar(bool popups) {
    if (popups) {
        if (share_menu_bar_ == nullptr) {
            share_menu_bar_ = new BottomBarController(NULL);
            connect(share_menu_bar_, &BottomBarController::SignalShowSetting, this, &MainWindowLayout::SlotShowSetting);
            connect(share_menu_bar_, &BottomBarController::SignalChatRoomClicked, this, &MainWindowLayout::SlotShowChatRoom);
        }
        share_menu_bar_->setWindowFlags(Qt::Window | Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint);
        share_menu_bar_->setWindowTitle(kAppName);
        share_menu_bar_->setAttribute(Qt::WA_TranslucentBackground);

        share_menu_bar_->SetShareScreenStyle(true);
        share_menu_bar_->MoveToTop(main_window_);
        share_menu_bar_->show();

        if (pop_widget_ == nullptr) {
            pop_widget_ = new PopStageListController(nullptr);
            pop_widget_->setWindowTitle(kAppName);
        }
        QLayout* l_y = new QVBoxLayout(pop_widget_);
        QWidget* pop_stage_widget = stage_list_view_control_->PopStageListController();
        QDesktopWidget* desk = QApplication::desktop();
        pop_widget_->setMaximumHeight(desk->screenGeometry(main_window_).height() - 10);
        connect(stage_list_view_control_, &StageListController::SignalPopStageSizeChanged, pop_widget_, &PopStageListController::SlotPopStageSizeChanged);
        l_y->setSpacing(0);
        l_y->setMargin(0);
        l_y->addWidget(pop_stage_widget);
        pop_widget_->AddLayout(l_y);
#ifdef __APPLE__
        pop_widget_->setWindowFlags(Qt::FramelessWindowHint | Qt::Window);
#else
        pop_widget_->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::Tool);
#endif
        pop_widget_->setFixedSize(pop_stage_widget->size().width() + 20, pop_stage_widget->size().height() + 60);
        QRect main_rect = desk->screenGeometry(main_window_);
        int pos_x = main_rect.width() - pop_widget_->width() - 10;
        int pos_y = main_rect.height() - (pop_stage_widget->size().height() + 60);
        pop_widget_->move(main_rect.x() + pos_x, (pos_y > 0 ? pos_y : 0) / 2);
        pop_widget_->show();
        pop_widget_->setAttribute(Qt::WA_Mapped);
        main_window_->hide();
        stage_list_view_control_->PopVideoTip(true);

        share_menu_bar_->ExcludeShareWindow();
    } else {
        main_window_->show();
        if (stage_list_view_control_ != nullptr) {
            stage_list_view_control_->InsertStageList();
            stage_list_view_control_->PopVideoTip(false);
        }
        if (pop_widget_ != nullptr) {
            pop_widget_->close();
            DELETE_OBJECT(pop_widget_);
        }
        if (share_menu_bar_ != nullptr) {
            PopUpChatRoom(false);
        }
        DELETE_OBJECT(share_menu_bar_);

        auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
        if (local_user == nullptr) {
            return;
        }
        emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*local_user);
        if (bottom_menu_bar_ != nullptr) {
            bottom_menu_bar_->SetShareScreenStyle(false);
        }
    }
}
void MainWindowLayout::PopUpChatRoom(bool popups) {
    if (popups) {
        QDesktopWidget* desktop = QApplication::desktop();
        chat_room_view_control_->setParent(nullptr);
        chat_room_view_control_->show();
        chat_room_view_control_->move((desktop->screenGeometry(chat_room_view_control_).width() - chat_room_view_control_->width()) / 2,
            (desktop->screenGeometry(chat_room_view_control_).height() - chat_room_view_control_->height()) / 2);
    } else {
        main_window_ui_->chat_widget->layout()->addWidget(chat_room_view_control_);
    }
    chat_room_view_control_->SetPopupMode(popups);
}

void MainWindowLayout::SlotShowChatRoom(bool show) {
    static bool need_resize = false;
    if (show) {
        // 当正在屏幕分享时，需要把聊天室弹出
        if (share_menu_bar_ != nullptr) {
            PopUpChatRoom(true);
            share_menu_bar_->SetChatRoomBtnStatus(show);
        } else {
            main_window_ui_->chat_widget->show();
            QDesktopWidget* desktop = QApplication::desktop();
            bool size_beyond_border = main_window_->width() + main_window_ui_->chat_widget->width() > desktop->screenGeometry(main_window_).width();
            need_resize = !(main_window_->isMaximized() || size_beyond_border);
            if (need_resize) {
                main_window_->resize(main_window_->width() + main_window_ui_->chat_widget->width(), main_window_->height());
                bool need_move = main_window_->geometry().right() > desktop->screenGeometry(main_window_).width();
                if (need_move) {
                    main_window_->move((desktop->screenGeometry(main_window_).width() - main_window_->width()) / 2,
                        (desktop->screenGeometry(main_window_).height() - main_window_->height()) / 2);
                }
            }
            bottom_menu_bar_->SetChatRoomBtnStatus(show);
        }
    } else {
        // 当正在屏幕分享时，需要把聊天室复原
        if (share_menu_bar_ != nullptr) {
            PopUpChatRoom(false);
            share_menu_bar_->SetChatRoomBtnStatus(show);
        } else {
            if (main_window_->isMaximized()) {
                main_window_ui_->chat_widget->hide();
                main_window_->showMaximized();
            } else {
                int new_width = main_window_->size().width() - main_window_ui_->chat_widget->size().width();
                main_window_ui_->chat_widget->hide();
                if (need_resize) {
                    main_window_->resize(new_width, main_window_->height());
                }
            }
            bottom_menu_bar_->SetChatRoomBtnStatus(show);
        }
    }
}
void MainWindowLayout::SlotShowVideoOnMainScreen(const std::string& user_id) {
    main_widget_control_->ShowUserVideo(user_id);
    auto window_handle = main_widget_control_->GetPlayWindow();
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    if (local_user->user_id == user_id) {
        TUIRoomCore::GetInstance()->StartCameraPreview(window_handle);
    } else {
        TUIRoomCore::GetInstance()->StartRemoteView(user_id, window_handle, TUIStreamType::kStreamTypeCamera);
    }
}

void MainWindowLayout::SlotOnRemoteUserScreenVideoAvailable(const QString& user_id, bool available) {
    if (available) {
        if (bottom_menu_bar_) {
            bottom_menu_bar_->SetCurrentScreenShower(user_id);
		}
        SlotStageListLayoutChanged(StageListDirection::kVerDirection);
        RemoteUserScreenOpen(user_id.toStdString());
    } else {
        if (bottom_menu_bar_) {
            bottom_menu_bar_->SetCurrentScreenShower("");
        }
        RemoteUserScreenClose(user_id.toStdString());
    }
}

void MainWindowLayout::RemoteUserScreenOpen(const std::string& user_id) {
    main_widget_control_->UserStartScreenShare(user_id);
}

void MainWindowLayout::RemoteUserScreenClose(const std::string& user_id) {
    main_widget_control_->UserStopScreenShare();
    TUIRoomCore::GetInstance()->StopRemoteView(user_id, TUIStreamType::kStreamTypeScreen);
}
void MainWindowLayout::ShowTransferRoomWindow() {
    if (transfer_room_window_ == nullptr) {
        transfer_room_window_ = new TransferRoomController(main_window_);
        connect(transfer_room_window_, &TransferRoomController::SignalCloseWindow, this, [=]() {
            transfer_room_window_->deleteLater();
            transfer_room_window_ = nullptr;
        });
    }
    transfer_room_window_->show();
    transfer_room_window_->raise();
}