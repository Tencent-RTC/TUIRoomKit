#include "BottomBarController.h"
#include "CommonDef.h"
#include <QDesktopWidget>
#include <QBitmap>
#include <QPainter>
#include <QStyleOption>
#include "TUIRoomCore.h"
#include "DataStore.h"
#include "DataReport.h"
#include "StatusUpdateCenter.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "log.h"

#ifdef __APPLE__
#include <libproc.h>

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <Cocoa/Cocoa.h>
#endif

BottomBarController::BottomBarController(QWidget* parent)
    : QWidget(parent)
    , view_dragger_(this)
{
    ui.setupUi(this);
    this->setMouseTracking(true);

    LOAD_STYLE_SHEET(":/MainWindow/BottomBarController.qss");
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    UpdateStatus(*local_user);
    role_ = local_user->role;

    ui.horizontalLayout_2->setContentsMargins(0, 5, 0, 10);

    connect(ui.widget_camera_button, SIGNAL(clicked(bool)), this, SLOT(OnCameraClicked(bool)));
    connect(ui.widget_audio_button, SIGNAL(clicked(bool)), this, SLOT(OnAudioClicked(bool)));
    connect(ui.widget_share_button, SIGNAL(clicked(bool)), this, SLOT(OnShareClicked(bool)));
    connect(ui.widget_camera_button, SIGNAL(SignalSetClicked(bool)), this, SLOT(OnCameraSetClicked(bool)));
    connect(ui.widget_audio_button, SIGNAL(SignalSetClicked(bool)), this, SLOT(OnAudioSetClicked(bool)));
    connect(ui.widget_share_button, SIGNAL(SignalSetClicked(bool)), this, SLOT(OnScreenShareSetClicked(bool)));
    connect(ui.widget_member_button, SIGNAL(clicked(bool)), this, SLOT(OnMemberClicked(bool)));
    connect(ui.widget_chatroom_button, SIGNAL(clicked(bool)), this, SLOT(OnChatRoomClicked(bool)));
    connect(ui.btn_end, SIGNAL(clicked()), this, SLOT(OnBtnEndClicked()));

    hide_bar_timer_.setSingleShot(true);
    connect(&hide_bar_timer_, SIGNAL(timeout()), this, SLOT(OnHideBarTimeOut()));

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnScreenCaptureStopped, this, &BottomBarController::SlotScreenCaptureStopped);

    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalUpdateUserInfo, this, &BottomBarController::SlotUpdateUserInfo);

    QString sheet = "QLabel{color:white; background-color:red; border-radius:10;}";
    label_member_num_ = new QLabel(ui.widget_member);
    label_member_num_->setStyleSheet(sheet);
    label_member_num_->resize(20, 20);
    label_member_num_->setAlignment(Qt::AlignCenter);
    label_member_num_->hide();

    ui.widget_bg->setProperty("screen_sharing", false);
    ui.widget_bg->setStyle(QApplication::style());

    InitUI();
}
BottomBarController::~BottomBarController() {
    hide_bar_timer_.stop();
    if (screen_share_window_ != nullptr) {
        screen_share_window_->close();
        delete screen_share_window_;
        screen_share_window_ = nullptr;
    }
    ClearCameraMenu();
    ClearAudioMenu();
    if (pAction_share_screen_ != NULL) {
        delete pAction_share_screen_;
        pAction_share_screen_ = NULL;
    }
    if (pMenu_share_) {
        if (TUIRoomCore::GetInstance()->GetScreenShareManager() != nullptr) {
            TUIRoomCore::GetInstance()->GetScreenShareManager()->RemoveExcludedShareWindow((void*)pMenu_share_->winId());
        }
        pMenu_share_->clear();
        delete pMenu_share_;
        pMenu_share_ = NULL;
    }
    if (share_top_widget_ != nullptr) {
        if (TUIRoomCore::GetInstance()->GetScreenShareManager() != nullptr) {
            TUIRoomCore::GetInstance()->GetScreenShareManager()->RemoveExcludedShareWindow((void*)share_top_widget_->winId());
        }
        delete share_top_widget_;
        share_top_widget_ = nullptr;
    }
    if (label_member_num_ != nullptr) {
        delete label_member_num_;
        label_member_num_ = nullptr;
    }
}
void BottomBarController::InitUI() {
    ui.widget_camera_button->SetText(tr("Camera"));
    ui.widget_camera_button->SetButtonImage(":/BottomBarController/BottomBarController/camera.png", \
        ":/BottomBarController/BottomBarController/camera_hover.png", ":/BottomBarController/BottomBarController/camera_off.png");
    ui.widget_camera_button->SetButtonTextColor("white", "#2F79FF", "white");
    ui.widget_camera_button->SetOperateMenuVisible(true);

    ui.widget_audio_button->SetText(tr("Audio"));
    ui.widget_audio_button->SetButtonImage(":/BottomBarController/BottomBarController/mic.png", \
        ":/BottomBarController/BottomBarController/mic_hover.png", ":/BottomBarController/BottomBarController/mic_off.png");
    ui.widget_audio_button->SetButtonTextColor("white", "#2F79FF", "white");
    ui.widget_audio_button->SetOperateMenuVisible(true);

    ui.widget_share_button->SetText(tr("Share"));
    ui.widget_share_button->SetButtonImage(":/BottomBarController/BottomBarController/screen_share.png", \
        ":/BottomBarController/BottomBarController/screen_share_hover.png", ":/BottomBarController/BottomBarController/screen_share_hover.png");
    ui.widget_share_button->SetButtonTextColor("white", "#2F79FF", "#2F79FF");
    ui.widget_share_button->SetOperateMenuVisible(true);

    ui.widget_member_button->SetText(tr("Member"));
    ui.widget_member_button->SetButtonImage(":/BottomBarController/BottomBarController/member.png", \
        ":/BottomBarController/BottomBarController/member_hover.png");

    ui.widget_chatroom_button->SetText(tr("ChatRoom"));
    ui.widget_chatroom_button->SetButtonImage(":/BottomBarController/BottomBarController/chat.png", \
        ":/BottomBarController/BottomBarController/chat_hover.png", ":/BottomBarController/BottomBarController/chat_hover.png");
    ui.widget_share_button->SetButtonTextColor("white", "#2F79FF", "#2F79FF");
}

