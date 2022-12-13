#include <QListView>
#include <QDesktopWidget>
#include <QBitmap>
#include <QPainter>
#include "LoginViewController.h"
#include "TXMessageBox.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "DataStore.h"
#include "../utils/log.h"
#ifdef _WIN32
#include "usersig/win/GenerateTestUserSig.h"
#else
#include "usersig/mac/GenerateTestUserSig.h"
#endif

LoginViewController::LoginViewController(QWidget *parent)
    : QWidget(parent) 
    , view_dragger_(this) {
    ui_ = new Ui::LoginViewController;
    ui_->setupUi(this);
    this->resize(850, 425);

    Language language = DataStore::Instance()->GetCurrentLanguage();
    bool is_chinese = (language == Language::kChinese ? true : false);
    OnSwitchLanguage(is_chinese);
    ui_->btn_language->setChecked(is_chinese);

    InitUi();
    InitConnect();
    TUIRoomCore::GetInstance()->SetCallback(&MessageDispatcher::Instance());
}
void LoginViewController::OnSwitchLanguage(bool language_zh) {
    if (language_zh) {
        if (translator_zh_ == nullptr) {
            translator_zh_ = new QTranslator;
            translator_zh_->load(":/Language/Language/RoomApp_zh.qm");
        }
        if (translator_en_ != nullptr)
            qApp->removeTranslator(translator_en_);
        qApp->installTranslator(translator_zh_);
    }
    else {
        if (translator_en_ == nullptr) {
            translator_en_ = new QTranslator;
            translator_en_->load(":/Language/Language/RoomApp_en.qm");
        }
        if (translator_zh_ != nullptr)
            qApp->removeTranslator(translator_zh_);
        qApp->installTranslator(translator_en_);
    }
    ui_->retranslateUi(this);

    DataStore::Instance()->SetCurrentLanguage(language_zh ? Language::kChinese : Language::kEnglish);

    ui_->btn_language->setText(language_zh ? tr("English") : tr("Chinese"));
}
LoginViewController::~LoginViewController(){
    delete ui_;
    if (translator_zh_ != nullptr) {
        delete translator_zh_;
        translator_zh_ = nullptr;
    }
    if (translator_en_ != nullptr) {
        delete translator_en_;
        translator_en_ = nullptr;
    }
    DataStore::Instance()->DestoryInstance();
    TUIRoomCore::GetInstance()->DestroyInstance();
}

void LoginViewController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    return QWidget::mouseMoveEvent(event);
}

void LoginViewController::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    return QWidget::mousePressEvent(event);
}

void LoginViewController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    return QWidget::mouseReleaseEvent(event);
}

void LoginViewController::InitUi() {
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::WindowCloseButtonHint);
#ifdef __APPLE__
    ui_->name_edit->setAttribute(Qt::WA_MacShowFocusRect, false);
    ui_->room_id_edit->setAttribute(Qt::WA_MacShowFocusRect, false);
#endif
    LOAD_STYLE_SHEET(":/LoginViewController/LoginViewController/LoginViewController.qss");

    //QRegExp regx("[0-9]+$");
    //QValidator* validator_phone = new QRegExpValidator(regx, ui_->room_id_edit);
    //ui_->room_id_edit->setValidator(validator_phone);

    UserLoginInfo info = DataStore::Instance()->GetCurrentUserInfo();
    ui_->name_edit->setText(QString::fromStdString(info.name));
}

void LoginViewController::InitConnect() {
    connect(ui_->close_btn, &QPushButton::clicked, this, [=]() {
        LINFO("normal close login window.");
        this->close();
    });
    connect(ui_->btn_language, SIGNAL(clicked(bool)), this, SLOT(OnSwitchLanguage(bool)));
    connect(ui_->enter_room_btn, &QPushButton::clicked, this, &LoginViewController::SlotEnterRoom);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnLogin, this, &LoginViewController::SlotOnLogin);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnError, this, &LoginViewController::SlotOnError);
}

void LoginViewController::showEvent(QShowEvent* event) {
    QWidget::showEvent(event);
}

void LoginViewController::closeEvent(QCloseEvent* event) {
    deleteLater();
}

void LoginViewController::resizeEvent(QResizeEvent* event) {
    QBitmap bmp(this->size());
    bmp.fill();
    QPainter p(&bmp);
    p.setPen(Qt::NoPen);
    p.setBrush(Qt::black);
    p.drawRoundedRect(bmp.rect(), 5, 5);
    setMask(bmp);

    QWidget::resizeEvent(event);
}

