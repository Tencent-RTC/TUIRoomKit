#include "MainWindow.h"
#include <QTimer>
#include <QDesktopWidget>
#include <QPainter>
#include <QBitmap>
#include <QDebug>
#include "MessageDispatcher/MessageDispatcher.h"
#include "DataStore.h"
#include "TXMessageBox.h"
#include "LoginViewController.h"
#include "ScreenCenter.h"
#include "StatusUpdateCenter.h"
#include "log.h"
#include "DataReport.h"

const int kSizeDecrease = 100;
MainWindow::MainWindow(tuikit::TUISpeechMode speech_mode, QWidget *parent)
    : speech_mode_(speech_mode)
    , QMainWindow(parent) {
    ui.setupUi(this);
#ifdef __APPLE__
    ui.top_widget->hide();
#else
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint);
#endif
    this->setWindowTitle(kAppName);
    qApp->installEventFilter(this);

    QSize main_size(1600, 900);
    QDesktopWidget* desktop = QApplication::desktop();
    if (desktop->availableGeometry().height() < 900)
        main_size.setHeight(desktop->availableGeometry().height() - 100);
    if (desktop->availableGeometry().width() < 1600)
        main_size.setWidth(desktop->availableGeometry().width() - 200);
    this->resize(main_size);

    this->setMaximumSize(QSize(QWIDGETSIZE_MAX, QWIDGETSIZE_MAX));
    this->setMinimumSize(QSize(1280, 768));
    this->move((desktop->availableGeometry().width() - this->width()) / 2, (desktop->availableGeometry().height() - this->height()) / 2);

    hide_menu_bar_timer_.setSingleShot(true);
    ui.chat_widget->hide();
    ui.content_widget->installEventFilter(this);

    connect(ui.btn_close, &QPushButton::clicked, this, &MainWindow::SlotClose);
    connect(ui.btn_min, &QPushButton::clicked, this, [&]() {
        this->showMinimized();
    });
    connect(ui.btn_max, &QPushButton::clicked, this, [&]() {
        if (this->isMaximized()) {
            this->showNormal();
        } else {
            this->showMaximized();
        }
    });

    if (TUIRoomCore::GetInstance()->GetDeviceManager() != nullptr)
        TUIRoomCore::GetInstance()->GetDeviceManager()->setDeviceObserver(&MessageDispatcher::Instance());

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnCreateRoom, this, &MainWindow::SlotOnCreateRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnEnterRoom, this, &MainWindow::SlotOnEnterRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnError, this, &MainWindow::SlotOnError);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnExitRoom, this, &MainWindow::SlotOnExitRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnAllUserMicrophoneDisableChanged, this, &MainWindow::SlotOnAllUserMicrophoneDisableChanged);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnAllUserCameraDisableChanged, this, &MainWindow::SlotOnAllUserCameraDisableChanged);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnCameraStateChanged, this, &MainWindow::SlotOnCameraStateChanged);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnMicrophoneStateChanged, this, &MainWindow::SlotOnMicrophoneStateChanged);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRequestOpenCameraByAdmin, this, &MainWindow::SlotOnRequestOpenCameraByAdmin);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRequestOpenMicrophoneByAdmin, this, &MainWindow::SlotOnRequestOpenMicrophoneByAdmin);
    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalCloseMainWindow, this, [=](TUIExitRoomType type) {
        type_exit_room_ = type;
        this->close();
    });

    LOAD_STYLE_SHEET(":/MainWindow/MainWindow.qss");
}

MainWindow::~MainWindow() {
    if (device_preview_ != nullptr) {
        device_preview_->close();
        DELETE_OBJECT(device_preview_);
    }

    is_default_close_camera_ = false;
    is_default_close_mic_ = false;
}