void BottomBarController::IncreaseHandsupNum() {
    if (label_member_num_ != nullptr) {
        int num = label_member_num_->text().isEmpty() ? 0 : label_member_num_->text().toInt();

        label_member_num_->move(ui.widget_member->width() - label_member_num_->width() - 5, 0);
        label_member_num_->show();
        label_member_num_->raise();
        label_member_num_->setText(QString::number(num + 1));
    }
}
void BottomBarController::SlotUpdateUserInfo(const TUIUserInfo& info) {
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    if (info.user_id == local_user->user_id) {
        this->UpdateStatus(info);
    }
}
void BottomBarController::UpdateStatus(const TUIUserInfo& info) {
    SetHasVideo(info.has_video_stream);
    SetHasAudio(info.has_audio_stream);
    SetEnableScreenShare(true);
}
void BottomBarController::InitCameraDeviceItem() {
    liteav::ITRTCDeviceInfo* activeCam = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeCamera);
    liteav::ITXDeviceCollection* camera_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeCamera);
    if (camera_list == nullptr) {
        return;
    }

    for (int i = 0; i < camera_list->getCount(); ++i) {
        QCheckBox* pCkbox = new QCheckBox(camera_list->getDeviceName(i));
        pCkbox->setFixedHeight(40);
        camera_btn_group_.addButton(pCkbox);
        connect(pCkbox, SIGNAL(clicked(bool)), this, SLOT(OnCameraMenuTriggered(bool)));
        const char* devicePID = camera_list->getDevicePID(i);
        if (std::string(activeCam->getDevicePID()) == std::string(devicePID))
            pCkbox->setChecked(true);
        map_menu_ckbox_[pCkbox] = devicePID;
        QWidgetAction* pActionCamera = new QWidgetAction(this);
        pActionCamera->setDefaultWidget(pCkbox);
        pAction_camera_list_.push_back(pActionCamera);
    }
    activeCam->release();

    if (!pAction_camera_select_) {
        pAction_camera_select_ = new QWidgetAction(this);
        QLabel* pLabelCameraSelect = new QLabel(tr("Camera Select"));
        pLabelCameraSelect->setFixedHeight(20);
        pAction_camera_select_->setDefaultWidget(pLabelCameraSelect);
        pLabelCameraSelect->setObjectName("label_select");
    }
    if (!pAction_camera_set_) {
        pAction_camera_set_ = new QAction(tr("camera setting"));
        connect(pAction_camera_set_, SIGNAL(triggered(bool)), this, SLOT(OnCameraMenuTriggered(bool)));
    }
    if (!pAction_beauty_set_) {
        pAction_beauty_set_ = new QAction(tr("beauty setting"));
        connect(pAction_beauty_set_, SIGNAL(triggered(bool)), this, SLOT(OnCameraMenuTriggered(bool)));
    }

    if (pMenu_camera_ == NULL) {
        pMenu_camera_ = new QMenu(this);
        pMenu_camera_->setWindowFlag(Qt::FramelessWindowHint);
        pMenu_camera_->setAttribute(Qt::WA_TranslucentBackground);
        TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)pMenu_camera_->winId());
    }
    pMenu_camera_->addAction(pAction_camera_select_);
    for (auto& camera : pAction_camera_list_) {
        pMenu_camera_->addAction(camera);
    }
    pMenu_camera_->addSeparator();
    pMenu_camera_->addAction(pAction_camera_set_);
    pMenu_camera_->addAction(pAction_beauty_set_);
}
void BottomBarController::ClearCameraMenu() {
    if (pAction_camera_select_ != NULL) {
        delete pAction_camera_select_;
        pAction_camera_select_ = NULL;
    }
    if (pAction_camera_set_ != NULL) {
        delete pAction_camera_set_;
        pAction_camera_set_ = NULL;
    }
    if (pAction_beauty_set_ != NULL) {
        delete pAction_beauty_set_;
        pAction_beauty_set_ = NULL;
    }
    for (auto& item_camera : pAction_camera_list_) {
        delete item_camera;
    }
    pAction_camera_list_.clear();
    map_menu_ckbox_.clear();

    if (pMenu_camera_ != NULL) {
        if (TUIRoomCore::GetInstance()->GetScreenShareManager() != nullptr) {
            TUIRoomCore::GetInstance()->GetScreenShareManager()->RemoveExcludedShareWindow((void*)pMenu_camera_->winId());
        }
        pMenu_camera_->clear();
        delete pMenu_camera_;
        pMenu_camera_ = NULL;
    }
}
void BottomBarController::InitAudioDeviceItem() {
    liteav::ITRTCDeviceInfo* activeSpeaker = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeSpeaker);
    liteav::ITXDeviceCollection* speaker_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeSpeaker);
    if (speaker_list != nullptr) {
        for (int i = 0; i < speaker_list->getCount(); ++i) {
            QCheckBox* pCkbox = new QCheckBox(speaker_list->getDeviceName(i));
            pCkbox->setFixedHeight(40);
            speaker_btn_group_.addButton(pCkbox);
            connect(pCkbox, SIGNAL(clicked(bool)), this, SLOT(OnSpeakerSetTriggered(bool)));
            const char* devicePID = speaker_list->getDevicePID(i);
            map_menu_ckbox_[pCkbox] = devicePID;
            QWidgetAction* pActionSpeaker = new QWidgetAction(this);
            pActionSpeaker->setDefaultWidget(pCkbox);
            pAction_speaker_list_.push_back(pActionSpeaker);
            if (std::string(activeSpeaker->getDevicePID()) == std::string(devicePID)) {
                pCkbox->setChecked(true);
            }
        }
    }
    if (!pAction_speaker_select_) {
        pAction_speaker_select_ = new QWidgetAction(this);
        QLabel* pLabelSpeakerSelect = new QLabel(tr("Speaker Select"));
        pLabelSpeakerSelect->setFixedHeight(20);
        pAction_speaker_select_->setDefaultWidget(pLabelSpeakerSelect);
        pLabelSpeakerSelect->setObjectName("label_select");
    }
    activeSpeaker->release();

    liteav::ITRTCDeviceInfo* activeMic = TUIRoomCore::GetInstance()->GetDeviceManager()->getCurrentDevice(liteav::TRTCDeviceTypeMic);
    liteav::ITXDeviceCollection* microphone_list = TUIRoomCore::GetInstance()->GetDeviceManager()->getDevicesList(liteav::TXMediaDeviceTypeMic);
    if (microphone_list != nullptr) {
        for (int i = 0; i < microphone_list->getCount(); ++i) {
            QCheckBox* pCkbox = new QCheckBox(microphone_list->getDeviceName(i));
            microphone_btn_group_.addButton(pCkbox);
            connect(pCkbox, SIGNAL(clicked(bool)), this, SLOT(OnMicrophoneSetTriggered(bool)));
            const char* devicePID = microphone_list->getDevicePID(i);
            map_menu_ckbox_[pCkbox] = devicePID;
            QWidgetAction* pActionMicrophone = new QWidgetAction(this);
            pCkbox->setFixedWidth(300);
            pCkbox->setFixedHeight(40);
            pActionMicrophone->setDefaultWidget(pCkbox);
            pAction_microphone_list_.push_back(pActionMicrophone);
            if (std::string(activeMic->getDevicePID()) == std::string(devicePID)) {
                pCkbox->setChecked(true);
            }
        }
    }
    if (!pAction_microphone_select_) {
        pAction_microphone_select_ = new QWidgetAction(this);
        QLabel* pLabelMicrophoneSelect = new QLabel(tr("Microphone Select"));
        pLabelMicrophoneSelect->setFixedHeight(20);
        pAction_microphone_select_->setDefaultWidget(pLabelMicrophoneSelect);
        pLabelMicrophoneSelect->setObjectName("label_select");
    }
    activeMic->release();

    if (!pAction_audio_set_) {
        pAction_audio_set_ = new QAction(tr("audio setting"));
        connect(pAction_audio_set_, SIGNAL(triggered(bool)), this, SLOT(OnAudioSetTriggered(bool)));
    }

    if (pMenu_audio_ == NULL) {
        pMenu_audio_ = new QMenu(this);
        pMenu_audio_->setWindowFlag(Qt::FramelessWindowHint);
        pMenu_audio_->setAttribute(Qt::WA_TranslucentBackground);
        TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)pMenu_audio_->winId());
    }
    pMenu_audio_->addAction(pAction_speaker_select_);
    for (auto& speaker : pAction_speaker_list_) {
        pMenu_audio_->addAction(speaker);
    }
    pMenu_audio_->addSeparator();
    pMenu_audio_->addAction(pAction_microphone_select_);
    for (auto& microphone : pAction_microphone_list_) {
        pMenu_audio_->addAction(microphone);
    }
    pMenu_audio_->addSeparator();
    pMenu_audio_->addAction(pAction_audio_set_);
}
void BottomBarController::ClearAudioMenu() {
    if (pAction_speaker_select_ != NULL) {
        delete pAction_speaker_select_;
        pAction_speaker_select_ = NULL;
    }
    if (pAction_microphone_select_ != NULL) {
        delete pAction_microphone_select_;
        pAction_microphone_select_ = NULL;
    }
    if (pAction_audio_set_ != NULL) {
        delete pAction_audio_set_;
        pAction_audio_set_ = NULL;
    }
    for (auto& item_speaker : pAction_speaker_list_) {
        delete item_speaker;
    }
    pAction_speaker_list_.clear();
    for (auto& item_microphone : pAction_microphone_list_) {
        delete item_microphone;
    }
    pAction_microphone_list_.clear();
    map_menu_ckbox_.clear();

    if (pMenu_audio_ != NULL) {
        if (TUIRoomCore::GetInstance()->GetScreenShareManager() != nullptr) {
            TUIRoomCore::GetInstance()->GetScreenShareManager()->RemoveExcludedShareWindow((void*)pMenu_audio_->winId());
        }
        pMenu_audio_->clear();
        delete pMenu_audio_;
        pMenu_audio_ = NULL;
    }
}
void BottomBarController::SetShareScreenStyle(bool is_sharing_screen) {
    is_sharing_screen_ = is_sharing_screen;
    if (is_sharing_screen_) {
        ui.widget_share_button->SetText(tr("NewShare"));
        ui.btn_end->setText(tr("end share"));
        ui.horizontalLayout_2->setContentsMargins(0, 5, 0, 5);
        ShowTopWidget();
    } else {
        ui.widget_share_button->SetText(tr("Share"));
        if (share_top_widget_ != nullptr) {
            share_top_widget_->hide();
        }
        ui.horizontalLayout_2->setContentsMargins(0, 5, 0, 10);
        hide_bar_timer_.stop();
        if (screen_share_window_ != nullptr) {
            screen_share_window_->close();
        }
    }

    ui.widget_share_button->SetChecked(is_sharing_screen_);

    ui.widget_bg->setProperty("screen_sharing", is_sharing_screen);
    ui.widget_bg->setStyle(QApplication::style());
}
void BottomBarController::ShowTopWidget() {
    if (share_top_widget_ == nullptr) {
        share_top_widget_ = new SmallTopBarController(NULL);
        connect(share_top_widget_, &SmallTopBarController::SignalCloseWnd, this, [=]() {
            ui.widget_share_button->SetChecked(false);
            OnStartScreenShare(false);
            });
    }
    share_top_widget_->setWindowTitle(kAppName);
    share_top_widget_->resize(260, 35);
#ifdef __APPLE__
    share_top_widget_->setWindowFlags(Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::X11BypassWindowManagerHint | Qt::Window);
    share_top_widget_->setAttribute(Qt::WA_MacAlwaysShowToolWindow);
#else
    share_top_widget_->setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::WindowStaysOnTopHint | Qt::Window);
