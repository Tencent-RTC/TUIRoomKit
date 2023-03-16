#pragma once

#include <QWidget>
#include "ui_ChatRoomViewController.h"
#include "ChatMessageView.h"
#include "TUIRoomCore.h"
#include "ViewDragger.h"

class ChatRoomViewController : public QWidget
{
    Q_OBJECT

public:
    ChatRoomViewController(TUIUserInfo user_info, QWidget* parent = nullptr);
    ~ChatRoomViewController();

    void SetPopupMode(bool popup);
private:
    void InitUi();
    void InitConnect();
    void mouseMoveEvent(QMouseEvent* event);
    void mousePressEvent(QMouseEvent* event);
    void mouseReleaseEvent(QMouseEvent* event);
    void paintEvent(QPaintEvent* event);
    bool eventFilter(QObject* watched, QEvent* event);
    void handleMessageTime(QString message_time);
    void handleMessageText(ChatMessageView* message_view, QListWidgetItem* item, const QString& user_name,
        const QString& text, const QString& time, ChatMessageView::MessageContextType type);
public slots:
    void SlotSendChatMessage();
    void SlotOnReceiveMessage(const QString& user_id, const QString& message);
    void SlotOnRoomMasterChanged(const QString& user_id);
    void SlotOnChatMute(const QString& request_id, bool mute,
                        TUIMutedReason reason);
   signals:
    void SignalShowChatRoom(bool show);
private:
    Ui::ChatRoomViewController* ui_;
    TUIUserInfo user_info_;
    QPushButton* hide_btn_;
    ViewDragger view_dragger_;
};