void MainWindow::mouseMoveEvent(QMouseEvent* event) {
    if (main_window_layout_ != nullptr)
        main_window_layout_->mouseMoveEvent(event);
    if (device_preview_ != nullptr) {
        device_preview_->MoveEvent(event);
    }
    QMainWindow::mouseMoveEvent(event);
}
void MainWindow::mousePressEvent(QMouseEvent* event) {
    if (main_window_layout_ != nullptr)
        main_window_layout_->mousePressEvent(event);
    QMainWindow::mousePressEvent(event);
}
void MainWindow::mouseReleaseEvent(QMouseEvent* event) {
    if (main_window_layout_ != nullptr)
        main_window_layout_->mouseReleaseEvent(event);
    QMainWindow::mouseReleaseEvent(event);
}
void MainWindow::mouseDoubleClickEvent(QMouseEvent *event) {
    if (main_window_layout_ != nullptr) {
        main_window_layout_->mouseDoubleClickEvent(event);
    }
    QMainWindow::mouseDoubleClickEvent(event);
}
void MainWindow::closeEvent(QCloseEvent* event) {
    CloseMainWindow();
    emit SignalShowLoginWind(type_exit_room_);
}
void MainWindow::showEvent(QShowEvent* event) {
    this->setAttribute(Qt::WA_Mapped);
    if (main_window_layout_ != nullptr)
        main_window_layout_->showEvent(event);

    return QMainWindow::showEvent(event);
}
void MainWindow::hideEvent(QHideEvent* event) {
    return QMainWindow::hideEvent(event);
}
void MainWindow::resizeEvent(QResizeEvent *event) {
    if (main_window_layout_ != nullptr)
        main_window_layout_->resizeEvent(event);

    ui.btn_max->setChecked(this->isMaximized());
    return QMainWindow::resizeEvent(event);
}
bool MainWindow::eventFilter(QObject *obj, QEvent *event) {
    if (main_window_layout_ != nullptr) {
        if (event->type() == QEvent::Enter) {
            if (obj != this && main_window_layout_ != nullptr) {
                main_window_layout_->ResetArrowCursor();
            }
            BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
            if (enter_room_success_) {
                if (bottom_menu_bar != nullptr) {
                    bottom_menu_bar->show();
                }
            }
            if ((bottom_menu_bar != nullptr && obj == bottom_menu_bar)) {
                if (hide_menu_bar_timer_.isActive())
                    hide_menu_bar_timer_.stop();
            }
        } else if (event->type() == QEvent::Leave) {
            if (obj == this) {
                if (hide_menu_bar_timer_.isActive()) {
                    hide_menu_bar_timer_.stop();
                }
                BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
                if (bottom_menu_bar != nullptr) {
                    bottom_menu_bar->hide();
                }
            }
        } else if (event->type() == QEvent::MouseMove) {
            BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
            if (enter_room_success_ && bottom_menu_bar && !bottom_menu_bar->underMouse()) {
                bottom_menu_bar->show();
                if (hide_menu_bar_timer_.isActive())
                    hide_menu_bar_timer_.stop();
                hide_menu_bar_timer_.start(3000);
            }
        } else if (obj == this && event->type() == QEvent::ScreenChangeInternal) {
            AdaptHighDPISize();
        } else if (obj == ui.content_widget && event->type() == QEvent::Resize) {
            if (stage_list_view_control_ != nullptr) {
                stage_list_view_control_->ReSizeStage();
            }
        }
    }
    return QMainWindow::eventFilter(obj, event);
}

void MainWindow::AdaptHighDPISize() {
    QDesktopWidget* desktop = QApplication::desktop();
    int screen_index = desktop->screenNumber(this);
    ScreenCenter::Instance()->ChangeCurreetScreen(screen_index);
    QSize screen_size = ScreenCenter::Instance()->GetCurrentScreenSize();
    QSize change_size = this->size();
    if (change_size.width() > screen_size.width()) {
        change_size.setWidth(screen_size.width() - kSizeDecrease);
    }
    if (change_size.height() > screen_size.height()) {
        change_size.setHeight(screen_size.height() - kSizeDecrease);
    }
    resize(change_size);
}