#endif
    share_top_widget_->setAttribute(Qt::WA_TranslucentBackground);

    connect(share_top_widget_, &SmallTopBarController::SignalStopSharing, this, [=]() {
        ui.widget_share_button->SetChecked(false);
        OnStartScreenShare(false);
        });
    connect(share_top_widget_, &SmallTopBarController::SignalShowTopBar, this, [=]() {
        this->show();
        this->raise();
        hide_bar_timer_.start(5000);
        });
    share_top_widget_->hide();
    hide_bar_timer_.start(5000);
}

void BottomBarController::mouseMoveEvent(QMouseEvent* event) {
    if (share_top_widget_ != nullptr) {
        hide_bar_timer_.start(5000);
    }

    QWidget::mouseMoveEvent(event);
}
void BottomBarController::mousePressEvent(QMouseEvent* event) {
    QWidget::mousePressEvent(event);
}
void BottomBarController::mouseReleaseEvent(QMouseEvent* event) {
    QWidget::mouseReleaseEvent(event);
}
void BottomBarController::closeEvent(QCloseEvent* event) {
    ui.widget_share_button->SetChecked(false);
    OnStartScreenShare(false);
}
void BottomBarController::paintEvent(QPaintEvent* event) {
    QStyleOption opt;
    opt.init(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
    return QWidget::paintEvent(event);
}

void BottomBarController::SetHasVideo(bool has_video) {
    ui.widget_camera_button->SetChecked(!has_video);
}
void BottomBarController::SetHasAudio(bool has_audio) {
    ui.widget_audio_button->SetChecked(!has_audio);
}
void BottomBarController::SetEnableScreenShare(bool enable_screen_share) {
    ui.widget_share_button->setEnabled(enable_screen_share);
}

void BottomBarController::SetShowChatRoom(bool show) {
    ui.widget_chatroom_button->SetChecked(show);
}

void BottomBarController::CloseWin() {
    if (share_top_widget_ != nullptr) {
        share_top_widget_->close();
        delete share_top_widget_;
        share_top_widget_ = nullptr;
    }
}

void BottomBarController::MoveToTop(QWidget* main_widget) {
    QDesktopWidget* desk = QApplication::desktop();
    QRect main_rect = desk->availableGeometry(main_widget);
    this->resize(main_rect.width() > 1000 ? 1000 : main_rect.width() / 2, 55);
    this->move(main_rect.x() + (main_rect.width() - this->width()) / 2, 0);
    if (share_top_widget_ != nullptr) {
        share_top_widget_->move(main_rect.x() + (main_rect.width() - share_top_widget_->width()) / 2, 0);
        TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)share_top_widget_->winId());
    }
}
void BottomBarController::OnStartScreenShare(bool checked) {
    if (!screen_shower_id_.empty()) {
        this->hide();
        ui.widget_share_button->SetChecked(false);
        this->show();

        TXMessageBox::Instance().AddLineTextMessage(tr("Other users are sharing screens"));
        return;
    }
    LINFO("BottomBarController::OnStartScreenShare %d", checked);
    if (checked) {
#ifdef _WIN32
        SIZE thumb_size{ kShareItemWidth - kShareItemMargin, kShareItemHeight - kShareItemMargin };
        SIZE icon_size{ kShareIconWidth, kShareIconHeight };
#else
        bool is_screen_record_authorized = IsScreenRecordAuthorized();
        if (!is_screen_record_authorized) {
            this->hide();
            ui.widget_share_button->SetChecked(false);
            this->show();

            // "提示":"需要开启系统录屏权限，才能分享屏幕"
            // "Tip ":" You need to enable system recording permission to share the screen"
            RequestScreenRecordAccess(tr("Warning"), tr("You need to enable the system screen recording permission to share the screen"));
            return;
        }

        liteav::SIZE thumb_size;
        thumb_size.width = kShareItemWidth - kShareItemMargin;
        thumb_size.height = kShareItemHeight - kShareItemMargin;
        liteav::SIZE icon_size;
        icon_size.width = kShareIconWidth;
        icon_size.height = kShareIconHeight;
#endif
        std::vector<IScreenShareManager::ScreenCaptureSourceInfo> source = TUIRoomCore::GetInstance()->GetScreenShareManager()->GetScreenCaptureSources(thumb_size, icon_size);
        LINFO("GetScreenCaptureSources size=%d", source.size());

        TUIRoomCore::GetInstance()->GetScreenShareManager()->RemoveAllExcludedShareWindow();

        std::vector<IScreenShareManager::ScreenCaptureSourceInfo>::iterator iter = source.begin();
        while (iter != source.end()) {
            std::string src_name = iter->source_name;
            if (src_name.find(kAppName) != std::string::npos) {
                if (iter->source_id != NULL)
                    TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow(iter->source_id);
                iter = source.erase(iter);
            } else {
                iter++;
            }
        }
        if (screen_share_window_ == nullptr) {
            screen_share_window_ = new ScreenShareWindow(this);
            connect(screen_share_window_, SIGNAL(SignalConfirmShareScreen(bool)), this, SLOT(OnConfirmShareScreen(bool)));
        }
        screen_share_window_->InitShow(source);
        screen_share_window_->show();
    } else {
        LINFO("StopScreenCapture...");
        TUIRoomCore::GetInstance()->GetScreenShareManager()->StopScreenCapture();
        auto local_user = DataStore::Instance()->GetCurrentUserInfo().user_id;
        DataStore::Instance()->RemoveScreenShareUser(local_user);
        DataStore::Instance()->SetCurrentMainWindowUser("");
        if (DataStore::Instance()->IsShareScreenVoice()) {
            TUIRoomCore::GetInstance()->StopSystemAudioLoopback();
            DataStore::Instance()->SetShareScreenVoice(false);
        }

        emit SignalStartScreen(false);
    }
}
#ifdef __APPLE__
bool BottomBarController::IsScreenRecordAuthorized() {
    // Mac10.15及以上才有屏幕录制授权
    // Mac10.15 and above are required for screen recording authorization
    if (@available(macos 10.15, *)) {
        bool bRet = false;
        CFArrayRef list = CGWindowListCopyWindowInfo(kCGWindowListOptionAll, kCGNullWindowID);
        if (list) {
            int n = (int)(CFArrayGetCount(list));
            for (int i = 0; i < n; i++) {
                NSDictionary* info = (NSDictionary*)(CFArrayGetValueAtIndex(list, (CFIndex)i));
                NSString* name = info[(id)kCGWindowName];
                NSNumber* pid = info[(id)kCGWindowOwnerPID];
                if (pid != nil && name != nil) {
                    int nPid = [pid intValue];
                    char path[PROC_PIDPATHINFO_MAXSIZE + 1];
                    int lenPath = proc_pidpath(nPid, path, PROC_PIDPATHINFO_MAXSIZE);
                    if (lenPath > 0) {
                        path[lenPath] = 0;
                        if (strcmp(path, "/System/Library/CoreServices/SystemUIServer.app/Contents/MacOS/SystemUIServer") == 0) {
                            bRet = true;
                            break;
                        }
                    }
                }
            }
            CFRelease(list);
        }
        return bRet;
    } else {
        return true;
    }
}
void BottomBarController::RequestScreenRecordAccess(QString title, QString message) {
    // "前往系统设置" 和 "取消" 按钮
    // "Go to System Settings" and "Cancel" buttons
    QString btn_go = tr("Go to system settings");
    QString btn_cancel = tr("cancel");
    NSAlert *alert = [[NSAlert alloc] init];
    [alert setMessageText:title.toNSString()];
    [alert setInformativeText:message.toNSString()];
    [alert addButtonWithTitle:btn_go.toNSString()];
    [alert addButtonWithTitle:btn_cancel.toNSString()];
    [alert setAlertStyle:NSAlertStyleWarning];
    NSWindow *window = [NSApplication sharedApplication].keyWindow;
    [alert beginSheetModalForWindow:window completionHandler:^(NSModalResponse returnCode) {
        if (returnCode == NSAlertFirstButtonReturn) {
            NSURL *URL = [NSURL URLWithString:@"x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"];
            [[NSWorkspace sharedWorkspace] openURL:URL];
        }
    }];
}
#endif
void BottomBarController::OnConfirmShareScreen(bool share) {
    if (!share || !screen_shower_id_.empty()) {
        if (!is_sharing_screen_) {
            this->hide();
            ui.widget_share_button->SetChecked(false);
            this->show();
        }
        if (!screen_shower_id_.empty()) {
            TXMessageBox::Instance().AddLineTextMessage(tr("Other users are sharing screens"));
        }

        if (screen_share_window_ != nullptr) {
            screen_share_window_->close();
            delete screen_share_window_;
            screen_share_window_ = nullptr;
        }
        return;
    }

    IScreenShareManager::ScreenCaptureSourceInfo source_info;
    std::vector<IScreenShareManager::ScreenCaptureSourceInfo> vec_source = screen_share_window_->GetSelected();
    if (vec_source.size() >= 1) {
        source_info.source_id = vec_source.at(0).source_id;
        source_info.type = vec_source.at(0).type;
        source_info.source_name = vec_source.at(0).source_name;
    }

    LINFO("start SelectScreenCaptureTarget, name=%s", source_info.source_name.c_str());
#ifdef _WIN32
    RECT rect{ 0, 0, 0, 0 };
#else
    RECT rect;
#endif
    IScreenShareManager::ScreenCaptureProperty property;
    property.enableCaptureChildWindow = true;
    TUIRoomCore::GetInstance()->GetScreenShareManager()->SelectScreenCaptureTarget(source_info, rect, property);
    TUIRoomCore::GetInstance()->GetScreenShareManager()->ReleaseScreenCaptureSources();

    screen_share_window_->close();
    delete screen_share_window_;
    screen_share_window_ = nullptr;

    if (!is_sharing_screen_) {
        LINFO("start StartScreenCapture...");
        TUIRoomCore::GetInstance()->GetScreenShareManager()->StartScreenCapture(nullptr);
        DataReport::Instance()->OperateReport(ReportType::kStartScreenSharing);
        auto local_user = DataStore::Instance()->GetCurrentUserInfo().user_id;
        DataStore::Instance()->AddScreenShareUser(local_user);
        DataStore::Instance()->SetCurrentMainWindowUser(local_user);
        emit SignalStartScreen(true);
    }
    if (DataStore::Instance()->IsShareScreenVoice()) {
        TUIRoomCore::GetInstance()->StartSystemAudioLoopback();
    } else {
        TUIRoomCore::GetInstance()->StopSystemAudioLoopback();
    }
}

