#include "RoomTipsView.h"
#include <QApplication>
#include <QClipboard>
#include "TUIRoomCore.h"
#include "DataStore.h"
#include "TXMessageBox.h"
#include "StatusUpdateCenter.h"

RoomTipsView::RoomTipsView(QWidget *parent)
    : QWidget(parent) {
    ui.setupUi(this);
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::ToolTip);

    InitUI();

    LOAD_STYLE_SHEET(":/RoomTipsView/RoomTipsView/RoomTipsView.qss");
}

RoomTipsView::~RoomTipsView() {
}
void RoomTipsView::InitUI() {
    std::string sdk_version = TUIRoomCore::GetInstance()->GetSDKVersion();
    //std::string room_id = TUIRoomCore::GetInstance()->GetRoomInfo().room_id;
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    ui.label_userId->setText(QString::fromStdString(local_user->user_id));
    ui.label_userId->setToolTip(QString::fromStdString(local_user->user_id));
    ui.label_userId->setTextInteractionFlags(Qt::TextSelectableByMouse | Qt::TextSelectableByKeyboard);
    ui.label_userName->setText(QString::fromStdString(local_user->user_name));
    ui.label_userName->setToolTip(QString::fromStdString(local_user->user_name));
    ui.label_userName->setTextInteractionFlags(Qt::TextSelectableByMouse | Qt::TextSelectableByKeyboard);
    ui.label_sdkVersion->setText(QString::fromStdString(sdk_version));
    ui.label_sdkVersion->setToolTip(QString::fromStdString(sdk_version));
    ui.label_sdkVersion->setTextInteractionFlags(Qt::TextSelectableByMouse | Qt::TextSelectableByKeyboard);

    // 提示：复制此信息到剪切板 
    ui.btn_clipboard->setToolTip(tr("Copy this information to the clipboard"));
    connect(ui.btn_clipboard, &QPushButton::clicked, this, &RoomTipsView::SlotOnClipboardClicked);

    connect(&StatusUpdateCenter::Instance(), &StatusUpdateCenter::SignalMainWindowActive, this, [=]() {
        emit SignalCloseView();
    });
}
void RoomTipsView::SetRoomID(QString room_id) {
    room_id_ = room_id;
    ui.label_roomId->setText(room_id_);
    ui.label_roomId->setToolTip(room_id_);
    ui.label_roomId->setTextInteractionFlags(Qt::TextSelectableByMouse | Qt::TextSelectableByKeyboard);
}
void RoomTipsView::leaveEvent(QEvent *event) {
    emit SignalCloseView();
    return QWidget::leaveEvent(event);
}
void RoomTipsView::SlotOnClipboardClicked() {
    std::string sdk_version = TUIRoomCore::GetInstance()->GetSDKVersion();
    //std::string room_id = TUIRoomCore::GetInstance()->GetRoomInfo().room_id;
    std::string room_id = room_id_.toStdString();
    auto local_user = TUIRoomCore::GetInstance()->GetUserInfo(DataStore::Instance()->GetCurrentUserInfo().user_id);
    if (local_user == nullptr) {
        return;
    }
    std::string info = "UserID: " + local_user->user_id + "\nRoomID: " + room_id + \
        + "\nUserName: " + local_user->user_name + "\nSDK Version: " + sdk_version;

    QClipboard *clipboard = QApplication::clipboard();
    clipboard->setText(QString::fromStdString(info));

    emit SignalCloseView();

    // 提示：信息已复制到剪切板
    TXMessageBox::Instance().AddLineTextMessage(tr("The information is copied to the clipboard"));
}