#include <QPainter>
#include <QTime>
#include <QKeyEvent>
#include "ChatRoomViewController.h"
#include "MessageDispatcher/MessageDispatcher.h"
#include "TXMessageBox.h"
#include "CommonDef.h"
#include "DataReport.h"
#include "log.h"

ChatRoomViewController::ChatRoomViewController(TUIUserInfo user_info, QWidget *parent)
    : user_info_(user_info)
    , QWidget(parent)
    , view_dragger_(this) {
    ui_ = new Ui::ChatRoomViewController;
    ui_->setupUi(this);

    InitUi();
    InitConnect();
}

ChatRoomViewController::~ChatRoomViewController(){
    delete ui_;
}

void ChatRoomViewController::SetPopupMode(bool popup) {
    ui_->close_btn->setVisible(popup);
}

void ChatRoomViewController::InitUi() {
    LOAD_STYLE_SHEET(":/ChatRoomViewController/ChatRoomViewController/ChatRoomViewController.qss");
    setWindowFlags(windowFlags() | Qt::FramelessWindowHint | Qt::WindowCloseButtonHint);
    setGeometry(0, 0, 300, 800);
    ui_->message_list->setFocusPolicy(Qt::NoFocus);
    ui_->message_list->setVerticalScrollMode(QAbstractItemView::ScrollPerPixel);
    QRect rect = this->geometry();
    if (user_info_.role != TUIRole::kMaster) {
        ui_->all_mute_box->setVisible(false);
    }
    SetPopupMode(false);
    ui_->message_edit->setAlignment(Qt::AlignBottom | Qt::AlignVCenter);
    ui_->message_edit->installEventFilter(this);

    TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
    SlotOnChatMute(0, room_info.is_chat_room_muted, TUIMutedReason::kInitMute);
}

void ChatRoomViewController::InitConnect() {
    connect(ui_->send_btn, &QPushButton::clicked, this, &ChatRoomViewController::SlotSendChatMessage);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnReceiveChatMessage, this, &ChatRoomViewController::SlotOnReceiveMessage);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnRoomMasterChanged, this, &ChatRoomViewController::SlotOnRoomMasterChanged);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnChatRoomMuted, this, &ChatRoomViewController::SlotOnChatMute);
    connect(&MessageDispatcher::Instance(), &MessageDispatcher::SignalOnEnterRoom, this, [=](int code, const QString& message) {
        TUIRoomInfo room_info = TUIRoomCore::GetInstance()->GetRoomInfo();
        this->SlotOnChatMute(0, room_info.is_chat_room_muted, TUIMutedReason::kInitMute);
    });
    connect(ui_->all_mute_box, &QCheckBox::clicked, this, [=](bool checked) {
        if (checked) {
            TUIRoomCore::GetInstance()->MuteChatRoom(true);
        } else {
            TUIRoomCore::GetInstance()->MuteChatRoom(false);
        }
    });
    connect(ui_->close_btn, &QPushButton::clicked, this, [=]() {
        emit SignalShowChatRoom(false);
    });
}

void ChatRoomViewController::mouseMoveEvent(QMouseEvent* event) {
    view_dragger_.mouseMove(event);
    return QWidget::mouseMoveEvent(event);
}

void ChatRoomViewController::mousePressEvent(QMouseEvent* event) {
    if (ui_->close_btn->isVisible())
        view_dragger_.mousePress(event);
    return QWidget::mousePressEvent(event);
}

void ChatRoomViewController::mouseReleaseEvent(QMouseEvent* event) {
    view_dragger_.mouseRelease(event);
    return QWidget::mouseReleaseEvent(event);
}

void ChatRoomViewController::paintEvent(QPaintEvent* event) {
    QStyleOption opt;
    opt.init(this);
    QPainter p(this);
    style()->drawPrimitive(QStyle::PE_Widget, &opt, &p, this);
}

bool ChatRoomViewController::eventFilter(QObject* watched, QEvent* event) {
    if (watched == ui_->message_edit) {
        if (event->type() == QEvent::KeyPress) {
            QKeyEvent* key_event = static_cast<QKeyEvent*>(event);
            if (key_event->key() == Qt::Key_Enter || key_event->key() == Qt::Key_Return) {
                if (key_event->modifiers() == Qt::ControlModifier) {
                    QString text = ui_->message_edit->toPlainText() + '\n';
                    ui_->message_edit->setText(text);
                    QTextCursor cursor = ui_->message_edit->textCursor();
                    cursor.movePosition(QTextCursor::End);
                    ui_->message_edit->setTextCursor(cursor);
                } else {
                    SlotSendChatMessage();
                }
                return true;
            }
        }
    }
    return QWidget::eventFilter(watched, event);
}

