#include "TransferRoomController.h"
#include "TUIRoomCore.h"
#include "StatusUpdateCenter.h"
#include "TXMessageBox.h"
#include "../utils/log.h"
#include <QScrollBar>
#include "MessageDispatcher/MessageDispatcher.h"

TransferRoomController::TransferRoomController(QWidget* parent)
    : QDialog(parent)
    , view_dragger_(this) {
    ui_.setupUi(this);

    InitUi();
    InitConnect();
}

TransferRoomController::~TransferRoomController() {
}

void TransferRoomController::InitUi() {
    LOAD_STYLE_SHEET(":/TransferRoomController/TransferRoomController/TransferRoomController.qss");
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::WindowCloseButtonHint | Qt::Tool);
    ui_.member_list->setHorizontalScrollBarPolicy(Qt::ScrollBarAlwaysOff);
    ui_.member_list->setVerticalScrollMode(QAbstractItemView::ScrollPerItem);
    ui_.member_list->setFocusPolicy(Qt::NoFocus);
}

void TransferRoomController::InitConnect() {
    connect(ui_.destory_room_btn, &QPushButton::clicked, this, [=]() {
        emit SignalCloseWindow();
        emit StatusUpdateCenter::Instance().SignalCloseMainWindow(TUIExitRoomType::kNormal);
    });
    connect(ui_.close_btn, &QPushButton::clicked, this, &TransferRoomController::SignalCloseWindow);

    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRemoteUserLeave, this, &TransferRoomController::SlotOnRemoteUserLeaveRoom);
}
void TransferRoomController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    return QDialog::mouseMoveEvent(event);
}
void TransferRoomController::mousePressEvent(QMouseEvent* event) {
    view_dragger_.mousePress(event);
    return QDialog::mousePressEvent(event);
}
void TransferRoomController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    return QDialog::mouseReleaseEvent(event);
}
void TransferRoomController::showEvent(QShowEvent *event) {
    this->InitMemberList();
    this->raise();
    return QDialog::showEvent(event);
}
void TransferRoomController::InitMemberList() {
    ui_.member_list->clear();
    auto member_list = TUIRoomCore::GetInstance()->GetRoomUsers();
    std::sort(member_list.begin(), member_list.end(), [=](TUIUserInfo left, TUIUserInfo right) {
        return std::strcmp(left.user_name.c_str(), right.user_name.c_str()) <= 0;
    });
    for (int i = 0; i < member_list.size(); i++) {
        auto member = member_list.at(i);
        QString user_id = member.user_id.c_str();
        QString user_name = member.user_name.c_str();
        QListWidgetItem *item = new QListWidgetItem(ui_.member_list);
        item->setFlags(item->flags() & Qt::NoItemFlags & ~Qt::ItemIsSelectable);

        TransferUserItem* view = new TransferUserItem(ui_.member_list);
        view->SetItemInfo(user_id, user_name);
        view->resize(ui_.member_list->width(), 50);
        item->setSizeHint(QSize(ui_.member_list->width(), 50));
        ui_.member_list->addItem(item);
        ui_.member_list->setItemWidget(item, view);
        connect(view, &TransferUserItem::SignalTransferAndExit, this, [=](QString user_id) {
            this->TransferRoomMaster(user_id.toStdString());
        });
    }
}

void TransferRoomController::TransferRoomMaster(std::string user_id) {
    if (IsUserInRoom(user_id)) {
        LINFO("Transfer room master to [ %s ]", user_id.c_str());
        auto user = TUIRoomCore::GetInstance()->GetUserInfo(user_id);
        if (user == nullptr) {
            LINFO("user not exist,user_id :%s", user_id.c_str());
            return;
        }
        TUIRoomCore::GetInstance()->TransferRoomMaster(user->user_id); 
    } else {
        emit StatusUpdateCenter::Instance().SignalCloseMainWindow(TUIExitRoomType::kNormal);
    }
}

bool TransferRoomController::IsUserInRoom(const std::string& user_id) {
    auto member_list = TUIRoomCore::GetInstance()->GetRoomUsers();
    auto user = find_if(member_list.begin(), member_list.end(), [=](const TUIUserInfo& user_info) {
        return user_info.user_id == user_id;
    });
    if (user != member_list.end()) {
        return true;
    }
    return false;
}
void TransferRoomController::SlotOnRemoteUserOnStage(const QString& user_id) {
    auto user = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
    QString user_name = user->user_name.c_str();
    QListWidgetItem *item = new QListWidgetItem(ui_.member_list);
    item->setFlags(item->flags() & Qt::NoItemFlags & ~Qt::ItemIsSelectable);

    TransferUserItem* view = new TransferUserItem(ui_.member_list);
    view->SetItemInfo(user_id, user_name);
    view->resize(ui_.member_list->width(), 50);
    item->setSizeHint(QSize(ui_.member_list->width(), 50));
    ui_.member_list->addItem(item);
    ui_.member_list->setItemWidget(item, view);
    connect(view, &TransferUserItem::SignalTransferAndExit, this, [=](QString user_id) {
        this->TransferRoomMaster(user_id.toStdString());
    });
}
void TransferRoomController::SlotOnRemoteUserLeaveRoom(const QString& user_id) {
    for (int i = 0; i < ui_.member_list->count(); ++i) {
        QListWidgetItem* item = ui_.member_list->item(i);
        TransferUserItem* view = static_cast<TransferUserItem*>(ui_.member_list->itemWidget(item));
        if (view->GetItemUserId() == user_id) {
            ui_.member_list->takeItem(i);
            delete item;
            delete view;
            break;
        }
    }
}