void MainWindow::InitShow(bool show_preview_wnd) {
    if (main_window_layout_ == nullptr) {
        main_window_layout_ = new MainWindowLayout(this);
    }
    main_window_layout_->SetMainWindowUi(&ui);

    if (show_preview_wnd) {
        if (device_preview_ == nullptr) {
            device_preview_ = new PresetDeviceController(this);
            connect(device_preview_, SIGNAL(SignalEndDetection()), this, SLOT(SlotEndDetection()));
        }
        room_id_ = login_view_->GetRoomID().toStdString();
        ui.top_menu_bar->SetRoomID(room_id_);
        device_preview_->show();
        device_preview_->InitUi();
    }

}
void MainWindow::SlotEndDetection() {
    if (login_view_ != nullptr) {
        TUIRoomCore::GetInstance()->CreateRoom(room_id_,tuikit::TUISpeechMode::kFreeToSpeak);
    }
}

void MainWindow::SlotOnCreateRoom(int code, const QString& message) {
    TUIRoomCore::GetInstance()->EnterRoom(room_id_);
}

void MainWindow::SlotOnEnterRoom(int code, const QString& message) {
    this->InitUi();
    if (code != 0) {
        LINFO("MainWindow::SlotOnEnterRoom Error: %d %s", code, message.toStdString().c_str());
        TXMessageBox::Instance().AddLineTextMessage(tr("Enter room failed"), tr("Enter room failed"));
        if (device_preview_ != nullptr) {
            device_preview_->ResetStart();
        }
        return;
    }

    if (main_window_layout_ == nullptr)
        return;
    DataReport::Instance()->OperateReport(ReportType::kEnterRoom, 0);
    if (device_preview_ != nullptr) {
        device_preview_->OnCloseWnd();
        DELETE_OBJECT(device_preview_);
    }

    BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
    if (bottom_menu_bar) {
        bottom_menu_bar->show();
    }
    enter_room_success_ = true;

    is_default_close_camera_ = DataStore::Instance()->IsDefaultCloseCamera();
    is_default_close_mic_ = DataStore::Instance()->IsDefaultCloseMic();

    ShowStageList();
    StageUp();

    TUIVideoQosPreference preference = DataStore::Instance()->GetQosPreference();
    DataStore::Instance()->SetQosPreference(preference);
    TUIRoomCore::GetInstance()->SetVideoQosPreference(preference);

    bool is_mirror = DataStore::Instance()->GetMirror();
    TUIRoomCore::GetInstance()->SetVideoMirror(is_mirror);
}

void MainWindow::ShowUserList() {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    auto room_user_list = TUIRoomCore::GetInstance()->GetRoomUsers();
    MemberListAddMember(*local_user);
    for (auto iter = room_user_list.begin(); iter != room_user_list.end(); ++iter) {
        if (iter->user_id != local_user->user_id) {
            MemberListAddMember(*iter);
        }
    }
}

void MainWindow::SetLoginView(LoginViewController* login_view) {
    login_view_ = login_view;
}

void MainWindow::InitUi() {
    if (main_window_layout_ == nullptr)
        return;

    main_window_layout_->InitLayout();

    stage_list_view_control_ = main_window_layout_->GetStageListController();
    top_menu_bar_ = main_window_layout_->GetTopBarController();
    main_widget_control_ = main_window_layout_->GetMainWidgetController();
    
    BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
    if (bottom_menu_bar) {
        connect(bottom_menu_bar, &BottomBarController::SignalStartScreen, this, &MainWindow::PopupBottomBar, Qt::QueuedConnection);
        connect(bottom_menu_bar, &BottomBarController::SignalShowMemberList, this, [=]() {
            if (member_list_view_control_ != nullptr) {
                this->ShowUserList();
                member_list_view_control_->show();
                member_list_view_control_->raise();
                DataReport::Instance()->OperateReport(ReportType::kOpenMemberlist);
            }
        });
        connect(bottom_menu_bar, &BottomBarController::SignalCameraClicked, this, &MainWindow::SlotBottomMenuMuteCamera);
        connect(bottom_menu_bar, &BottomBarController::SignalAudioClicked, this, &MainWindow::SlotBottomMenuMuteMicrophone);
        connect(bottom_menu_bar, &BottomBarController::SignalLeaveRoom, this, &MainWindow::SlotClose);
        connect(bottom_menu_bar, &BottomBarController::SignalChatRoomClicked, this, &MainWindow::SlotShowChatRoom);
    }

    connect(&hide_menu_bar_timer_, &QTimer::timeout, this, &MainWindow::SlotOnHideMenuBarTimeout);

    if (member_list_view_control_ == nullptr) {
        auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
        if (local_user == nullptr) {
            return;
        }
        member_list_view_control_ = new MemberListViewController(*local_user, this);
        TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)member_list_view_control_->winId());
    }
    resizeEvent(nullptr);
}