QString LoginViewController::GetRoomID() {
    return ui_->room_id_edit->text();
}

void LoginViewController::SlotEnterRoom() {
    if (ui_->name_edit->text().isEmpty() || ui_->room_id_edit->text().isEmpty()) {
        TXMessageBox::Instance().AddLineTextMessage(tr("user_id or room_id can't be empty."));
        return;
    }
    UserLoginInfo info = DataStore::Instance()->GetCurrentUserInfo();
    if (!DataStore::Instance()->IsAppLaunch()) {
        info.user_id = ui_->name_edit->text().toStdString();
        info.name = ui_->name_edit->text().toStdString();
#ifdef _WIN32
        info.user_sig = GenerateTestUserSig::instance().genTestUserSig(info.user_id);
#else
        NSString* ns_user_id = [[NSString alloc]initWithUTF8String:info.user_id.c_str()];
        NSString* ns_user_sig = [GenerateTestUserSig genTestUserSig:ns_user_id];
        const char* c_string = [ns_user_sig cString];
        info.user_sig = std::string(c_string);
#endif
        DataStore::Instance()->SetUserLoginInfo(info);
    }
    if (info.user_id.empty() || info.sdk_app_id == 0 || info.user_sig.empty()) {
        TXMessageBox::Instance().AddLineTextMessage(tr("Please complete the user information first"));
        return;
    }
    ui_->enter_room_btn->setEnabled(false);
    ui_->enter_room_btn->setText(tr("Entering..."));
    TUIRoomCore::GetInstance()->Login(info.sdk_app_id, info.user_id, info.user_sig);
}

void LoginViewController::SlotOnShowLoginWin(TUIExitRoomType type_exit_room) {
    if (main_window_ != nullptr) {
        delete main_window_;
        main_window_ = nullptr;
    }
    TUIRoomCore::GetInstance()->Logout();
    QDesktopWidget* desk = QApplication::desktop();
    this->move((desk->availableGeometry().width() - this->width()) / 2, (desk->availableGeometry().height() - this->height()) / 2);
    this->show();
    ShowExitWnd(type_exit_room);
}

void LoginViewController::SlotOnLogin(int code, const QString& message) {
    ui_->enter_room_btn->setEnabled(true);
    ui_->enter_room_btn->setText(tr("EnterRoom"));
    std::string user_name = ui_->name_edit->text().toStdString();
    if (main_window_ != nullptr) {
        delete main_window_;
        main_window_ = nullptr;
    }

    UserLoginInfo info = DataStore::Instance()->GetCurrentUserInfo();
    info.name = user_name;
    DataStore::Instance()->SetUserLoginInfo(info);
    TUIRoomCore::GetInstance()->SetSelfProfile(user_name,"");
    main_window_ = new MainWindow(TUISpeechMode::kFreeSpeech);
    connect(main_window_, &MainWindow::SignalShowLoginWind, this, &LoginViewController::SlotOnShowLoginWin);
    main_window_->SetLoginView(this);
    main_window_->show();
    main_window_->InitShow(true);
    this->hide();
}

void LoginViewController::SlotOnError(int code, const QString& message) {
    TUIRoomError error = TUIRoomError(code);
    switch (error) {
    case TUIRoomError::kErrorLoginFailed:
        TXMessageBox::Instance().AddLineTextMessage(tr("Login failed"));
        ui_->enter_room_btn->setEnabled(true);
        ui_->enter_room_btn->setText(tr("EnterRoom"));
        break;
    default:
        return;
        break;
    }
}

void LoginViewController::ShowExitWnd(TUIExitRoomType type_exit_room) {
    switch (type_exit_room)
    {
    case TUIExitRoomType::kNormal:
        return;
        break;
    case TUIExitRoomType::kKickOff:
        TXMessageBox::Instance().AddLineTextMessage(tr("You have been removed from room"));
        break;
    case TUIExitRoomType::kRoomDestoryed:
        TXMessageBox::Instance().AddLineTextMessage(tr("The room has been destroyed"));
        break;
    case TUIExitRoomType::kKickOffLine:
        TXMessageBox::Instance().AddLineTextMessage(tr("You have been kicked off line"));
        break;
    case TUIExitRoomType::kNetworkAnomaly:
        return;
        break;
    default:
        return;
        break;
    }
    if (main_window_ != nullptr) {
        delete main_window_;
        main_window_ = nullptr;
    }
    this->show();
}