void BottomBarController::OnCameraClicked(bool checked) {
    emit SignalCameraClicked(checked);
}

void BottomBarController::OnAudioClicked(bool checked) {
    emit SignalAudioClicked(checked);
}
void BottomBarController::OnShareClicked(bool checked) {
    if (screen_share_window_ != nullptr && screen_share_window_->isVisible()) {
        ui.widget_share_button->SetChecked(true);
        screen_share_window_->raise();
        return;
    }

    if (is_sharing_screen_) {
        ui.widget_share_button->SetChecked(!checked);
        OnStartScreenShare(!checked);
    } else {
        ui.widget_share_button->SetChecked(checked);
        OnStartScreenShare(checked);
    }
}
void BottomBarController::OnMemberClicked(bool checked) {
    label_member_num_->setText("");
    label_member_num_->hide();

    ui.widget_member_button->SetChecked(false);

    emit SignalShowMemberList();
}

void BottomBarController::OnChatRoomClicked(bool checked) {
    emit SignalChatRoomClicked(checked);
}

void BottomBarController::OnCameraSetClicked(bool checked) {
    ClearCameraMenu();
    InitCameraDeviceItem();

    QPoint btm_menu_pos = this->mapToGlobal(QPoint(0, 0));
    QPoint camera_set_pos = ui.widget_camera_button->mapToGlobal(QPoint(0, 0));
    int x = camera_set_pos.x() + ui.widget_camera_button->width() / 2;
    int y = btm_menu_pos.y() - pAction_camera_list_.size() * 40 - 20 - 40 * 2 - 10 - 15;
    if (y < 0)
        y = btm_menu_pos.y() + this->height();

    pMenu_camera_->move(x, y);
    pMenu_camera_->show();
}
void BottomBarController::OnCameraMenuTriggered(bool checked) {
    QObject* obj = sender();
    if (obj == pAction_camera_set_) {
        emit SignalShowSetting(0);
    } else if (obj == pAction_beauty_set_) {
        emit SignalShowSetting(1);
    } else {
        if (map_menu_ckbox_.contains((QCheckBox*)obj)) {
            QString device_id = map_menu_ckbox_[(QCheckBox*)obj];
            TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeCamera, device_id.toStdString().c_str());
        }
    }
}
void BottomBarController::OnAudioSetClicked(bool checked) {
    ClearAudioMenu();
    InitAudioDeviceItem();

    QPoint btm_menu_pos = this->mapToGlobal(QPoint(0, 0));
    QPoint audio_set_pos = ui.widget_audio_button->mapToGlobal(QPoint(0, 0));
    int x = audio_set_pos.x() + ui.widget_audio_button->width() / 2;
    // Position algorithm：BottomBarController.pos - QCheckBox.size * 40 - QLabel.size * 20 - menu.item * 40 - margin * 2 - spaceline * 10
    int y = btm_menu_pos.y() - (pAction_microphone_list_.size() + pAction_speaker_list_.size()) * 40 - 20 * 2 - 40 - 10 * 2 - 15;
    if (y < 0)
        y = btm_menu_pos.y() + this->height();

    pMenu_audio_->move(x, y);
    pMenu_audio_->show();
}
void BottomBarController::OnAudioSetTriggered(bool checked) {
    QObject* obj = sender();
    if (obj == pAction_audio_set_) {
        emit SignalShowSetting(2);
    }
}
void BottomBarController::OnSpeakerSetTriggered(bool checked) {
    QObject* obj = sender();
    if (map_menu_ckbox_.contains((QCheckBox*)obj)) {
        QString device_id = map_menu_ckbox_[(QCheckBox*)obj];
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeSpeaker, device_id.toStdString().c_str());
    }
}
void BottomBarController::OnMicrophoneSetTriggered(bool checked) {
    QObject* obj = sender();
    if (map_menu_ckbox_.contains((QCheckBox*)obj)) {
        QString device_id = map_menu_ckbox_[(QCheckBox*)obj];
        TUIRoomCore::GetInstance()->GetDeviceManager()->setCurrentDevice(liteav::TXMediaDeviceTypeMic, device_id.toStdString().c_str());
    }
}
void BottomBarController::OnHideBarTimeOut() {
    if (share_top_widget_ != nullptr) {
        this->hide();
        share_top_widget_->show();
    }
}