void MainWindow::SlotShowChatRoom(bool show) {
    if (main_window_layout_ != nullptr)
        main_window_layout_->SlotShowChatRoom(show);
    resizeEvent(nullptr);
}

void MainWindow::SlotClose() {
    LINFO("MainWindow::SlotClose , enter_room_success_ : %d", enter_room_success_);
    if (enter_room_success_) {
        auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
        if (local_user == nullptr) {
            LINFO("Error: MainWindow::SlotClose, local_user is nullptr");
            return;
        }
        if (local_user->role == tuikit::TUIRole::kRoomOwner) {
            auto room_members = TUIRoomCore::GetInstance()->GetRoomUsers();
            auto new_master = std::find_if(room_members.begin(), room_members.end(), [=](const TUIUserInfo& user) {
                return user.user_id != local_user->user_id;
                });
            if (new_master != room_members.end()) {
                TXMessageBox::DialogInstance().ShowMultiButtonDialog(kCancel | kDestoryRoom | kLeaveRoom, \
                    tr("Are you sure to leave the room ?"));
            } else {
                TXMessageBox::DialogInstance().ShowMultiButtonDialog(kCancel | kDestoryRoom, \
                    tr("Are you sure to leave the room ?"));
            }
        } else {
            TXMessageBox::DialogInstance().ShowMultiButtonDialog(kCancel | kLeaveRoom, \
                tr("Are you sure to leave the room ?"));
        }
        connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalDestoryRoom, this, [=]() {
            this->close();
        });
        connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalLeaveRoom, this, [=]() {
            if (local_user->role == tuikit::TUIRole::kRoomOwner && main_window_layout_ != nullptr) {
                // 如果需要指定将房间转让给某用户，使用以下方法
                // You can transfer the room to the specified user as follows:
                // main_window_layout_->ShowTransferRoomWindow();
                // 列表中寻找一个默认的用户进行转让
                // Find the default user in the list for transfer
                main_window_layout_->TransferRoomToOther();
                type_exit_room_ = TUIExitRoomType::kTransferRoom;
                this->close();
            } else {
                this->close();
            }
        });
    } else {
        this->close();
    }
}
void MainWindow::PopupBottomBar(bool checked) {
  LINFO("PopupBottomBar,checked:%d", checked);
    if (main_window_layout_ == nullptr)
        return;

    main_window_layout_->PopUpBottomBar(checked);
    BottomBarController* share_menu_bar = main_window_layout_->GetShareMenuBar();
    pop_widget_ = main_window_layout_->GetPopStageListController();
    if (stage_list_view_control_ != nullptr && pop_widget_ != nullptr) {
        connect(stage_list_view_control_, &StageListController::SignalPopStageSizeChanged, pop_widget_, &PopStageListController::SlotPopStageSizeChanged);
    }

    if (share_menu_bar != nullptr) {
        connect(share_menu_bar, &BottomBarController::SignalStartScreen, this, &MainWindow::PopupBottomBar, Qt::QueuedConnection);
        connect(share_menu_bar, &BottomBarController::SignalShowMemberList, this, [=]() {
            if (member_list_view_control_ != nullptr) {
                member_list_view_control_->show();
                member_list_view_control_->raise();
            }
        });
        connect(share_menu_bar, &BottomBarController::SignalCameraClicked, this, &MainWindow::SlotBottomMenuMuteCamera);
        connect(share_menu_bar, &BottomBarController::SignalAudioClicked, this, &MainWindow::SlotBottomMenuMuteMicrophone);
    }
}

