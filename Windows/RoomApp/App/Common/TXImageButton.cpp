#include "TXImageButton.h"
#include <QPixmap>

TXImageButton::TXImageButton(QWidget *parent)
    : QWidget(parent) {
    ui.setupUi(this);

    this->setStyleSheet("QLabel{background:transparent;} QPushButton{background:transparent;}");
    ui.left_widget->installEventFilter(this);

    connect(ui.btn_operate, &QPushButton::clicked, this, &TXImageButton::SignalSetClicked);

    SetOperateMenuVisible(false);
}

TXImageButton::~TXImageButton() {
}
void TXImageButton::SetText(QString text) {
    ui.lb_text->setText(text);
    SetTextColor("white");
}
void TXImageButton::SetButtonImage(QString image, QString hover_image, QString checked_image) {
    if (!image.isEmpty()) {
        button_image_ = image;
        SetImage(button_image_);
    }
    if (!hover_image.isEmpty()) {
        button_hover_image_ = hover_image;
    } else {
        button_hover_image_ = button_image_;
    }
    if (!checked_image.isEmpty()) {
        button_checked_image_ = checked_image;
    } else {
        button_checked_image_ = button_image_;
    }
}
void TXImageButton::SetButtonTextColor(QString sheet_color_normal, QString sheet_color_hover, QString sheet_color_checked) {
    sheet_color_normal_ = sheet_color_normal;
    sheet_color_hover_ = sheet_color_hover;
    sheet_color_checked_ = sheet_color_checked;
}
void TXImageButton::SetChecked(bool checked) {
    checked_ = checked;
    SetImage(checked_ ? button_checked_image_ : button_image_);
    SetTextColor(checked_ ? sheet_color_checked_ : sheet_color_normal_);
}
bool TXImageButton::isChecked() {
    return checked_;
}
void TXImageButton::SetOperateMenuVisible(bool visible) {
    ui.right_widget->setVisible(visible);
}

void TXImageButton::SetImage(QString button_image) {
    QPixmap pixmap(button_image);
    int width = ui.lb_image->width();
    int height = ui.lb_image->height();
    ui.lb_image->setPixmap(pixmap.scaled(width > height ? QSize(height, height) : QSize(height, height), \
        Qt::KeepAspectRatio, Qt::SmoothTransformation));
    this->update();
}
void TXImageButton::SetTextColor(QString sheet_color) {
    QString sheet = QString("color:%1; background:transparent;").arg(sheet_color);
    ui.lb_text->setStyleSheet(sheet);
    this->update();
}
bool TXImageButton::eventFilter(QObject *watched, QEvent *event) {
    if (watched == ui.left_widget) {
        if ((event->type() == QEvent::Enter || event->type() == QEvent::MouseMove) && !checked_) {
            SetImage(button_hover_image_);
            SetTextColor(sheet_color_hover_);
        } else if (event->type() == QEvent::Leave && !checked_) {
            SetImage(button_image_);
            SetTextColor(sheet_color_normal_);
        }

        if (event->type() == QEvent::MouseButtonPress) {
            checked_ = !checked_;
            emit clicked(checked_);
        } else if (event->type() == QEvent::MouseButtonRelease) {
            SetImage(checked_ ? button_checked_image_ : button_hover_image_);
            SetTextColor(checked_ ? sheet_color_checked_ : sheet_color_hover_);
        }
    }
    return QWidget::eventFilter(watched, event);
}
void TXImageButton::showEvent(QShowEvent *event) {
    SetImage(checked_ ? button_checked_image_ : button_image_);

    QString sheet = "QPushButton{background:transparent; background-image:url(:/BottomBarController/BottomBarController/triangle.png);\
                                 background-repeat:no-repeat; background-position:center;}\
                    QPushButton:hover, QPushButton:pressed{background:transparent; background-image:url(:/BottomBarController/BottomBarController/triangle_h.png);\
                                background-repeat:no-repeat; background-position:center;}";
    ui.btn_operate->setStyleSheet(sheet);

    return QWidget::showEvent(event);
}
void TXImageButton::resizeEvent(QResizeEvent *event) {
    SetImage(checked_ ? button_checked_image_ : button_image_);
    return QWidget::resizeEvent(event);
}