void BottomBarController::OnScreenShareSetClicked(bool checked) {
    if (pMenu_share_ == NULL) {
        pMenu_share_ = new QMenu(this);
        QString style = "QMenu {background-color:#383F54;border: 6px solid #383F54;border-radius:6px;}\
            QMenu::item{ background-color: transparent; padding:2px 5px 2px 30px; margin:2px 2px;}\
            QMenu::item::indicator { background-image:url(:/BottomBarController/BottomBarController/share_menu.png);\
                                    background-position:left;background-repeat:no-repeat;}\
            QMenu::item:selected{ background-color: #2dabf9; }\
            QMenu::icon{width: 25px;height: 25px;}";
        pMenu_share_->setStyleSheet(style);
        pMenu_share_->setWindowFlag(Qt::FramelessWindowHint);
        pMenu_share_->setAttribute(Qt::WA_TranslucentBackground);
        TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)pMenu_share_->winId());
    }
    if (pAction_share_screen_ == NULL) {
        pAction_share_screen_ = new QAction(tr("screen share"));
        connect(pAction_share_screen_, SIGNAL(triggered()), this, SLOT(OnScreenShareMenuTriggered()));
        pMenu_share_->addAction(pAction_share_screen_);
    }
    bool is_sharing = ui.widget_share_button->isChecked();
    if (is_sharing) {
        pAction_share_screen_->setText(tr("end share"));
    } else {
        pAction_share_screen_->setText(tr("screen share"));
    }

    QPoint btm_menu_pos = this->mapToGlobal(QPoint(0, 0));
    QPoint screen_share_set_pos = ui.widget_share_button->mapToGlobal(QPoint(0, 0));
    int x = screen_share_set_pos.x() + ui.widget_share_button->width() / 2;
    int y = btm_menu_pos.y() - 40 - 10;
    if (y < 0)
        y = btm_menu_pos.y() + this->height();

    pMenu_share_->move(x, y);
    pMenu_share_->show();
}
void BottomBarController::OnScreenShareMenuTriggered() {
    bool is_sharing = ui.widget_share_button->isChecked();
    ui.widget_share_button->SetChecked(!is_sharing);

    OnStartScreenShare(!is_sharing);
}
void BottomBarController::ExcludeShareWindow() {
    TUIRoomCore::GetInstance()->GetScreenShareManager()->AddExcludedShareWindow((void*)this->winId());
}
void BottomBarController::SetCurrentScreenShower(QString user_id) {
    screen_shower_id_ = user_id.toStdString();
}
void BottomBarController::OnBtnEndClicked() {
    if (is_sharing_screen_) {
        OnScreenShareMenuTriggered();
    } else {
        emit SignalLeaveRoom();
    }
}
void BottomBarController::SetChatRoomBtnStatus(bool show) {
    ui.widget_chatroom_button->SetChecked(show);
}

void BottomBarController::SlotScreenCaptureStopped(int reason) {
    if (0 != reason && this->isVisible()) {
        bool is_sharing = ui.widget_share_button->isChecked();
        ui.widget_share_button->SetChecked(!is_sharing);
        if (reason != 0) {
            OnStartScreenShare(false);
        }
        TXMessageBox::Instance().AddLineTextMessage(tr("Screen Capture Stopped."));
    }
}