void MainWindow::CloseMainWindow() {
    if (device_preview_ != nullptr) {
        device_preview_->OnCloseWnd();
        device_preview_->close();
        DELETE_OBJECT(device_preview_);
    }
    hide_menu_bar_timer_.stop();
    PopupBottomBar(false);
    StopLocalCamera();
    StopLocalMicrophone();
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    LINFO("CloseMainWindow , role : %d, exit_room_type : %d", local_user->role, type_exit_room_);
    switch (type_exit_room_) {
    case TUIExitRoomType::kNormal:
        if (local_user->role == tuikit::TUIRole::kRoomOwner) {
            TUIRoomCore::GetInstance()->DestroyRoom();
        } else if (enter_room_success_) {
            TUIRoomCore::GetInstance()->LeaveRoom();
        }
        break;
    case TUIExitRoomType::kKickOff: {
        //TUIRoomCore::GetInstance()->LeaveRoom();
    }
        break;
    default:
        break;
    }
    DELETE_OBJECT(main_window_layout_);
}

void MainWindow::ShowStageList() {
  auto room_user_list = TUIRoomCore::GetInstance()->GetRoomUsers();
  for (auto iter = room_user_list.begin(); iter != room_user_list.end();
       ++iter) {
    StageAddMember(*iter);
  }
}

void MainWindow::StageAddMember(const TUIUserInfo& user_info) {
    LINFO("StageAddMember, user_id :%s, user_name:%s",user_info.user_id.c_str(), user_info.user_name.c_str());
    if (stage_list_view_control_ != nullptr) {
        stage_list_view_control_->InsertUser(user_info, false);
    }
}
void MainWindow::StageRemoveMember(const std::string& user_id) {
    if (stage_list_view_control_ != nullptr) {
        stage_list_view_control_->RemoveUser(user_id, false);
    }
}

void MainWindow::MemberListAddMember(const TUIUserInfo& user_info) {
    LINFO("MemberListAddMember, user_id :%s, user_name:%s", user_info.user_id.c_str(), user_info.user_name.c_str());
    if (member_list_view_control_ != nullptr) {
        member_list_view_control_->InsertUser(user_info);
    }
}

void MainWindow::StartLocalCamera() {
    LINFO("StartLocalCamera");
    DataReport::Instance()->OperateReport(ReportType::kOpenCamera);
    if (stage_list_view_control_ == nullptr)
        return;
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }

    if (main_window_layout_->GetMainWidgetController()->GetUserId()\
        == DataStore::Instance()->GetCurrentUserInfo().user_id) {
        TUIRoomCore::GetInstance()->StartCameraPreview(main_window_layout_->GetMainWidgetController()->GetPlayWindow());
    } else {
        liteav::TXView play_window = stage_list_view_control_->GetPlayWindow(local_user->user_id);
        TUIRoomCore::GetInstance()->StartCameraPreview(play_window);
    }
}

void MainWindow::StopLocalCamera() {
    LINFO("StopLocalCamera");
    TUIRoomCore::GetInstance()->StopCameraPreview();
}

void MainWindow::StartLocalMicrophone() {
    LINFO("StartLocalMicrophone");
    DataReport::Instance()->OperateReport(ReportType::kOpenMicrophone);
    TUIRoomCore::GetInstance()->StartLocalAudio(DataStore::Instance()->GetAudioQuality());
}

void MainWindow::StopLocalMicrophone() {
    LINFO("StopLocalMicrophone");
    TUIRoomCore::GetInstance()->StopLocalAudio();
}
void MainWindow::SlotBottomMenuMuteCamera(bool) {
    LINFO("BottomMenuMuteCam");
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
    bool mute = local_user->has_video_stream && local_user->has_subscribed_video_stream;
    if (mute) {
        StopLocalCamera();
    } else {
        if (room_info.is_all_camera_muted && local_user->role != tuikit::TUIRole::kRoomOwner) {
            // 主持人已设置全员禁视频，您暂时无法打开视频。
            // The host has disabled the video of all members, so you cannot enable the video
            TXMessageBox::Instance().AddLineTextMessage(\
                tr("The master has set video ban for all staff, you cannot open the video temporarily."));
            auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(
                DataStore::Instance()->GetCurrentUserInfo().user_id);
            if (local_user == nullptr) {
              return;
            }
            emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*local_user);
            return;
        }
        StartLocalCamera();
    }
}

