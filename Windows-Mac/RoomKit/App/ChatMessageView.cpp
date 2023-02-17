#include <QPainter>
#include <QTime>
#include "ChatMessageView.h"

ChatMessageView::ChatMessageView(TUIUserInfo user_info, QWidget* parent)
    : user_info_(user_info)
    , QWidget(parent) {
    user_name_ = QString::fromStdString(user_info_.user_name);
    InitUi();
}

ChatMessageView::ChatMessageView(QWidget *parent)
    : QWidget(parent) {
    InitUi();
}

ChatMessageView::~ChatMessageView() {

}

void ChatMessageView::SendChatMessage(const QString& message, const QString& time, MessageContextType message_type) {
    message_ = message;
    time_info_ = time;
    message_type_ = message_type;
    current_time_info_ = QDateTime::fromTime_t(time.toInt()).toString("hh:mm");
}

QSize ChatMessageView::GetFontSize(QString message) {
    // right计算自己聊天显示的位置，left计算别人聊天显示的位置
    // right: Calculate the position of yourself during chat. left: Calculate the position of other users during chat
    message_ = message;
    int min_height = 50;
    int name_height = 20;
    int icon_width = 10;
    int icon_space_width = 10;
    int icon_rect_width = 5;
    int text_space_height = 2;
    int triangle_width = 6;
    int border_space = 20;
    int text_space_width = 5;
    frame_width_ = this->width() - border_space - 2 * (icon_width + icon_space_width + icon_rect_width);
    text_width_ = frame_width_ - 2 * text_space_width;
    space_width_ = this->width() - text_width_;

    // 用户名位置
    // Username position
    QSize user_name_size = GetUserNameString(user_name_);
    user_name_left_rect_ = QRect(icon_space_width, text_space_height, user_name_size.width() + text_space_width, user_name_size.height());
    user_name_right_rect_ = QRect(this->width() - icon_space_width - user_name_size.width() - text_space_width, text_space_height, user_name_size.width() + text_space_width, user_name_size.height());

    QSize size = GetMessageString(message_); // 整个的size

    int height = size.height() < min_height ? min_height : size.height();
    name_height = line_height_;

    // 三角形
    // Triangle
    triangle_left_rect_ = QRect(icon_width + icon_space_width + icon_rect_width, line_height_ / 4 + name_height, triangle_width, height - line_height_ / 2);
    triangle_right_rect_ = QRect(this->width() - icon_rect_width - icon_width - icon_space_width - triangle_width, line_height_ / 4 + name_height,
        triangle_width, height - line_height_ / 2);

    // 计算文字边框的位置
    // Calculate the text frame position
    if (size.width() < (text_width_ + space_width_)) {
        frame_left_rect_.setRect(triangle_left_rect_.x() + triangle_left_rect_.width(), line_height_ / 2 + name_height,
            size.width() - space_width_ + 2 * text_space_width, height - line_height_ / 2);
        frame_right_rect_.setRect(
            this->width() - size.width() + space_width_ - 2 * text_space_width - icon_width - icon_space_width - icon_rect_width - triangle_width,
            line_height_ / 2 + name_height, size.width() - space_width_ + 2 * text_space_width, height - line_height_ / 2);
    } else {
        frame_left_rect_.setRect(triangle_left_rect_.x() + triangle_left_rect_.width(), line_height_ / 2 + name_height, frame_width_, height - line_height_ / 2);
        frame_right_rect_.setRect(icon_width + border_space + icon_space_width + icon_rect_width - triangle_width, line_height_ / 2 + name_height,
            frame_width_, height - line_height_ / 2);
    }

    // 计算文字显示的位置
    // Calculate the text display position
    text_left_rect_.setRect(frame_left_rect_.x() + text_space_width, frame_left_rect_.y() + text_space_height,
        frame_left_rect_.width() - 2 * text_space_width, frame_left_rect_.height() - 2 * text_space_height);
    text_right_rect_.setRect(frame_right_rect_.x() + text_space_width, frame_right_rect_.y() + text_space_height,
        frame_right_rect_.width() - 2 * text_space_width, frame_right_rect_.height() - 2 * text_space_height);

    return QSize(size.width(), height + name_height);
}

void ChatMessageView::InitUi() {
    QFont current_font = font();
    current_font.setFamily("MicrosoftYaHei");
    current_font.setPixelSize(14);
    setFont(current_font);
}