void ChatRoomViewController::SlotSendChatMessage() {
    QString message = ui_->message_edit->toPlainText();
    if (message != tr("")) {
        ui_->message_edit->setText("");
        QString curTime = QString::number(QDateTime::currentDateTime().toTime_t()); // Ê±¼ä´Á

        handleMessageTime(curTime);
        ChatMessageView* message_view = new ChatMessageView(user_info_, ui_->message_list->parentWidget());
        QListWidgetItem* item = new QListWidgetItem(ui_->message_list);
        item->setFlags(Qt::NoItemFlags);
        handleMessageText(message_view, item, QString::fromStdString(user_info_.user_name), message, curTime, ChatMessageView::kUserSelf);
        TUIRoomCore::GetInstance()->SendChatMessage(message.toStdString());
        DataReport::Instance()->OperateReport(ReportType::kSendChatMessage);
        LINFO("SendChatMessage message :%s", message.toStdString().c_str());
    }
}

void ChatRoomViewController::SlotOnReceiveMessage(const QString& user_id, const QString& message) {
    LINFO("SlotOnReceiveMessage user_id :%s,  message :%s",
        user_id.toStdString().c_str(), message.toStdString().c_str());
    if (message != tr("")) {
        QString time = QString::number(QDateTime::currentDateTime().toTime_t());
        handleMessageTime(time);
        const TUIUserInfo* user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_id.toStdString());
        if (user_info == nullptr) {
            return;
        }
        ChatMessageView* message_view = new ChatMessageView(*user_info, ui_->message_list->parentWidget());
        QListWidgetItem* item = new QListWidgetItem(ui_->message_list);
        item->setFlags(Qt::NoItemFlags);
        handleMessageText(message_view, item, QString::fromStdString(user_info_.user_id), message, time, ChatMessageView::kUserOther);
    }
}

void ChatRoomViewController::SlotOnRoomMasterChanged(const QString& user_id) {
    if (user_id.toStdString() == user_info_.user_id) {
        ui_->all_mute_box->setVisible(true);
        ui_->message_edit->setEnabled(true);
        ui_->message_edit->setText(tr(""));
        ui_->send_btn->setEnabled(true);
        auto user_info = TUIRoomCore::GetInstance()->GetUserInfo(user_info_.user_id);
        if (user_info != nullptr) {
            user_info_ = *user_info;
        }
    }
}

void ChatRoomViewController::SlotOnChatMute(uint32_t request_id, bool mute, TUIMutedReason reason) {
    if (user_info_.role == TUIRole::kMaster) {
        return;
    }
    if (mute) {
        if (reason != TUIMutedReason::kInitMute) {
            TXMessageBox::Instance().AddLineTextMessage(tr("Admin forbid all users send message."));
        }
        ui_->message_edit->setEnabled(false);
        ui_->message_edit->setText(tr("All Mute"));
        ui_->send_btn->setEnabled(false);
    } else {
        if (reason != TUIMutedReason::kInitMute) {
            TXMessageBox::Instance().AddLineTextMessage(tr("Admin cancel forbid all users send message."));
        }
        ui_->message_edit->setEnabled(true);
        ui_->message_edit->setText(tr(""));
        ui_->send_btn->setEnabled(true);
    }
}

void ChatRoomViewController::handleMessageTime(QString message_time) {
    bool is_show_time = false;
    if (ui_->message_list->count() > 0) {
        QListWidgetItem* last_item = ui_->message_list->item(ui_->message_list->count() - 1);
        ChatMessageView* message_view = static_cast<ChatMessageView*>(ui_->message_list->itemWidget(last_item));

        int last_time = message_view->GetTimeInfo().toInt();
        int current_time = message_time.toInt();
        is_show_time = ((current_time - last_time) > 60);
    } else {
        is_show_time = true;
    }

    if (is_show_time) {
        ChatMessageView* message_time_view = new ChatMessageView(ui_->message_list->parentWidget());
        QListWidgetItem* item_time = new QListWidgetItem(ui_->message_list);
        item_time->setFlags(Qt::NoItemFlags);
        QSize size = QSize(this->width(), 20);
        message_time_view->resize(size);
        item_time->setSizeHint(size);
        message_time_view->SendChatMessage(message_time, message_time, ChatMessageView::kTime);
        ui_->message_list->setItemWidget(item_time, message_time_view);
    }
}

void ChatRoomViewController::handleMessageText(ChatMessageView* message_view, QListWidgetItem* item, const QString& user_name,
    const QString& text, const QString& time, ChatMessageView::MessageContextType type) {
    message_view->setFixedWidth(width()-5);
    QSize size = message_view->GetFontSize(text);
    item->setSizeHint(size);
    item->setFlags(Qt::NoItemFlags);
    message_view->SendChatMessage(text, time, type);
    ui_->message_list->setItemWidget(item, message_view);
    ui_->message_list->scrollToBottom();
}