void MainWindow::SlotBottomMenuMuteMicrophone(bool) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
    bool mute = local_user->has_audio_stream && local_user->has_subscribed_audio_stream;
    if (mute) {
        StopLocalMicrophone();
    } else {
        if (room_info.is_all_microphone_muted && local_user->role != tuikit::TUIRole::kRoomOwner) {
            // 主持人已设置全员禁麦，您暂时无法打开麦克风。
            // The host has disabled the mic of all members, so you cannot enable the microphone
            TXMessageBox::Instance().AddLineTextMessage(\
                tr("The master has set audio ban for all staff, you cannot open the audio temporarily."));
            auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(
                DataStore::Instance()->GetCurrentUserInfo().user_id);
            if (local_user == nullptr) {
              return;
            }
            emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*local_user);
            return;
        }
        StartLocalMicrophone();
    }
}
void MainWindow::StageUp() {
    LINFO("Start StageUp");
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }

    TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
    if (!room_info.is_all_camera_muted) {
      if (!is_default_close_camera_) {
        StartLocalCamera();
      } else {
        StopLocalCamera();
      }
    }
    if (!room_info.is_all_microphone_muted) {
      if (!is_default_close_mic_) {
        StartLocalMicrophone();
      } else {
        StopLocalMicrophone();
      }
    }

    if (pop_widget_ != nullptr) {
        QWidget* wid = stage_list_view_control_->PopStageListController();
        if (wid != nullptr) {
            QDesktopWidget* desk = QApplication::desktop();
            pop_widget_->setFixedSize(wid->size().width() + 20, wid->size().height() + 60);

            int pos_x = desk->screenGeometry(this).width() - (wid->size().width() + 20) - 10;
            int pos_y = desk->availableGeometry(this).height() - (wid->size().height() + 60);
            pop_widget_->move(pos_x, (pos_y > 0 ? pos_y : 0) / 2);
        }
    }
}

void MainWindow::StageDown() {
    LINFO("StageDown");
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    TUIRoomCore::GetInstance()->ExitSpeechState();
    StageRemoveMember(local_user->user_id);
}

void MainWindow::DealStartCameraError() {
    LINFO("DealStartCameraError");
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    StopLocalCamera();
}

void MainWindow::DealStartMicError() {
    LINFO("DealStartMicError");
    StopLocalMicrophone();
}

void MainWindow::SlotOnError(int code, const QString& message) {
    LINFO("SlotOnError error: %d,message : %s", code, message.toStdString().c_str());
    TUIRoomError error = TUIRoomError(code);
    switch (error) {
    case TUIRoomError::kErrorSendChatMessageFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Send the messgae failed"));
        break;
    case TUIRoomError::kErrorCreateRoomFailed:
        TUIRoomCore::GetInstance()->EnterRoom(room_id_);
        break;
    case TUIRoomError::kErrorStartCameraFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Failed to open the camera"));
        DealStartCameraError();
        break;
    case TUIRoomError::kErrorStartMicrophoneFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Failed to turn on the microphone"));
        DealStartMicError();
        break;
    case TUIRoomError::kErrorAnotherUserIsPushingScreenStream:
        TXMessageBox::Instance().AddLineTextMessage(tr("Other users are sharing screens"));
        if (!this->isVisible()) {
            this->PopupBottomBar(false);
        }
        break;
    case TUIRoomError::kErrorMuteChatRoomFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Mute chat room failed"));
        break;
    case TUIRoomError::kErrorChangeSpeechModeFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Change speech mode failed"));
        break;
    case TUIRoomError::kErrorEnterRoomFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Enter room failed"), tr("Enter room failed"));
        DataReport::Instance()->OperateReport(ReportType::kEnterRoom, code);
        if (device_preview_ != nullptr) {
            device_preview_->ResetStart();
        }
        break;
    case TUIRoomError::kErrorMicrophoneNotAuthorized:
        TXMessageBox::Instance().AddLineTextMessage(tr("This application doesn't have microphone authorization"),\
            tr("Open microphone failed"));
        break;
    default:
        break;
    }
}

