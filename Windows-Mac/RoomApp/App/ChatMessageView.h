#pragma once

#include <QWidget>
#include <QLabel>
#include "TUIRoomCore.h"

class ChatMessageView : public QWidget
{
    Q_OBJECT

public:
    enum MessageContextType {
        kUserSelf,   // 自己
        kUserOther,  // 其他用户
        kTime        // 时间
    };

    explicit ChatMessageView(TUIUserInfo user_info, QWidget* parent = nullptr);
    explicit ChatMessageView(QWidget* parent = nullptr);
    ~ChatMessageView();

    void SendChatMessage(const QString& message, const QString& time, MessageContextType user_type);
    QSize GetFontSize(QString message);

    inline QString GetUser() { return user_name_; }
    inline QString GetMessage() { return message_; }
    inline QString GetTimeInfo() { return time_info_; }
    inline MessageContextType GetUserType() { return message_type_; }

protected:
    void InitUi();

    QSize GetMessageString(QString src);
    QSize GetUserNameString(QString user_name);
    void paintEvent(QPaintEvent* event);

private:
    TUIUserInfo user_info_;

    QString user_name_;
    QString message_;
    QString time_info_;
    QString current_time_info_;
    MessageContextType message_type_;

    int text_width_;
    int frame_width_;
    int space_width_;
    int line_height_;
    int user_name_width_;

    QRect triangle_left_rect_;
    QRect triangle_right_rect_;
    QRect text_left_rect_;
    QRect text_right_rect_;
    QRect frame_left_rect_;
    QRect frame_right_rect_;
    QRect user_name_left_rect_;
    QRect user_name_right_rect_;
};