QSize ChatMessageView::GetMessageString(QString src) {
    QFontMetricsF font_metrics(this->font());
    line_height_ = font_metrics.lineSpacing() + 3;
    int line_count = src.count("\n");
    int max_width = 0;
    if (line_count == 0) {
        max_width = font_metrics.width(src) < text_width_ ? font_metrics.width(src) : font_metrics.width(src);
        int line_length = 0;
        for (int i = 0; i < src.length(); ++i) {
            if (line_length + font_metrics.width(src[i]) > text_width_) {
                ++line_count;
                line_length = 0;
            }
            line_length += font_metrics.width(src[i]);
        }
    } else {
        int text_row_num = 0;
        for (int i = 0; i < (line_count + 1); i++) {
            QString value = src.split("\n").at(i);
            max_width = font_metrics.width(value) > max_width ? font_metrics.width(value) : max_width;
            int line_length = 0;
            for (int i = 0; i < value.length(); ++i) {
                if (line_length + font_metrics.width(value[i]) > text_width_) {
                    ++text_row_num;
                    line_length = 0;
                }
                line_length += font_metrics.width(value[i]);
            }
        }
        line_count += text_row_num;
    }

    return QSize(max_width + space_width_, (line_count + 1) * line_height_ + 1 * line_height_);
}

QSize ChatMessageView::GetUserNameString(QString user_name) {
    QFontMetricsF font_metrics(this->font());
    return QSize(font_metrics.width(user_name), font_metrics.lineSpacing());
}

void ChatMessageView::paintEvent(QPaintEvent* event)
{
    Q_UNUSED(event);

    QPainter painter(this);
    painter.setRenderHints(QPainter::Antialiasing | QPainter::SmoothPixmapTransform);
    painter.setPen(Qt::NoPen);
    painter.setBrush(QBrush(Qt::gray));

    if (message_type_ == MessageContextType::kUserOther) {
        QColor col_KuangB(234, 234, 234);
        painter.setBrush(QBrush(col_KuangB));
        painter.drawRoundedRect(frame_left_rect_.x() - 1, frame_left_rect_.y() - 1,
            frame_left_rect_.width() + 2, frame_left_rect_.height() + 2, 4, 4);

        QColor color_frame(255, 255, 255);
        painter.setBrush(QBrush(color_frame));
        painter.drawRoundedRect(frame_left_rect_, 4, 4);

        QPointF points[3] = { QPointF(triangle_left_rect_.x(), 25 + line_height_),
            QPointF(triangle_left_rect_.x() + triangle_left_rect_.width(), 20 + line_height_),
            QPointF(triangle_left_rect_.x() + triangle_left_rect_.width(), 30 + line_height_) };
        QPen pen;
        pen.setColor(color_frame);
        painter.setPen(pen);
        painter.drawPolygon(points, 3);

        QPen pen_text;
        pen_text.setColor(QColor(51, 51, 51));
        painter.setPen(pen_text);
        QTextOption option(Qt::AlignLeft | Qt::AlignVCenter);
        option.setWrapMode(QTextOption::WrapAnywhere);
        painter.setFont(this->font());
        painter.drawText(text_left_rect_, message_, option);

        QPen pen_user_name;
        pen_user_name.setColor(Qt::white);
        painter.setPen(pen_user_name);
        painter.setFont(this->font());
        painter.drawText(user_name_left_rect_, user_name_, option);
    } else if (message_type_ == MessageContextType::kUserSelf) {
        QColor col_Kuang(75, 164, 242);
        painter.setBrush(QBrush(col_Kuang));
        painter.drawRoundedRect(frame_right_rect_, 4, 4);

        QPointF points[3] = { QPointF(triangle_right_rect_.x() + triangle_right_rect_.width(), 25 + line_height_),
            QPointF(triangle_right_rect_.x(), 20 + line_height_),
            QPointF(triangle_right_rect_.x(), 30 + line_height_) };
        QPen pen;
        pen.setColor(col_Kuang);
        painter.setPen(pen);
        painter.drawPolygon(points, 3);

        QPen pen_text;
        pen_text.setColor(Qt::white);
        painter.setPen(pen_text);
        QTextOption option(Qt::AlignLeft | Qt::AlignVCenter);
        option.setWrapMode(QTextOption::WrapAnywhere);
        painter.setFont(this->font());
        painter.drawText(text_right_rect_, message_, option);

        QPen pen_user_name;
        pen_user_name.setColor(Qt::white);
        painter.setPen(pen_user_name);
        painter.setFont(this->font());
        painter.drawText(user_name_right_rect_, user_name_, option);
    } else if (message_type_ == MessageContextType::kTime) {
        QPen pen_text;
        pen_text.setColor(QColor(153, 153, 153));
        painter.setPen(pen_text);
        QTextOption option(Qt::AlignCenter);
        option.setWrapMode(QTextOption::WrapAtWordBoundaryOrAnywhere);
        QFont font = this->font();
        font.setFamily("MicrosoftYaHei");
        font.setPixelSize(14);
        painter.setFont(font);
        painter.drawText(this->rect(), current_time_info_, option);
    }
}