void MainWindow::SlotOnExitRoom(TUIExitRoomType code, const QString& message) {
    type_exit_room_ = code;
    close();
}

void MainWindow::SlotOnAllUserMicrophoneDisableChanged(const QString& room_id,
                                                       bool is_disable) {
  if (is_disable) {
    TXMessageBox::Instance().AddLineTextMessage(tr("the room microphone is disable"));
  } else {
    TXMessageBox::Instance().AddLineTextMessage(tr("the room microphone is enable"));
  }
}

void MainWindow::SlotOnAllUserCameraDisableChanged(const QString& room_id, bool is_disable) {
  if (is_disable) {
    TXMessageBox::Instance().AddLineTextMessage(tr("the room camera is disable"));
  } else {
    TXMessageBox::Instance().AddLineTextMessage(tr("the room camera is enable"));
  }
}

void MainWindow::SlotOnCameraStateChanged(bool has_video, tuikit::TUIChangeReason reason) {
  if (!has_video && reason == tuikit::TUIChangeReason::kChangedByAdmin) {
    TXMessageBox::Instance().AddLineTextMessage(tr("the camera is disable by admin"));
  }
  auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(
      DataStore::Instance()->GetCurrentUserInfo().user_id);
  if (local_user == nullptr) {
    return;
  }
  emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*local_user);
}

void MainWindow::SlotOnMicrophoneStateChanged(bool has_audio, tuikit::TUIChangeReason reason) {
  if (!has_audio && reason == tuikit::TUIChangeReason::kChangedByAdmin) {
    TXMessageBox::Instance().AddLineTextMessage(tr("the microphone is disable by admin"));
  }
  auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(
      DataStore::Instance()->GetCurrentUserInfo().user_id);
  if (local_user == nullptr) {
    return;
  }
  emit StatusUpdateCenter::Instance().SignalUpdateUserInfo(*local_user);
}

void MainWindow::SlotOnRequestOpenCameraByAdmin(const QString& request_id) {
  TXMessageBox::DialogInstance().ShowMultiButtonDialog(
      kCancel | kOk,
      tr("Admin requests to turn on your camera, are you agree ?"));

  auto callback = [=](RequestCallbackType type,
                      const std::string& error_message) {
    LINFO("MuteUserCamera result type : %d,error_message :%s", (int)type,
          error_message.c_str());
  };
  connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalOk, this,
          [=]() {
            TUIRoomCore::GetInstance()->ReplySpeechInvitation(
                request_id.toStdString(), true, callback);
          });
  connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalCancel, this,
          [=]() {
            TUIRoomCore::GetInstance()->ReplySpeechInvitation(
                request_id.toStdString(), false, callback);
          });
}

void MainWindow::SlotOnRequestOpenMicrophoneByAdmin(const QString& request_id) {
  TXMessageBox::DialogInstance().ShowMultiButtonDialog(
      kCancel | kOk,
      tr("Admin requests to turn on your microphone, are you agree ?"));

  auto callback = [=](RequestCallbackType type,
                      const std::string& error_message) {
    LINFO("MuteUserCamera result type : %d,error_message :%s", (int)type,
          error_message.c_str());
  };
  connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalOk, this,
          [=]() {
            TUIRoomCore::GetInstance()->ReplySpeechInvitation(
                request_id.toStdString(), true, callback);
          });
  connect(&TXMessageBox::DialogInstance(), &TXMessageBox::SignalCancel, this,
          [=]() {
            TUIRoomCore::GetInstance()->ReplySpeechInvitation(
                request_id.toStdString(), false, callback);
          });
}

void MainWindow::SlotOnHideMenuBarTimeout() {
    if (main_window_layout_ == nullptr)
        return;

    BottomBarController* bottom_menu_bar = main_window_layout_->GetBottomBarController();
    if (bottom_menu_bar != nullptr) {
        bottom_menu_bar->hide();
    }
}
